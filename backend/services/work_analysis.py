"""업무분석 서비스"""

import asyncio
import json
import uuid
import logging
from datetime import datetime
from pathlib import Path

from config import config
from models.work_analysis import WorkAnalysis, WorkAnalysisListItem, WorkAnalysisRequest
from services.common import (
    CHUNK_SIZE_BYTES,
    CLAUDE_MODEL,
    is_system_message,
    extract_summary,
    get_project_name,
    format_size,
    save_prompts_to_file,
    parse_stream_event,
)
from services.common.utils import clean_content

logger = logging.getLogger(__name__)


# 청크별 분석 템플릿
CHUNK_ANALYSIS_TEMPLATE = """
# 업무분석 (청크 {chunk_num}/{total_chunks})

다음은 {date_range} 기간의 Claude Code 세션 로그 일부입니다.
프로젝트: {project_names}

이 세션들을 분석하여 다음을 JSON 형식으로 출력해주세요:
1. 수행한 작업 목록
2. 미완료/TODO 작업
3. 주요 키워드

## 출력 형식
- 간결한 JSON 형식
- 예시: {{"tasks": ["기능A 구현", "버그B 수정"], "todos": ["테스트 작성"], "keywords": ["리팩토링", "API"]}}

## 세션 데이터
"""

# 최종 종합 분석 템플릿
FINAL_ANALYSIS_TEMPLATE = """
# 업무분석 종합

{date_range} 기간 동안 진행한 작업을 종합 분석합니다.
프로젝트: {project_names}
총 세션 수: {session_count}개

## 청크별 분석 결과
{chunk_results}

## 최종 리포트 작성

위 청크별 분석 결과를 종합하여 다음 형식으로 정리해주세요:

### 오늘 수행한 작업
프로젝트별로 수행한 작업을 정리합니다.
- 구현한 기능
- 수정한 버그
- 리팩토링 내용
- 기타 작업

### 다음 해야할 작업
분석된 세션에서 파악된 미완료 작업이나 후속 작업을 정리합니다.
- 명시적으로 언급된 TODO
- 미완료된 작업
- 개선이 필요한 부분
- 권장되는 후속 작업

### 요약
- 주요 성과를 간단히 정리
- 전반적인 진행 상황 평가

## 출력 형식
- 마크다운 형식으로 작성
- 각 섹션에 적절한 헤딩 사용
"""

# 단일 청크용 템플릿 (데이터가 작을 때)
SINGLE_ANALYSIS_TEMPLATE = """
# 업무분석 요청

다음은 {date_range} 기간 동안 진행한 Claude Code 세션 로그입니다.
프로젝트: {project_names}
총 세션 수: {session_count}개

이 세션들을 분석하여 다음 형식으로 정리해주세요:

## 오늘 수행한 작업
프로젝트별로 수행한 작업을 정리합니다.
- 구현한 기능
- 수정한 버그
- 리팩토링 내용
- 기타 작업

## 다음 해야할 작업
분석된 세션에서 파악된 미완료 작업이나 후속 작업을 정리합니다.
- 명시적으로 언급된 TODO
- 미완료된 작업
- 개선이 필요한 부분
- 권장되는 후속 작업

## 요약
- 주요 성과를 간단히 정리
- 전반적인 진행 상황 평가

---
## 세션 데이터

"""


class WorkAnalysisService:
    """업무분석 서비스"""

    STORAGE_DIR = Path.home() / ".claude-monitor"
    ANALYSES_DIR = STORAGE_DIR / "work_analyses"

    def __init__(self):
        self.ANALYSES_DIR.mkdir(parents=True, exist_ok=True)
        logger.debug(f"WorkAnalysisService initialized. Storage: {self.STORAGE_DIR}")

    def _parse_date(self, date_str: str) -> datetime:
        """YYYY-MM-DD 문자열을 datetime으로 변환"""
        return datetime.strptime(date_str, "%Y-%m-%d")

    def _get_sessions_in_date_range(
        self, date_from: str, date_to: str, project_ids: list[str] | None = None
    ) -> list[dict]:
        """날짜 범위 내의 세션 목록 반환"""
        from_dt = self._parse_date(date_from)
        to_dt = self._parse_date(date_to).replace(hour=23, minute=59, second=59)

        sessions = []

        for project_dir in config.PROJECTS_DIR.iterdir():
            if not project_dir.is_dir():
                continue

            project_id = project_dir.name

            # 프로젝트 필터
            if project_ids and project_id not in project_ids:
                continue

            for session_file in project_dir.glob("*.jsonl"):
                try:
                    mtime = datetime.fromtimestamp(session_file.stat().st_mtime)
                    if from_dt <= mtime <= to_dt:
                        sessions.append({
                            "project_id": project_id,
                            "project_name": get_project_name(project_id),
                            "session_id": session_file.stem,
                            "session_file": session_file,
                            "updated_at": mtime,
                        })
                except (OSError, IOError) as e:
                    logger.error(f"Failed to check session file {session_file}: {e}")
                    continue

        # 시간순 정렬
        sessions.sort(key=lambda x: x["updated_at"])
        return sessions

    def get_sessions_by_date_range(
        self, date_from: str, date_to: str, project_ids: list[str] | None = None
    ) -> list[dict]:
        """날짜 범위별 세션 목록 반환 (프로젝트별 그룹핑)"""
        sessions = self._get_sessions_in_date_range(date_from, date_to, project_ids)

        # 프로젝트별 그룹핑
        project_sessions = {}
        for session in sessions:
            pid = session["project_id"]
            if pid not in project_sessions:
                project_sessions[pid] = {
                    "project_id": pid,
                    "project_name": session["project_name"],
                    "sessions": [],
                }
            project_sessions[pid]["sessions"].append({
                "id": session["session_id"],
                "project_id": pid,
                "filename": f"{session['session_id']}.jsonl",
                "size": session["session_file"].stat().st_size,
                "size_human": format_size(session["session_file"].stat().st_size),
                "updated_at": session["updated_at"].isoformat(),
                "is_agent": False,
            })

        return list(project_sessions.values())

    def _extract_messages_from_session(self, session_file: Path) -> list[dict]:
        """세션 파일에서 메시지 추출"""
        messages = []
        try:
            with open(session_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                        msg_type = data.get("type")

                        if msg_type == "user":
                            message = data.get("message", {})
                            content = message.get("content", "")
                            if isinstance(content, str) and content.strip():
                                if is_system_message(content):
                                    continue
                                messages.append({
                                    "role": "user",
                                    "content": content.strip(),
                                    "timestamp": data.get("timestamp", ""),
                                })

                        elif msg_type == "assistant":
                            message = data.get("message", {})
                            content_blocks = message.get("content", [])
                            text_parts = []
                            for block in content_blocks:
                                if isinstance(block, dict) and block.get("type") == "text":
                                    text_parts.append(block.get("text", ""))
                            if text_parts:
                                messages.append({
                                    "role": "assistant",
                                    "content": "\n".join(text_parts),
                                    "timestamp": data.get("timestamp", ""),
                                })

                    except json.JSONDecodeError:
                        continue
        except (IOError, OSError) as e:
            logger.error(f"Failed to read session file {session_file}: {e}")
        return messages

    def _format_session_content(self, session: dict, messages: list[dict]) -> str:
        """세션 내용을 텍스트로 포맷팅"""
        lines = [
            f"### 프로젝트: {session['project_name']}",
            f"세션 ID: {session['session_id']}",
            f"수정일: {session['updated_at'].strftime('%Y-%m-%d %H:%M')}",
            "",
        ]

        for msg in messages:
            role = "User" if msg["role"] == "user" else "Assistant"
            content = clean_content(msg["content"])
            # 내용이 너무 길면 요약
            if len(content) > 2000:
                content = content[:2000] + "... (truncated)"
            lines.append(f"**{role}:**\n{content}\n")

        return "\n".join(lines)

    def _split_into_chunks(self, sessions_content: list[str]) -> list[str]:
        """세션 내용을 청크로 분할"""
        chunks = []
        current_chunk = []
        current_size = 0

        for content in sessions_content:
            content_size = len(content.encode("utf-8"))

            if current_size + content_size > CHUNK_SIZE_BYTES and current_chunk:
                chunks.append("\n\n---\n\n".join(current_chunk))
                current_chunk = []
                current_size = 0

            current_chunk.append(content)
            current_size += content_size

        if current_chunk:
            chunks.append("\n\n---\n\n".join(current_chunk))

        return chunks

    async def _run_claude_cli_stream(self, prompt_content: str, model: str | None = None):
        """Claude CLI 실행 (스트리밍)"""
        prompt_file = save_prompts_to_file(prompt_content, "work_analysis", self.STORAGE_DIR)

        use_model = model or CLAUDE_MODEL
        shell_cmd = (
            f'cat "{prompt_file}" | claude '
            f'--model {use_model} '
            f'--output-format stream-json '
            f'--verbose '
            f'--include-partial-messages '
            f'-p'
        )

        logger.info(f"[WorkAnalysis] Starting Claude CLI with model {use_model}...")

        process = await asyncio.create_subprocess_shell(
            shell_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

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

        if process.returncode != 0:
            stderr = await process.stderr.read()
            error_msg = stderr.decode() if stderr else "Unknown error"
            logger.error(f"[WorkAnalysis] CLI failed: {error_msg[:200]}")

    async def _analyze_chunk_stream(
        self,
        chunk_content: str,
        chunk_num: int,
        total_chunks: int,
        date_range: str,
        project_names: str,
        model: str | None = None,
    ):
        """단일 청크 분석 (스트리밍)"""
        prompt = CHUNK_ANALYSIS_TEMPLATE.format(
            chunk_num=chunk_num,
            total_chunks=total_chunks,
            date_range=date_range,
            project_names=project_names,
        ) + chunk_content

        logger.info(
            f"[WorkAnalysis] Analyzing chunk {chunk_num}/{total_chunks} "
            f"({len(prompt):,} chars)"
        )

        async for text in self._run_claude_cli_stream(prompt, model):
            yield text

    async def _run_final_analysis_stream(
        self,
        chunk_results: list[str],
        date_range: str,
        project_names: str,
        session_count: int,
        model: str | None = None,
    ):
        """청크 결과를 종합하여 최종 분석 (스트리밍)"""
        # 청크별 결과 포맷팅
        formatted_results = []
        for i, result in enumerate(chunk_results, 1):
            formatted_results.append(f"### 청크 {i} 분석 결과\n{result}")

        prompt = FINAL_ANALYSIS_TEMPLATE.format(
            date_range=date_range,
            project_names=project_names,
            session_count=session_count,
            chunk_results="\n\n".join(formatted_results),
        )

        logger.info(
            f"[WorkAnalysis] Running final analysis "
            f"({len(chunk_results)} chunks, {len(prompt):,} chars)"
        )

        async for text in self._run_claude_cli_stream(prompt, model):
            yield text

    async def run_chunked_analysis_stream(
        self,
        request: WorkAnalysisRequest,
        on_chunk_start=None,
        on_chunk_complete=None,
    ):
        """청크 기반 업무분석 실행 (스트리밍)

        Args:
            request: 분석 요청
            on_chunk_start: 청크 시작 콜백 (chunk_num, total_chunks)
            on_chunk_complete: 청크 완료 콜백 (chunk_num, total_chunks)

        Yields:
            dict: {type: "chunk_info" | "text", ...}
        """
        # 1. 분석 데이터 준비
        sessions, project_names, sessions_content, date_range = self.prepare_analysis_data(request)
        project_names_str = ", ".join(sorted(project_names))
        model = request.model

        # 2. 전체 크기 확인
        total_size = sum(len(c.encode("utf-8")) for c in sessions_content)
        logger.info(f"[WorkAnalysis] Total content size: {total_size:,} bytes, model: {model or CLAUDE_MODEL}")

        # 3. 청크 분할
        chunks = self._split_into_chunks(sessions_content)
        total_chunks = len(chunks)

        logger.info(f"[WorkAnalysis] Split into {total_chunks} chunks")

        # 4. 단일 청크인 경우 바로 분석
        if total_chunks == 1:
            yield {
                "type": "chunk_info",
                "current_chunk": 1,
                "total_chunks": 1,
                "phase": "single",
            }

            prompt = SINGLE_ANALYSIS_TEMPLATE.format(
                date_range=date_range,
                project_names=project_names_str,
                session_count=len(sessions),
            ) + chunks[0]

            async for text in self._run_claude_cli_stream(prompt, model):
                yield {"type": "text", "content": text}

            yield {
                "type": "phase_complete",
                "phase": "single",
                "sessions": sessions,
                "project_names": project_names,
            }
            return

        # 5. 다중 청크 분석
        chunk_results = []

        for i, chunk in enumerate(chunks, 1):
            yield {
                "type": "chunk_info",
                "current_chunk": i,
                "total_chunks": total_chunks,
                "phase": "chunk_analysis",
            }

            if on_chunk_start:
                on_chunk_start(i, total_chunks)

            # 청크 분석 (스트리밍)
            result = ""
            async for text in self._analyze_chunk_stream(
                chunk, i, total_chunks, date_range, project_names_str, model
            ):
                result += text
                yield {"type": "text", "content": text}

            chunk_results.append(result)

            if on_chunk_complete:
                on_chunk_complete(i, total_chunks)

            yield {
                "type": "chunk_complete",
                "current_chunk": i,
                "total_chunks": total_chunks,
            }

        # 6. 최종 종합 분석
        yield {
            "type": "chunk_info",
            "current_chunk": total_chunks,
            "total_chunks": total_chunks,
            "phase": "final_analysis",
        }

        async for text in self._run_final_analysis_stream(
            chunk_results, date_range, project_names_str, len(sessions), model
        ):
            yield {"type": "text", "content": text}

        yield {
            "type": "phase_complete",
            "phase": "final_analysis",
            "sessions": sessions,
            "project_names": project_names,
        }

    def prepare_analysis_data(
        self, request: WorkAnalysisRequest
    ) -> tuple[list[dict], list[str], list[str], str]:
        """분석 데이터 준비: 세션 추출 및 내용 포맷팅 (청크용)

        Returns:
            sessions: 세션 정보 목록
            project_names: 프로젝트 이름 목록
            sessions_content: 세션별 포맷팅된 내용 목록
            date_range: 날짜 범위 문자열
        """
        sessions = self._get_sessions_in_date_range(
            request.date_from, request.date_to, request.project_ids
        )

        if not sessions:
            raise ValueError("분석할 세션이 없습니다.")

        # 세션별 메시지 추출 및 포맷팅
        sessions_content = []
        for session in sessions:
            messages = self._extract_messages_from_session(session["session_file"])
            if messages:
                content = self._format_session_content(session, messages)
                sessions_content.append(content)

        if not sessions_content:
            raise ValueError("분석할 내용이 없습니다.")

        # 프로젝트 이름 추출
        project_names = list(set(s["project_name"] for s in sessions))

        # 날짜 범위 문자열
        if request.date_from == request.date_to:
            date_range = request.date_from
        else:
            date_range = f"{request.date_from} ~ {request.date_to}"

        logger.info(
            f"[WorkAnalysis] Prepared: {len(sessions)} sessions, "
            f"{len(sessions_content)} contents, projects: {project_names}"
        )

        return sessions, project_names, sessions_content, date_range

    def prepare_analysis(self, request: WorkAnalysisRequest) -> tuple[list[dict], list[str], str]:
        """분석 준비: 세션 추출 및 내용 포맷팅 (단일 프롬프트 생성)"""
        sessions, project_names, sessions_content, date_range = self.prepare_analysis_data(request)

        # 프롬프트 생성
        full_prompt = SINGLE_ANALYSIS_TEMPLATE.format(
            date_range=date_range,
            project_names=", ".join(sorted(project_names)),
            session_count=len(sessions),
        ) + "\n\n---\n\n".join(sessions_content)

        logger.info(
            f"[WorkAnalysis] Full prompt: {len(full_prompt):,} chars"
        )

        return sessions, project_names, full_prompt

    def _save_analysis(
        self,
        request: WorkAnalysisRequest,
        sessions: list[dict],
        project_names: list[str],
        result: str,
        analysis_id: str | None = None,
        model: str | None = None,
    ) -> WorkAnalysis:
        """분석 결과 저장"""
        if analysis_id is None:
            analysis_id = str(uuid.uuid4())

        now = datetime.now()
        project_ids = list(set(s["project_id"] for s in sessions))
        session_ids = [s["session_id"] for s in sessions]
        use_model = model or request.model or CLAUDE_MODEL

        analysis = WorkAnalysis(
            id=analysis_id,
            date_from=request.date_from,
            date_to=request.date_to,
            project_ids=project_ids,
            project_names=sorted(project_names),
            session_ids=session_ids,
            session_count=len(sessions),
            result=result,
            model=use_model,
            created_at=now,
            updated_at=now,
        )

        analysis_file = self.ANALYSES_DIR / f"{analysis_id}.json"
        with open(analysis_file, "w", encoding="utf-8") as f:
            f.write(analysis.model_dump_json(indent=2))

        logger.debug(f"Saved work analysis: {analysis_file}")
        return analysis

    def _load_analysis(self, analysis_id: str) -> WorkAnalysis | None:
        """분석 결과 로드"""
        analysis_file = self.ANALYSES_DIR / f"{analysis_id}.json"
        if not analysis_file.exists():
            return None

        with open(analysis_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        return WorkAnalysis(**data)

    async def analyze(self, request: WorkAnalysisRequest) -> WorkAnalysis:
        """업무분석 실행"""
        logger.debug(
            f"Starting work analysis: {request.date_from} ~ {request.date_to}, "
            f"projects: {request.project_ids}, model: {request.model}"
        )

        # 1. 분석 준비
        sessions, project_names, prompt_content = self.prepare_analysis(request)

        # 2. Claude CLI 실행
        result = ""
        async for chunk in self._run_claude_cli_stream(prompt_content, request.model):
            result += chunk

        # 3. 분석 결과 저장
        analysis = self._save_analysis(request, sessions, project_names, result, model=request.model)

        return analysis

    async def reanalyze(self, analysis_id: str, model: str | None = None) -> WorkAnalysis:
        """기존 분석 재실행"""
        existing = self._load_analysis(analysis_id)
        if not existing:
            raise ValueError(f"분석을 찾을 수 없습니다: {analysis_id}")

        # 새 모델이 지정되지 않으면 기존 모델 사용
        use_model = model or existing.model

        request = WorkAnalysisRequest(
            date_from=existing.date_from,
            date_to=existing.date_to,
            project_ids=existing.project_ids if existing.project_ids else None,
            model=use_model,
        )

        # 분석 준비
        sessions, project_names, prompt_content = self.prepare_analysis(request)

        # Claude CLI 실행
        result = ""
        async for chunk in self._run_claude_cli_stream(prompt_content, use_model):
            result += chunk

        # 기존 분석 업데이트
        analysis = self._save_analysis(
            request, sessions, project_names, result, analysis_id=analysis_id, model=use_model
        )
        return analysis

    def list_analyses(self) -> list[WorkAnalysisListItem]:
        """저장된 분석 목록 조회"""
        analyses = []

        for analysis_file in self.ANALYSES_DIR.glob("*.json"):
            try:
                with open(analysis_file, "r", encoding="utf-8") as f:
                    data = json.load(f)

                analyses.append(
                    WorkAnalysisListItem(
                        id=data["id"],
                        date_from=data["date_from"],
                        date_to=data["date_to"],
                        project_names=data.get("project_names", []),
                        session_count=data.get("session_count", 0),
                        created_at=datetime.fromisoformat(data["created_at"]),
                        summary=extract_summary(data.get("result", "")),
                    )
                )
            except (json.JSONDecodeError, KeyError) as e:
                logger.error(f"Failed to load work analysis {analysis_file}: {e}")
                continue

        # 최신순 정렬
        analyses.sort(key=lambda x: x.created_at, reverse=True)
        return analyses

    def get_analysis(self, analysis_id: str) -> WorkAnalysis | None:
        """분석 상세 조회"""
        return self._load_analysis(analysis_id)

    def delete_analysis(self, analysis_id: str) -> bool:
        """분석 삭제"""
        analysis_file = self.ANALYSES_DIR / f"{analysis_id}.json"
        if analysis_file.exists():
            analysis_file.unlink()
            logger.debug(f"Deleted work analysis: {analysis_id}")
            return True
        return False


# 싱글톤 인스턴스
work_analysis_service = WorkAnalysisService()
