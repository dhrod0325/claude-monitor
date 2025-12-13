"""Claude CLI 스트리밍 처리 공통 로직"""

import asyncio
import json
import logging
from pathlib import Path
from typing import AsyncGenerator

from services.common.utils import save_prompts_to_file

logger = logging.getLogger(__name__)


def parse_stream_event(data: dict) -> str | None:
    """스트림 이벤트에서 텍스트 추출

    Args:
        data: JSON 파싱된 스트림 데이터

    Returns:
        추출된 텍스트 또는 None
    """
    if data.get("type") == "stream_event":
        event = data.get("event", {})
        if event.get("type") == "content_block_delta":
            delta = event.get("delta", {})
            if delta.get("type") == "text_delta":
                return delta.get("text", "")
    return None


async def run_claude_cli_stream(
    prompt_content: str,
    prefix: str = "prompts",
    storage_dir: Path | None = None,
) -> AsyncGenerator[str, None]:
    """Claude CLI 실행 및 스트리밍 출력

    Args:
        prompt_content: 전송할 프롬프트 내용
        prefix: 임시 파일명 prefix
        storage_dir: 임시 파일 저장 디렉토리

    Yields:
        스트리밍 텍스트 청크
    """
    prompt_file = save_prompts_to_file(prompt_content, prefix, storage_dir)

    shell_cmd = (
        f'cat "{prompt_file}" | claude '
        f'--output-format stream-json '
        f'--verbose '
        f'--include-partial-messages '
        f'-p'
    )

    logger.info("Starting Claude CLI...")

    process = await asyncio.create_subprocess_shell(
        shell_cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    while True:
        line = await process.stdout.readline()
        if not line:
            break

        try:
            data = json.loads(line.decode().strip())
            text = parse_stream_event(data)
            if text:
                yield text
        except json.JSONDecodeError:
            pass

    await process.wait()

    if process.returncode != 0:
        stderr = await process.stderr.read()
        error_msg = stderr.decode() if stderr else "Unknown error"
        logger.error(f"Claude CLI failed: {error_msg[:200]}")


async def run_claude_cli_and_collect(
    prompt_content: str,
    prefix: str = "prompts",
    storage_dir: Path | None = None,
) -> str:
    """Claude CLI 실행 및 전체 결과 수집

    Args:
        prompt_content: 전송할 프롬프트 내용
        prefix: 임시 파일명 prefix
        storage_dir: 임시 파일 저장 디렉토리

    Returns:
        수집된 전체 텍스트
    """
    result = ""
    async for text in run_claude_cli_stream(prompt_content, prefix, storage_dir):
        result += text
    return result
