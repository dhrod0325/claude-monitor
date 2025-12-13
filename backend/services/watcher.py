import logging
from pathlib import Path
import asyncio
from config import config
from services.parser import MessageParser

logger = logging.getLogger(__name__)


class WatcherService:
    def __init__(self):
        self.claude_dir = config.CLAUDE_DIR
        self.projects_dir = config.PROJECTS_DIR
        self.parser = MessageParser()
        logger.debug(f"WatcherService initialized. Projects dir: {self.projects_dir}")

    async def watch_session(self, session_id: str, callback):
        """세션 파일을 비동기로 감시"""
        file_path = self._find_session_file(session_id)

        if not file_path:
            return

        pos = file_path.stat().st_size  # 현재 끝부터 시작

        while True:
            try:
                current_size = file_path.stat().st_size
                if current_size > pos:
                    with open(file_path, "r") as f:
                        f.seek(pos)
                        new_lines = f.readlines()
                        for line in new_lines:
                            parsed = self.parser.parse_line(line)
                            if parsed:
                                await callback(parsed)
                        pos = f.tell()

                await asyncio.sleep(config.WATCH_INTERVAL)
            except FileNotFoundError:
                # 파일이 삭제된 경우
                break
            except Exception as e:
                logger.error(f"Watch error: {e}")
                await asyncio.sleep(1)

    async def watch_agents(self, session_id: str, callback):
        """세션에 연결된 에이전트 파일들을 감시"""
        session_file = self._find_session_file(session_id)
        if not session_file:
            return

        project_dir = session_file.parent
        agent_positions = {}  # agent_id -> file position

        while True:
            try:
                # 이 세션에 연결된 에이전트 파일들 찾기
                for agent_file in project_dir.glob("agent-*.jsonl"):
                    try:
                        with open(agent_file, "r") as f:
                            first_line = f.readline()
                            if not first_line:
                                continue

                            import json
                            first_data = json.loads(first_line)
                            if first_data.get("sessionId") != session_id:
                                continue

                            agent_id = first_data.get("agentId", agent_file.stem.replace("agent-", ""))

                            # 새 에이전트인 경우 초기화
                            if agent_id not in agent_positions:
                                agent_positions[agent_id] = 0
                                await callback({
                                    "type": "agent_new",
                                    "agent_id": agent_id,
                                })

                            # 파일 변경 확인
                            current_size = agent_file.stat().st_size
                            if current_size > agent_positions[agent_id]:
                                f.seek(agent_positions[agent_id])
                                new_lines = f.readlines()
                                for line in new_lines:
                                    parsed = self.parser.parse_line(line)
                                    if parsed:
                                        await callback({
                                            "type": "agent_message",
                                            "agent_id": agent_id,
                                            "message": parsed,
                                        })
                                agent_positions[agent_id] = f.tell()

                    except (json.JSONDecodeError, IOError):
                        continue

                await asyncio.sleep(config.WATCH_INTERVAL)
            except Exception as e:
                logger.error(f"Agent watch error: {e}")
                await asyncio.sleep(1)

    def _find_session_file(self, session_id: str) -> Path | None:
        """세션 ID로 파일 경로 찾기"""
        for project_dir in self.projects_dir.iterdir():
            if not project_dir.is_dir():
                continue
            for session_file in project_dir.glob("*.jsonl"):
                if session_id in session_file.name:
                    return session_file
        return None
