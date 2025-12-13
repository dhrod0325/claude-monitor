from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
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

# API 라우터 등록
app.include_router(router, prefix="/api")
app.include_router(analysis_router, prefix="/api")
app.include_router(work_analysis_router, prefix="/api")
app.include_router(websocket_router)

# 프론트엔드 정적 파일 서빙 (빌드 후)
base_path = get_base_path()
if getattr(sys, 'frozen', False):
    # PyInstaller 패키징 환경
    frontend_dist = base_path / "frontend_dist"
else:
    # 개발 환경
    frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"

if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static")
    logger.debug(f"Serving static files from {frontend_dist}")
else:
    logger.warning(f"Frontend dist not found at {frontend_dist}")


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug",
    )
