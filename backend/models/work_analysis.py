from pydantic import BaseModel
from datetime import datetime


class WorkAnalysisRequest(BaseModel):
    """업무분석 요청"""
    date_from: str  # YYYY-MM-DD
    date_to: str    # YYYY-MM-DD
    project_ids: list[str] | None = None  # 미지정 시 전체 프로젝트
    model: str | None = None  # Claude 모델 선택


class WorkAnalysis(BaseModel):
    """업무분석 결과"""
    id: str
    date_from: str
    date_to: str
    project_ids: list[str]
    project_names: list[str]
    session_ids: list[str]
    session_count: int
    result: str  # 마크다운 분석 결과
    model: str | None = None  # 사용된 Claude 모델
    created_at: datetime
    updated_at: datetime | None = None


class WorkAnalysisListItem(BaseModel):
    """업무분석 목록 아이템"""
    id: str
    date_from: str
    date_to: str
    project_names: list[str]
    session_count: int
    created_at: datetime
    summary: str  # 결과 요약 (첫 200자)
