import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.watcher import WatcherService
import asyncio

logger = logging.getLogger(__name__)

websocket_router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)
        logger.debug(f"WebSocket connected: session_id={session_id}, total_connections={len(self.active_connections[session_id])}")

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
            remaining = len(self.active_connections.get(session_id, []))
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
            logger.debug(f"WebSocket disconnected: session_id={session_id}, remaining_connections={remaining}")

    async def broadcast(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            # 연결이 끊긴 클라이언트 제거
            for conn in disconnected:
                self.active_connections[session_id].remove(conn)


manager = ConnectionManager()
watcher_service = WatcherService()
logger.debug("WebSocket router initialized with ConnectionManager and WatcherService")


@websocket_router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)

    # 파일 감시 시작
    async def on_new_data(data):
        await manager.broadcast(session_id, data)

    # 세션 메시지 감시
    watch_task = asyncio.create_task(
        watcher_service.watch_session(session_id, on_new_data)
    )

    # 에이전트 메시지 감시
    agent_watch_task = asyncio.create_task(
        watcher_service.watch_agents(session_id, on_new_data)
    )

    try:
        while True:
            # 클라이언트 메시지 수신 (keep-alive)
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        watch_task.cancel()
        agent_watch_task.cancel()
    except Exception:
        manager.disconnect(websocket, session_id)
        watch_task.cancel()
        agent_watch_task.cancel()
