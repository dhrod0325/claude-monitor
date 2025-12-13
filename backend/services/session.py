import logging
from pathlib import Path
from datetime import datetime
import json
import subprocess
from config import config
from models.schemas import Session, SessionMetadata, SearchResult, ResumeInfo, ResumeResult
from services.parser import MessageParser
from services.cache import cache_manager, CACHE_SESSIONS, CACHE_METADATA
from services.common import format_size

logger = logging.getLogger(__name__)


class SessionService:
    def __init__(self):
        self.projects_dir = config.PROJECTS_DIR
        self.parser = MessageParser()
        self._session_file_cache: dict[str, Path] = {}
        logger.debug("SessionService initialized with caching")

    def list_sessions(self, project_id: str) -> list[Session]:
        """프로젝트 내 세션 목록 조회 (캐싱 적용)"""
        cache_key = f"sessions:{project_id}"
        cached = cache_manager.get(CACHE_SESSIONS, cache_key)
        if cached is not None:
            return cached

        project_dir = self.projects_dir / project_id

        if not project_dir.exists():
            return []

        sessions = []
        for session_file in project_dir.glob("*.jsonl"):
            stat = session_file.stat()
            sessions.append(
                Session(
                    id=session_file.stem,
                    project_id=project_id,
                    filename=session_file.name,
                    size=stat.st_size,
                    size_human=format_size(stat.st_size),
                    updated_at=datetime.fromtimestamp(stat.st_mtime),
                    is_agent=session_file.name.startswith("agent-"),
                )
            )

        result = sorted(sessions, key=lambda s: s.updated_at, reverse=True)
        cache_manager.set(CACHE_SESSIONS, cache_key, result)
        return result

    def get_history(self, session_id: str, limit: int = 100) -> list[dict]:
        """세션 히스토리 조회"""
        session_file = self._find_session_file(session_id)

        if not session_file:
            return []

        messages = []
        with open(session_file, "r") as f:
            for line in f:
                parsed = self.parser.parse_line(line)
                if parsed:
                    messages.append(parsed)

        return messages[-limit:] if limit else messages

    def get_metadata(self, session_id: str) -> SessionMetadata | None:
        """세션 메타데이터 조회"""
        session_file = self._find_session_file(session_id)

        if not session_file:
            return None

        return self._extract_metadata(session_file)

    def search(self, keyword: str, project_id: str | None = None) -> list[SearchResult]:
        """세션 검색"""
        results = []

        if project_id:
            search_dirs = [self.projects_dir / project_id]
        else:
            search_dirs = [d for d in self.projects_dir.iterdir() if d.is_dir()]

        for project_dir in search_dirs:
            if not project_dir.exists():
                continue

            for session_file in project_dir.glob("*.jsonl"):
                if session_file.name.startswith("agent-"):
                    continue

                metadata = self._extract_metadata(session_file)
                searchable = f"{metadata.summary or ''} {metadata.first_message or ''} {project_dir.name}"

                if keyword.lower() in searchable.lower():
                    results.append(
                        SearchResult(
                            session_id=session_file.stem,
                            project_id=project_dir.name,
                            project_path=self._decode_project_path(project_dir.name),
                            summary=metadata.summary,
                            first_message=metadata.first_message,
                            message_count=metadata.message_count,
                            size_human=metadata.size_human,
                            updated_at=metadata.updated_at,
                            has_agents=metadata.has_agents,
                            agent_count=metadata.agent_count,
                            tool_calls=metadata.tool_calls,
                        )
                    )

        return sorted(results, key=lambda x: x.updated_at, reverse=True)

    def get_resume_info(self, session_id: str) -> ResumeInfo | None:
        """세션 재개 정보 조회"""
        session_file = self._find_session_file(session_id)

        if not session_file:
            return None

        metadata = self._extract_metadata(session_file)
        project_path = self._decode_project_path(session_file.parent.name)

        return ResumeInfo(
            session_id=session_id,
            project_path=project_path,
            can_continue=True,
            can_resume=True,
            summary=metadata.summary,
            first_message=metadata.first_message,
            message_count=metadata.message_count,
        )

    def resume(self, session_id: str, mode: str = "continue") -> ResumeResult | dict:
        """세션 재개"""
        session_file = self._find_session_file(session_id)

        if not session_file:
            return {"error": "Session not found"}

        project_path = self._decode_project_path(session_file.parent.name)

        cmd = ["claude", f"--{mode}", session_id]
        process = subprocess.Popen(
            cmd,
            cwd=project_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        return ResumeResult(
            pid=process.pid,
            session_id=session_id,
            mode=mode,
            project_path=project_path,
            status="started",
        )

    def get_agent_logs(self, session_id: str) -> list[dict]:
        """세션과 관련된 백그라운드 에이전트 로그 조회"""
        session_file = self._find_session_file(session_id)

        if not session_file:
            return []

        project_dir = session_file.parent
        agents = []

        # 에이전트 파일들을 순회하며 sessionId가 일치하는 것을 찾음
        for agent_file in project_dir.glob("agent-*.jsonl"):
            try:
                with open(agent_file, "r") as f:
                    first_line = f.readline()
                    if not first_line:
                        continue

                    first_data = json.loads(first_line)
                    agent_session_id = first_data.get("sessionId", "")

                    # sessionId가 현재 세션과 일치하는 경우
                    if agent_session_id == session_id:
                        agent_id = first_data.get("agentId", agent_file.stem.replace("agent-", ""))

                        # 파일을 다시 열어서 모든 메시지 파싱
                        messages = []
                        f.seek(0)
                        for line in f:
                            parsed = self.parser.parse_line(line)
                            if parsed:
                                messages.append(parsed)

                        stat = agent_file.stat()
                        agents.append({
                            "agent_id": agent_id,
                            "messages": messages,
                            "size_human": format_size(stat.st_size),
                            "updated_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        })
            except (json.JSONDecodeError, IOError):
                continue

        # 업데이트 시간 기준 정렬
        return sorted(agents, key=lambda x: x["updated_at"], reverse=True)

    def _extract_metadata(self, session_file: Path) -> SessionMetadata:
        """세션 파일에서 메타데이터 추출 (캐싱 적용)"""
        stat = session_file.stat()
        cache_key = f"meta:{session_file.stem}:{stat.st_mtime}"
        cached = cache_manager.get(CACHE_METADATA, cache_key)
        if cached is not None:
            return cached

        metadata = SessionMetadata(
            session_id=session_file.stem,
            size=stat.st_size,
            size_human=format_size(stat.st_size),
            updated_at=datetime.fromtimestamp(stat.st_mtime),
        )

        agent_ids = set()

        with open(session_file, "r") as f:
            for i, line in enumerate(f):
                try:
                    data = json.loads(line)
                    msg_type = data.get("type")

                    if i == 0 and msg_type == "summary":
                        metadata.summary = data.get("summary")
                        metadata.leaf_uuid = data.get("leafUuid")

                    if msg_type == "user":
                        metadata.user_message_count += 1
                        if not metadata.first_message:
                            display = data.get("display", "")
                            if not display:
                                msg_content = data.get("message", {}).get("content", "")
                                display = msg_content if isinstance(msg_content, str) else ""
                            metadata.first_message = display[:100]

                    if msg_type in ["user", "assistant"]:
                        metadata.message_count += 1

                    if msg_type == "assistant":
                        content = data.get("message", {}).get("content", [])
                        for c in content:
                            if c.get("type") == "tool_use":
                                tool_name = c.get("name", "Unknown")
                                metadata.tool_calls[tool_name] = metadata.tool_calls.get(tool_name, 0) + 1

                                if tool_name == "Task":
                                    agent_id = c.get("id", "")[:7]
                                    if agent_id:
                                        agent_ids.add(agent_id)

                except json.JSONDecodeError:
                    continue

        metadata.has_agents = len(agent_ids) > 0
        metadata.agent_count = len(agent_ids)

        cache_manager.set(CACHE_METADATA, cache_key, metadata)
        return metadata

    def _find_session_file(self, session_id: str) -> Path | None:
        """세션 ID로 파일 경로 찾기 (인스턴스 캐싱)"""
        if session_id in self._session_file_cache:
            cached_path = self._session_file_cache[session_id]
            if cached_path.exists():
                return cached_path
            del self._session_file_cache[session_id]

        for project_dir in self.projects_dir.iterdir():
            if not project_dir.is_dir():
                continue
            for session_file in project_dir.glob("*.jsonl"):
                if session_id in session_file.name:
                    self._session_file_cache[session_id] = session_file
                    return session_file
        return None

    def _decode_project_path(self, encoded: str) -> str:
        """프로젝트 경로 디코딩"""
        if encoded.startswith("-"):
            return "/" + encoded[1:].replace("-", "/")
        return encoded.replace("-", "/")
