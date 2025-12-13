"""프롬프트 패턴 분석 서비스"""

import asyncio
import json
import uuid
import logging
from datetime import datetime
from pathlib import Path

from config import config
from models.analysis import Analysis, AnalysisListItem, AnalysisRequest
from services.cache import cache_manager, CACHE_ANALYSES
from services.common import (
    SKIP_PATTERNS,
    CHUNK_SIZE_BYTES,
    CLAUDE_MODEL,
    is_system_message,
    extract_summary,
    get_project_name,
    save_prompts_to_file,
    parse_stream_event,
)
from services.common.utils import clean_content

logger = logging.getLogger(__name__)


# 청크별 분석 템플릿
CHUNK_ANALYSIS_TEMPLATE = """
# 프롬프트 패턴 분석 (청크 {chunk_num}/{total_chunks})

아래는 사용자가 AI 어시스턴트에게 보낸 프롬프트 목록의 일부입니다.
이 프롬프트들을 분석하여 패턴을 파악해주세요.

## 분석 항목
1. 요청 유형 분류 (코드 작성, 버그 수정, 리팩토링, 설명 요청, 문서 작성 등)
2. 각 유형별 개수
3. 주요 키워드/문구
4. 장점과 단점 패턴
5. 특이사항

## 출력 형식
- 간결한 JSON 형식으로 출력
- 예시: {{"types": {{"코드작성": 10, "버그수정": 5}}, "keywords": ["리팩토링", "테스트"], "strengths": ["명확한 요청"], "weaknesses": ["컨텍스트 부족"], "notes": "..."}}

## 프롬프트 목록
"""

# 최종 종합 분석 템플릿
FINAL_ANALYSIS_TEMPLATE = """
# 프롬프트 패턴 종합 분석

아래는 {total_prompts}개 프롬프트를 {total_chunks}개 청크로 나누어 분석한 결과입니다.
이 결과들을 종합하여 최종 분석 리포트를 작성해주세요.

## 청크별 분석 결과
{chunk_results}

## 최종 리포트 작성 항목

### 1. 요청 패턴 분류
- 프롬프트를 유형별로 분류하고 백분율 표시
- 자주 사용하는 키워드나 문구 식별

### 2. 컨텍스트 제공 방식
- 배경 정보를 어떻게 제공하는지 분석
- 요구사항의 명확성 수준

### 3. 장점
- 효과적인 프롬프트 작성 습관
- AI가 이해하기 쉬운 구조적 패턴

### 4. 단점
- 모호하거나 불명확한 요청 패턴
- 반복적으로 나타나는 비효율적 패턴

### 5. 개선 제안
- 구체적이고 실행 가능한 개선 방법
- Before/After 예시 포함

### 6. 통계 요약
- 총 프롬프트 수: {total_prompts}
- 가장 빈번한 요청 유형 Top 3

## 출력 형식
- 마크다운 형식으로 작성
- 각 섹션에 적절한 헤딩 사용
"""


class AnalysisService:
    """프롬프트 패턴 분석 서비스"""

    STORAGE_DIR = Path.home() / ".claude-monitor"
    ANALYSES_DIR = STORAGE_DIR / "analyses"

    def __init__(self):
        self.ANALYSES_DIR.mkdir(parents=True, exist_ok=True)
        logger.debug(f"AnalysisService initialized. Storage: {self.STORAGE_DIR}")

    def _find_session_file(self, session_id: str) -> Path | None:
        """세션 ID로 JSONL 파일 찾기"""
        for project_dir in config.PROJECTS_DIR.iterdir():
            if not project_dir.is_dir():
                continue
            session_file = project_dir / f"{session_id}.jsonl"
            if session_file.exists():
                return session_file
        return None

    def _get_projects_from_sessions(self, session_ids: list[str]) -> set[str]:
        """세션 ID들로부터 프로젝트 ID 추출"""
        project_ids = set()
        for session_id in session_ids:
            session_file = self._find_session_file(session_id)
            if session_file:
                # 세션 파일의 부모 디렉토리 이름이 프로젝트 ID
                project_ids.add(session_file.parent.name)
        return project_ids

    def _get_project_name_for_sessions(self, project_id: str | None, session_ids: list[str]) -> str:
        """분석할 세션들의 프로젝트 이름 반환"""
        if project_id:
            return get_project_name(project_id)

        # project_id가 없으면 세션들의 프로젝트를 확인
        project_ids = self._get_projects_from_sessions(session_ids)
        if len(project_ids) == 1:
            return get_project_name(list(project_ids)[0])
        elif len(project_ids) > 1:
            names = [get_project_name(pid) for pid in project_ids]
            return f"Multiple Projects ({', '.join(sorted(names))})"
        return "Unknown"

    def _extract_prompts_from_session(self, session_file: Path) -> list[dict]:
        """세션 파일에서 사용자 프롬프트 추출"""
        prompts = []
        try:
            with open(session_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                        if (
                            data.get("type") == "user"
                            and isinstance(data.get("message"), dict)
                            and data["message"].get("role") == "user"
                            and isinstance(data["message"].get("content"), str)
                        ):
                            content = data["message"]["content"].strip()
                            if is_system_message(content) or not content:
                                continue
                            prompts.append({
                                "content": content,
                                "timestamp": data.get("timestamp", ""),
                            })
                    except json.JSONDecodeError:
                        continue
        except (IOError, OSError) as e:
            logger.error(f"Failed to read session file {session_file}: {e}")
        return prompts

    def _extract_prompts(self, session_ids: list[str]) -> list[dict]:
        """여러 세션에서 프롬프트 추출"""
        all_prompts = []
        for session_id in session_ids:
            session_file = self._find_session_file(session_id)
            if session_file:
                prompts = self._extract_prompts_from_session(session_file)
                all_prompts.extend(prompts)
        # 시간순 정렬
        all_prompts.sort(key=lambda x: x.get("timestamp", ""))
        return all_prompts

    def _format_prompt_content(self, prompts: list[dict]) -> str:
        """프롬프트를 텍스트로 포맷팅 (최소 용량)"""
        lines = []
        for p in prompts:
            content = p.get("content", "").strip()
            content = clean_content(content)
            if content:
                lines.append(content)
        return "\n---\n".join(lines)

    def _split_into_chunks(self, prompts: list[dict]) -> list[list[dict]]:
        """프롬프트를 청크로 분할"""
        chunks = []
        current_chunk = []
        current_size = 0

        for prompt in prompts:
            content = prompt.get("content", "")
            prompt_size = len(content.encode("utf-8"))

            if current_size + prompt_size > CHUNK_SIZE_BYTES and current_chunk:
                chunks.append(current_chunk)
                current_chunk = []
                current_size = 0

            current_chunk.append(prompt)
            current_size += prompt_size

        if current_chunk:
            chunks.append(current_chunk)

        return chunks

    async def _analyze_chunk_stream(self, chunk_prompts: list[dict], chunk_num: int, total_chunks: int, model: str | None = None):
        """단일 청크 분석 (스트리밍)"""
        prompt_content = self._format_prompt_content(chunk_prompts)
        full_prompt = CHUNK_ANALYSIS_TEMPLATE.format(
            chunk_num=chunk_num,
            total_chunks=total_chunks
        ) + prompt_content

        prompt_file = save_prompts_to_file(full_prompt, "analysis", self.STORAGE_DIR)

        use_model = model or CLAUDE_MODEL
        shell_cmd = (
            f'cat "{prompt_file}" | claude '
            f'--model {use_model} '
            f'--output-format stream-json '
            f'--verbose '
            f'--include-partial-messages '
            f'-p'
        )

        logger.info(f"[Analysis] Analyzing chunk {chunk_num}/{total_chunks} with model {use_model}...")

        process = await asyncio.create_subprocess_shell(
            shell_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        result = ""
        while True:
            line = await process.stdout.readline()
            if not line:
                break

            try:
                data = json.loads(line.decode().strip())
                text = parse_stream_event(data)
                if text:
                    result += text
                    yield text
            except json.JSONDecodeError:
                pass

        await process.wait()

        if process.returncode != 0:
            stderr = await process.stderr.read()
            error_msg = stderr.decode() if stderr else "Unknown error"
            logger.error(f"Chunk {chunk_num} analysis failed: {error_msg[:200]}")

    async def _run_claude_cli(self, prompts: list[dict], model: str | None = None) -> str:
        """claude CLI로 분석 실행 (청크 기반)"""
        # 청크 기반 분석으로 대체
        result = ""
        async for chunk in self._run_chunked_analysis_stream(prompts, model):
            result += chunk
        return result

    async def _run_chunked_analysis_stream(self, prompts: list[dict], model: str | None = None):
        """청크 분할 방식으로 분석 실행 (스트리밍)"""
        import time
        start_time = time.time()

        use_model = model or CLAUDE_MODEL

        # 청크 분할
        chunks = self._split_into_chunks(prompts)
        total_chunks = len(chunks)
        logger.info(f"[Analysis] Split into {total_chunks} chunks")

        yield f"## 분석 시작\n\n{len(prompts)}개 프롬프트를 {total_chunks}개 청크로 분할하여 분석합니다.\n\n"

        # 각 청크 분석 (스트리밍)
        chunk_results = []
        for i, chunk in enumerate(chunks, 1):
            yield f"### 청크 {i}/{total_chunks} 분석 ({len(chunk)}개 프롬프트)\n\n"

            chunk_result = ""
            async for text in self._analyze_chunk_stream(chunk, i, total_chunks, model):
                chunk_result += text
                yield text

            chunk_results.append(f"### 청크 {i}\n{chunk_result}")

            yield f"\n\n"
            logger.info(f"[Analysis] Chunk {i}/{total_chunks} completed")

        # 최종 종합 분석
        yield f"---\n\n## 종합 분석 진행 중...\n\n"

        final_prompt = FINAL_ANALYSIS_TEMPLATE.format(
            total_prompts=len(prompts),
            total_chunks=total_chunks,
            chunk_results="\n\n".join(chunk_results)
        )

        prompt_file = save_prompts_to_file(final_prompt, "analysis_final", self.STORAGE_DIR)

        shell_cmd = (
            f'cat "{prompt_file}" | claude '
            f'--model {use_model} '
            f'--output-format stream-json '
            f'--verbose '
            f'--include-partial-messages '
            f'-p'
        )

        logger.info(f"[Analysis] Running final analysis with model {use_model}...")

        process = await asyncio.create_subprocess_shell(
            shell_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        # 스트리밍 출력
        while True:
            line = await process.stdout.readline()
            if not line:
                break

            try:
                data = json.loads(line.decode().strip())
                text = parse_stream_event(data)
                if text:
                    yield text
            except json.JSONDecodeError:
                pass

        await process.wait()
        total_time = time.time() - start_time
        logger.info(f"[Analysis] Total completed in {total_time:.1f}s")

    def prepare_analysis(self, request: AnalysisRequest) -> tuple[list[dict], str]:
        """분석 준비: 프롬프트 추출 및 내용 포맷팅"""
        prompts = self._extract_prompts(request.session_ids)
        if not prompts:
            raise ValueError("분석할 프롬프트가 없습니다.")

        prompt_content = self._format_prompt_content(prompts)

        # 디버그 로깅: 프롬프트 크기 정보
        total_chars = len(prompt_content)
        logger.info(f"[Analysis] Prompts: {len(prompts)}, Total chars: {total_chars:,}, Avg per prompt: {total_chars // len(prompts):,}")

        return prompts, prompt_content

    def _save_analysis(
        self,
        request: AnalysisRequest,
        prompt_count: int,
        result: str,
        analysis_id: str | None = None,
        model: str | None = None,
    ) -> Analysis:
        """분석 결과 저장"""
        if analysis_id is None:
            analysis_id = str(uuid.uuid4())

        now = datetime.now()
        project_name = self._get_project_name_for_sessions(request.project_id, request.session_ids)
        use_model = model or request.model or CLAUDE_MODEL

        analysis = Analysis(
            id=analysis_id,
            project_id=request.project_id,
            project_name=project_name,
            session_ids=request.session_ids,
            prompt_count=prompt_count,
            result=result,
            model=use_model,
            created_at=now,
            updated_at=now,
        )

        analysis_file = self.ANALYSES_DIR / f"{analysis_id}.json"
        with open(analysis_file, "w", encoding="utf-8") as f:
            f.write(analysis.model_dump_json(indent=2))

        # 캐시 무효화
        cache_manager.clear(CACHE_ANALYSES)
        logger.debug(f"Saved analysis: {analysis_file}")
        return analysis

    def _load_analysis(self, analysis_id: str) -> Analysis | None:
        """분석 결과 로드"""
        analysis_file = self.ANALYSES_DIR / f"{analysis_id}.json"
        if not analysis_file.exists():
            return None

        with open(analysis_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        return Analysis(**data)

    async def analyze(self, request: AnalysisRequest) -> Analysis:
        """프롬프트 분석 실행"""
        logger.debug(
            f"Starting analysis for project {request.project_id}, "
            f"sessions: {len(request.session_ids)}, model: {request.model}"
        )

        # 1. 프롬프트 추출
        prompts = self._extract_prompts(request.session_ids)
        if not prompts:
            raise ValueError("분석할 프롬프트가 없습니다.")

        logger.debug(f"Extracted {len(prompts)} prompts")

        # 2. Claude CLI 실행 (청크 기반)
        result = await self._run_claude_cli(prompts, request.model)

        # 3. 분석 결과 저장
        analysis = self._save_analysis(request, len(prompts), result, model=request.model)

        return analysis

    async def reanalyze(self, analysis_id: str, model: str | None = None) -> Analysis:
        """기존 분석 재실행"""
        existing = self._load_analysis(analysis_id)
        if not existing:
            raise ValueError(f"분석을 찾을 수 없습니다: {analysis_id}")

        # 새 모델이 지정되지 않으면 기존 모델 사용
        use_model = model or existing.model

        request = AnalysisRequest(
            project_id=existing.project_id,
            session_ids=existing.session_ids,
            model=use_model,
        )

        # 프롬프트 추출
        prompts = self._extract_prompts(request.session_ids)
        if not prompts:
            raise ValueError("분석할 프롬프트가 없습니다.")

        # Claude CLI 실행 (청크 기반)
        result = await self._run_claude_cli(prompts, use_model)

        # 기존 분석 업데이트
        analysis = self._save_analysis(
            request, len(prompts), result, analysis_id=analysis_id, model=use_model
        )
        return analysis

    def list_analyses(self, project_id: str | None = None) -> list[AnalysisListItem]:
        """저장된 분석 목록 조회 (캐싱 적용)"""
        cache_key = f"list:{project_id or 'all'}"
        cached = cache_manager.get(CACHE_ANALYSES, cache_key)
        if cached is not None:
            return cached

        analyses = []

        for analysis_file in self.ANALYSES_DIR.glob("*.json"):
            try:
                with open(analysis_file, "r", encoding="utf-8") as f:
                    data = json.load(f)

                # 프로젝트 필터
                if project_id and data.get("project_id") != project_id:
                    continue

                analyses.append(
                    AnalysisListItem(
                        id=data["id"],
                        project_id=data["project_id"],
                        project_name=data.get("project_name", ""),
                        session_count=len(data.get("session_ids", [])),
                        prompt_count=data.get("prompt_count", 0),
                        created_at=datetime.fromisoformat(data["created_at"]),
                        summary=extract_summary(data.get("result", "")),
                    )
                )
            except (json.JSONDecodeError, KeyError) as e:
                logger.error(f"Failed to load analysis {analysis_file}: {e}")
                continue

        # 최신순 정렬
        analyses.sort(key=lambda x: x.created_at, reverse=True)
        cache_manager.set(CACHE_ANALYSES, cache_key, analyses)
        return analyses

    def get_analysis(self, analysis_id: str) -> Analysis | None:
        """분석 상세 조회 (캐싱 적용)"""
        cache_key = f"detail:{analysis_id}"
        cached = cache_manager.get(CACHE_ANALYSES, cache_key)
        if cached is not None:
            return cached

        result = self._load_analysis(analysis_id)
        if result:
            cache_manager.set(CACHE_ANALYSES, cache_key, result)
        return result

    def delete_analysis(self, analysis_id: str) -> bool:
        """분석 삭제"""
        analysis_file = self.ANALYSES_DIR / f"{analysis_id}.json"
        if analysis_file.exists():
            analysis_file.unlink()
            # 캐시 무효화
            cache_manager.clear(CACHE_ANALYSES)
            logger.debug(f"Deleted analysis: {analysis_id}")
            return True
        return False


# 싱글톤 인스턴스
analysis_service = AnalysisService()
