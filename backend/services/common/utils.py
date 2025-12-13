"""공통 유틸리티 함수"""

import uuid
import logging
from pathlib import Path

from services.common.constants import SKIP_PATTERNS, DEFAULT_STORAGE_DIR

logger = logging.getLogger(__name__)


def format_size(size: int) -> str:
    """파일 크기를 읽기 쉬운 형식으로 변환"""
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024:
            return f"{size:.1f} {unit}" if unit != "B" else f"{size} B"
        size /= 1024
    return f"{size:.1f} TB"


def is_system_message(content: str) -> bool:
    """시스템 메시지인지 확인"""
    return any(p in content for p in SKIP_PATTERNS)


def extract_summary(result: str, max_len: int = 200) -> str:
    """분석 결과에서 요약 추출"""
    lines = result.strip().split("\n")
    summary_lines = []
    for line in lines:
        line = line.strip()
        if line and not line.startswith("#"):
            summary_lines.append(line)
            if len(" ".join(summary_lines)) > max_len:
                break
    summary = " ".join(summary_lines)
    if len(summary) > max_len:
        summary = summary[:max_len] + "..."
    return summary


def get_project_name(project_id: str | None) -> str:
    """프로젝트 ID에서 이름 추출

    Args:
        project_id: 프로젝트 ID (예: '-Users-user-project')

    Returns:
        프로젝트 이름 (예: 'project')
    """
    if project_id is None:
        return "Unknown"
    # '-Users-user-project' -> 'project'
    parts = project_id.split("-")
    return parts[-1] if parts else project_id


def save_prompts_to_file(
    prompt_content: str,
    prefix: str = "prompts",
    storage_dir: Path | None = None
) -> Path:
    """프롬프트를 임시 파일로 저장

    Args:
        prompt_content: 저장할 프롬프트 내용
        prefix: 파일명 prefix
        storage_dir: 저장 디렉토리 (기본: ~/.claude-monitor)

    Returns:
        저장된 파일 경로
    """
    if storage_dir is None:
        storage_dir = DEFAULT_STORAGE_DIR

    temp_dir = storage_dir / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)

    temp_file = temp_dir / f"{prefix}_{uuid.uuid4().hex[:8]}.txt"
    with open(temp_file, "w", encoding="utf-8") as f:
        f.write(prompt_content)

    file_size = temp_file.stat().st_size
    logger.info(f"Saved prompts to file: {temp_file} (size: {file_size:,} bytes)")
    return temp_file


def clean_content(content: str) -> str:
    """연속 공백/줄바꿈 정리"""
    import re
    content = re.sub(r'\n{3,}', '\n\n', content)
    content = re.sub(r' {2,}', ' ', content)
    return content
