from pydantic import BaseModel
from datetime import datetime


class AnalysisRequest(BaseModel):
    """분석 요청"""
    project_id: str | None = None  # optional - 여러 프로젝트 세션 선택 시
    session_ids: list[str]
    model: str | None = None  # Claude 모델 선택


class Analysis(BaseModel):
    """분석 결과"""
    id: str
    project_id: str | None  # 여러 프로젝트 세션 분석 시 None
    project_name: str
    session_ids: list[str]
    prompt_count: int
    result: str  # 마크다운 분석 결과
    model: str | None = None  # 사용된 Claude 모델
    created_at: datetime
    updated_at: datetime | None = None


class AnalysisListItem(BaseModel):
    """분석 목록 아이템"""
    id: str
    project_id: str | None
    project_name: str
    session_count: int
    prompt_count: int
    created_at: datetime
    summary: str  # 결과 요약 (첫 200자)
