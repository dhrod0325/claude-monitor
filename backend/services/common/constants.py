"""공통 상수 정의"""

# Claude CLI 모델 설정
CLAUDE_MODEL = "claude-sonnet-4-20250514"

# 시스템 메시지 필터링 패턴
SKIP_PATTERNS = [
    "<command-name>",
    "<command-message>",
    "<local-command-stdout>",
    "Caveat: The messages below were generated",
    "<system-reminder>",
    "This session is being continued from a previous conversation",
]

# 청크 크기 (약 300KB, 안전하게 토큰 제한 내)
CHUNK_SIZE_BYTES = 300 * 1024

# 기본 저장 디렉토리
from pathlib import Path
DEFAULT_STORAGE_DIR = Path.home() / ".claude-monitor"
