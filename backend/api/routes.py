import logging
from fastapi import APIRouter, Query, HTTPException
from typing import List
from services.project import ProjectService
from services.session import SessionService
from services.usage import UsageService
from services.work_analysis import work_analysis_service
from services.cache import cache_manager

logger = logging.getLogger(__name__)

router = APIRouter()
project_service = ProjectService()
session_service = SessionService()
usage_service = UsageService()
logger.debug("API routes initialized with ProjectService, SessionService, UsageService")


@router.get("/health")
async def health_check():
    """헬스 체크 (Electron 앱 시작 시 사용)"""
    return {"status": "healthy"}


@router.get("/projects")
async def list_projects():
    """프로젝트 목록 조회"""
    return project_service.list_all()


@router.get("/projects/{project_id}")
async def get_project(project_id: str):
    """프로젝트 상세 조회"""
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/projects/{project_id}/sessions")
async def list_sessions(project_id: str):
    """프로젝트 내 세션 목록 조회"""
    return session_service.list_sessions(project_id)


@router.get("/sessions/{session_id}/history")
async def get_session_history(session_id: str, limit: int = Query(100, ge=0)):
    """세션 히스토리 조회"""
    return session_service.get_history(session_id, limit)


@router.get("/sessions/{session_id}/metadata")
async def get_session_metadata(session_id: str):
    """세션 메타데이터 조회"""
    metadata = session_service.get_metadata(session_id)
    if not metadata:
        raise HTTPException(status_code=404, detail="Session not found")
    return metadata


@router.get("/sessions/search")
async def search_sessions(
    q: str = Query(..., description="검색어"),
    project_id: str = Query(None, description="프로젝트 필터"),
):
    """세션 검색"""
    return session_service.search(q, project_id)


@router.get("/sessions/{session_id}/agents")
async def get_session_agents(session_id: str):
    """세션의 백그라운드 에이전트 로그 조회"""
    return session_service.get_agent_logs(session_id)


@router.get("/sessions/{session_id}/resume-info")
async def get_resume_info(session_id: str):
    """세션 재개 정보 조회"""
    info = session_service.get_resume_info(session_id)
    if not info:
        raise HTTPException(status_code=404, detail="Session not found")
    return info


@router.post("/sessions/{session_id}/resume")
async def resume_session(session_id: str, mode: str = Query("continue", regex="^(continue|resume)$")):
    """세션 재개"""
    result = session_service.resume(session_id, mode)
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/usage/stats")
async def get_usage_stats(days: int = Query(None, description="필터링할 일수")):
    """Usage 통계 조회"""
    return usage_service.get_usage_stats(days)


@router.get("/usage/range")
async def get_usage_by_range(
    start_date: str = Query(..., description="시작 날짜 (ISO format)"),
    end_date: str = Query(..., description="종료 날짜 (ISO format)"),
):
    """날짜 범위로 Usage 통계 조회"""
    return usage_service.get_usage_by_date_range(start_date, end_date)


@router.get("/sessions/by-date-range")
async def get_sessions_by_date_range(
    date_from: str = Query(..., description="시작 날짜 (YYYY-MM-DD)"),
    date_to: str = Query(..., description="종료 날짜 (YYYY-MM-DD)"),
    project_ids: List[str] = Query(None, description="프로젝트 ID 목록"),
):
    """날짜 범위로 세션 목록 조회 (프로젝트별 그룹핑)"""
    return work_analysis_service.get_sessions_by_date_range(date_from, date_to, project_ids)


@router.get("/cache/stats")
async def get_cache_stats():
    """캐시 통계 조회"""
    return cache_manager.get_all_stats_dict()


@router.delete("/cache")
async def clear_all_cache():
    """모든 캐시 클리어"""
    cleared = cache_manager.clear()
    return {"cleared": cleared, "message": f"Cleared {cleared} cached items"}


@router.delete("/cache/{cache_name}")
async def clear_cache(cache_name: str):
    """특정 캐시 클리어"""
    cleared = cache_manager.clear(cache_name)
    return {"cache": cache_name, "cleared": cleared}
