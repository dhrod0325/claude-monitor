import logging
from pathlib import Path
from datetime import datetime
from config import config
from models.schemas import Project
from services.cache import cache_manager, CACHE_PROJECTS

logger = logging.getLogger(__name__)


class ProjectService:
    def __init__(self):
        self.projects_dir = config.PROJECTS_DIR
        logger.debug("ProjectService initialized with caching")

    def list_all(self) -> list[Project]:
        """모든 프로젝트 목록 조회 (캐싱 적용)"""
        cache_key = "all_projects"
        cached = cache_manager.get(CACHE_PROJECTS, cache_key)
        if cached is not None:
            return cached

        projects = []

        if not self.projects_dir.exists():
            return projects

        for project_dir in self.projects_dir.iterdir():
            if not project_dir.is_dir():
                continue

            session_files = list(project_dir.glob("*.jsonl"))
            main_sessions = [f for f in session_files if not f.name.startswith("agent-")]

            if not main_sessions:
                continue

            latest_file = max(session_files, key=lambda f: f.stat().st_mtime)
            last_activity = datetime.fromtimestamp(latest_file.stat().st_mtime)

            projects.append(
                Project(
                    id=project_dir.name,
                    name=self._decode_project_name(project_dir.name),
                    path=self._decode_project_path(project_dir.name),
                    session_count=len(main_sessions),
                    last_activity=last_activity,
                )
            )

        result = sorted(projects, key=lambda p: p.last_activity or datetime.min, reverse=True)
        cache_manager.set(CACHE_PROJECTS, cache_key, result)
        return result

    def get_project(self, project_id: str) -> Project | None:
        """프로젝트 상세 조회 (캐싱 적용)"""
        cache_key = f"project:{project_id}"
        cached = cache_manager.get(CACHE_PROJECTS, cache_key)
        if cached is not None:
            return cached

        project_dir = self.projects_dir / project_id

        if not project_dir.exists():
            return None

        session_files = list(project_dir.glob("*.jsonl"))
        main_sessions = [f for f in session_files if not f.name.startswith("agent-")]

        latest_file = max(session_files, key=lambda f: f.stat().st_mtime) if session_files else None
        last_activity = datetime.fromtimestamp(latest_file.stat().st_mtime) if latest_file else None

        result = Project(
            id=project_dir.name,
            name=self._decode_project_name(project_dir.name),
            path=self._decode_project_path(project_dir.name),
            session_count=len(main_sessions),
            last_activity=last_activity,
        )
        cache_manager.set(CACHE_PROJECTS, cache_key, result)
        return result

    def _decode_project_path(self, encoded: str) -> str:
        """프로젝트 경로 디코딩: -Users-user-project -> /Users/user/project"""
        if encoded.startswith("-"):
            return "/" + encoded[1:].replace("-", "/")
        return encoded.replace("-", "/")

    def _decode_project_name(self, encoded: str) -> str:
        """프로젝트 이름 추출 (마지막 경로 세그먼트)"""
        path = self._decode_project_path(encoded)
        return Path(path).name
