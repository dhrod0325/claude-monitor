"""공통 유틸리티 모듈 단위 테스트"""

import pytest
import tempfile
from pathlib import Path

from services.common import (
    SKIP_PATTERNS,
    CHUNK_SIZE_BYTES,
    format_size,
    is_system_message,
    extract_summary,
    get_project_name,
    save_prompts_to_file,
    parse_stream_event,
)
from services.common.utils import clean_content


class TestConstants:
    """상수 테스트"""

    def test_skip_patterns_defined(self):
        """SKIP_PATTERNS가 정의되어 있는지 확인"""
        assert isinstance(SKIP_PATTERNS, list)
        assert len(SKIP_PATTERNS) > 0
        assert "<system-reminder>" in SKIP_PATTERNS

    def test_chunk_size_bytes(self):
        """CHUNK_SIZE_BYTES가 적절한 값인지 확인"""
        assert CHUNK_SIZE_BYTES == 300 * 1024
        assert CHUNK_SIZE_BYTES > 0


class TestFormatSize:
    """format_size 함수 테스트"""

    def test_bytes(self):
        """바이트 단위 테스트"""
        assert format_size(0) == "0 B"
        assert format_size(100) == "100 B"
        assert format_size(1023) == "1023 B"

    def test_kilobytes(self):
        """킬로바이트 단위 테스트"""
        assert format_size(1024) == "1.0 KB"
        assert format_size(1536) == "1.5 KB"
        assert format_size(10240) == "10.0 KB"

    def test_megabytes(self):
        """메가바이트 단위 테스트"""
        assert format_size(1024 * 1024) == "1.0 MB"
        assert format_size(1024 * 1024 * 1.5) == "1.5 MB"

    def test_gigabytes(self):
        """기가바이트 단위 테스트"""
        assert format_size(1024 * 1024 * 1024) == "1.0 GB"


class TestIsSystemMessage:
    """is_system_message 함수 테스트"""

    def test_system_reminder(self):
        """시스템 리마인더 감지"""
        assert is_system_message("<system-reminder>test</system-reminder>")

    def test_command_message(self):
        """커맨드 메시지 감지"""
        assert is_system_message("<command-name>test</command-name>")
        assert is_system_message("<command-message>test</command-message>")

    def test_normal_message(self):
        """일반 메시지는 시스템 메시지가 아님"""
        assert not is_system_message("Hello, how are you?")
        assert not is_system_message("Please help me with code")

    def test_partial_pattern(self):
        """부분 패턴 포함 시 감지"""
        assert is_system_message("Some text <system-reminder> more text")


class TestExtractSummary:
    """extract_summary 함수 테스트"""

    def test_basic_extraction(self):
        """기본 요약 추출"""
        result = "# Title\n\nThis is the summary."
        assert extract_summary(result) == "This is the summary."

    def test_skip_headers(self):
        """헤더는 건너뜀"""
        result = "# Header\n## Subheader\nActual content here"
        assert extract_summary(result) == "Actual content here"

    def test_max_length(self):
        """최대 길이 제한"""
        result = "A" * 300
        summary = extract_summary(result, max_len=100)
        assert len(summary) <= 103  # 100 + "..."

    def test_empty_result(self):
        """빈 결과"""
        assert extract_summary("") == ""
        assert extract_summary("# Only Headers") == ""


class TestGetProjectName:
    """get_project_name 함수 테스트"""

    def test_encoded_path(self):
        """인코딩된 경로에서 프로젝트 이름 추출"""
        assert get_project_name("-Users-user-myproject") == "myproject"
        assert get_project_name("-home-dev-app") == "app"

    def test_simple_name(self):
        """단순 이름"""
        assert get_project_name("myproject") == "myproject"

    def test_none_value(self):
        """None 값"""
        assert get_project_name(None) == "Unknown"

    def test_empty_string(self):
        """빈 문자열"""
        assert get_project_name("") == ""


class TestSavePromptsToFile:
    """save_prompts_to_file 함수 테스트"""

    def test_save_creates_file(self):
        """파일 생성 확인"""
        with tempfile.TemporaryDirectory() as tmpdir:
            storage_dir = Path(tmpdir)
            content = "Test prompt content"

            file_path = save_prompts_to_file(content, "test", storage_dir)

            assert file_path.exists()
            assert file_path.read_text() == content

    def test_save_with_custom_prefix(self):
        """커스텀 prefix 사용"""
        with tempfile.TemporaryDirectory() as tmpdir:
            storage_dir = Path(tmpdir)

            file_path = save_prompts_to_file("content", "custom_prefix", storage_dir)

            assert "custom_prefix" in file_path.name

    def test_save_creates_temp_dir(self):
        """temp 디렉토리 자동 생성"""
        with tempfile.TemporaryDirectory() as tmpdir:
            storage_dir = Path(tmpdir)

            file_path = save_prompts_to_file("content", "test", storage_dir)

            assert (storage_dir / "temp").exists()
            assert file_path.parent == storage_dir / "temp"


class TestParseStreamEvent:
    """parse_stream_event 함수 테스트"""

    def test_valid_text_delta(self):
        """유효한 text_delta 이벤트"""
        event = {
            "type": "stream_event",
            "event": {
                "type": "content_block_delta",
                "delta": {
                    "type": "text_delta",
                    "text": "Hello"
                }
            }
        }
        assert parse_stream_event(event) == "Hello"

    def test_invalid_event_type(self):
        """유효하지 않은 이벤트 타입"""
        event = {"type": "other_event"}
        assert parse_stream_event(event) is None

    def test_missing_text(self):
        """텍스트 없는 이벤트"""
        event = {
            "type": "stream_event",
            "event": {
                "type": "content_block_delta",
                "delta": {
                    "type": "other_delta"
                }
            }
        }
        assert parse_stream_event(event) is None

    def test_empty_text(self):
        """빈 텍스트"""
        event = {
            "type": "stream_event",
            "event": {
                "type": "content_block_delta",
                "delta": {
                    "type": "text_delta",
                    "text": ""
                }
            }
        }
        assert parse_stream_event(event) == ""


class TestCleanContent:
    """clean_content 함수 테스트"""

    def test_multiple_newlines(self):
        """연속 줄바꿈 정리"""
        content = "Line 1\n\n\n\n\nLine 2"
        assert clean_content(content) == "Line 1\n\nLine 2"

    def test_multiple_spaces(self):
        """연속 공백 정리"""
        content = "Word1     Word2"
        assert clean_content(content) == "Word1 Word2"

    def test_combined(self):
        """줄바꿈과 공백 동시 정리"""
        content = "Line 1\n\n\n\nLine 2    Word"
        assert clean_content(content) == "Line 1\n\nLine 2 Word"

    def test_no_changes_needed(self):
        """변경 필요 없는 경우"""
        content = "Normal text\n\nNew paragraph"
        assert clean_content(content) == content
