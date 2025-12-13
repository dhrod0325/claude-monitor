from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Project(BaseModel):
    id: str
    name: str
    path: str
    session_count: int
    last_activity: Optional[datetime] = None


class Session(BaseModel):
    id: str
    project_id: str
    filename: str
    size: int
    size_human: str
    updated_at: datetime
    is_agent: bool = False


class SessionMetadata(BaseModel):
    session_id: str
    size: int
    size_human: str
    updated_at: datetime
    summary: Optional[str] = None
    first_message: Optional[str] = None
    message_count: int = 0
    user_message_count: int = 0
    tool_calls: dict[str, int] = {}
    has_agents: bool = False
    agent_count: int = 0
    leaf_uuid: Optional[str] = None


class ToolCall(BaseModel):
    type: str = "tool"
    name: str
    input: dict
    formatted: str


class Message(BaseModel):
    type: str  # user, assistant, summary
    content: Optional[str] = None
    items: Optional[list[dict]] = None
    timestamp: datetime


class ResumeInfo(BaseModel):
    session_id: str
    project_path: str
    can_continue: bool = True
    can_resume: bool = True
    summary: Optional[str] = None
    first_message: Optional[str] = None
    message_count: int = 0


class ResumeResult(BaseModel):
    pid: int
    session_id: str
    mode: str
    project_path: str
    status: str = "started"


class SearchResult(BaseModel):
    session_id: str
    project_id: str
    project_path: str
    summary: Optional[str] = None
    first_message: Optional[str] = None
    message_count: int = 0
    size_human: str
    updated_at: datetime
    has_agents: bool = False
    agent_count: int = 0
    tool_calls: dict[str, int] = {}
