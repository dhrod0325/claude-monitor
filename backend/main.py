from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import logging
import sys
import os

from api.routes import router
from api.websocket import websocket_router
from api.analysis_routes import router as analysis_router
from api.work_analysis_routes import router as work_analysis_router


def get_base_path():
    """PyInstaller로 패키징된 경우와 일반 실행 경우를 구분"""
    if getattr(sys, 'frozen', False):
        return Path(sys._MEIPASS)
    return Path(__file__).parent


# 로깅 설정 - 콘솔만 출력 (패키징 환경에서는 파일 로그 생략)
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Claude Monitor",
    description="Claude Code 실시간 모니터링 API",
    version="0.1.0",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 프론트엔드 경로 설정
base_path = get_base_path()
if getattr(sys, 'frozen', False):
    frontend_dist = base_path / "frontend_dist"
else:
    frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"

logger.debug(f"Frontend dist path: {frontend_dist}")


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy"}


# API 라우터 등록
app.include_router(router, prefix="/api")
app.include_router(analysis_router, prefix="/api")
app.include_router(work_analysis_router, prefix="/api")
app.include_router(websocket_router)


# 정적 파일 서빙 (API 라우터 이후에 등록)
if frontend_dist.exists():
    # assets 폴더 마운트
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # HTML 파일 직접 라우팅
    @app.get("/app.html")
    async def serve_app():
        return FileResponse(frontend_dist / "app.html")

    @app.get("/index.html")
    async def serve_index_html():
        return FileResponse(frontend_dist / "index.html")

    @app.get("/")
    async def serve_root():
        return FileResponse(frontend_dist / "index.html")

    # 기타 정적 파일 (favicon 등)
    @app.get("/{filename:path}")
    async def serve_static(filename: str):
        file_path = frontend_dist / filename
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        # SPA fallback
        return FileResponse(frontend_dist / "index.html")

    logger.debug(f"Serving static files from {frontend_dist}")
else:
    logger.warning(f"Frontend dist not found at {frontend_dist}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug",
    )
