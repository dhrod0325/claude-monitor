import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class MessageParser:
    def __init__(self):
        logger.debug("MessageParser initialized")

    def parse_line(self, line: str) -> dict | None:
        """JSONL 라인 파싱"""
        try:
            data = json.loads(line)
            msg_type = data.get("type")

            if msg_type == "user":
                return self._parse_user(data)
            elif msg_type == "assistant":
                return self._parse_assistant(data)
            elif msg_type == "summary":
                return self._parse_summary(data)

            return None
        except json.JSONDecodeError:
            return None

    def _parse_user(self, data: dict) -> dict:
        """사용자 메시지 파싱"""
        result = {
            "type": "user",
            "content": "",
            "items": [],
            "timestamp": datetime.now().isoformat(),
        }

        # display 필드가 있으면 우선 사용 (문자열인 경우만)
        display = data.get("display")
        if display and isinstance(display, str):
            result["content"] = display
            return result

        # message.content가 배열인 경우 처리
        raw_content = data.get("message", {}).get("content", "")
        if isinstance(raw_content, list):
            text_parts = []
            for item in raw_content:
                if isinstance(item, dict):
                    if item.get("type") == "text":
                        text_parts.append(item.get("text", ""))
                    elif item.get("type") == "tool_result":
                        # tool_result를 별도 아이템으로 저장
                        tool_content = item.get("content", "")
                        if isinstance(tool_content, list):
                            # content가 배열인 경우 텍스트 추출
                            tool_content = "\n".join(
                                c.get("text", str(c)) if isinstance(c, dict) else str(c)
                                for c in tool_content
                            )
                        result["items"].append({
                            "type": "tool_result",
                            "tool_use_id": item.get("tool_use_id", ""),
                            "content": tool_content if isinstance(tool_content, str) else str(tool_content),
                            "is_error": item.get("is_error", False),
                        })
                elif isinstance(item, str):
                    text_parts.append(item)
            result["content"] = "\n".join(text_parts) if text_parts else ""
        else:
            result["content"] = raw_content if isinstance(raw_content, str) else str(raw_content) if raw_content else ""

        return result

    def _parse_assistant(self, data: dict) -> dict:
        """어시스턴트 메시지 파싱"""
        message = data.get("message", {})
        contents = message.get("content", [])

        result = {
            "type": "assistant",
            "items": [],
            "timestamp": datetime.now().isoformat(),
        }

        for content in contents:
            if content.get("type") == "text":
                result["items"].append({
                    "type": "text",
                    "content": content.get("text", ""),
                })
            elif content.get("type") == "tool_use":
                result["items"].append({
                    "type": "tool",
                    "id": content.get("id", ""),
                    "name": content.get("name", ""),
                    "input": content.get("input", {}),
                    "formatted": self._format_tool(content),
                })

        return result

    def _format_tool(self, content: dict) -> str:
        """도구 호출 포맷팅"""
        name = content.get("name", "")
        inp = content.get("input", {})

        def format_task():
            desc = inp.get("description", "")
            agent_type = inp.get("subagent_type", "")
            prompt = inp.get("prompt", "")

            if desc and agent_type:
                return f"{desc} ({agent_type})"
            elif desc:
                return desc
            elif agent_type:
                return f"Agent: {agent_type}"
            elif prompt:
                return prompt[:80] + "..." if len(prompt) > 80 else prompt
            return "Background agent task"

        formatters = {
            "Bash": lambda: f"{inp.get('description', '')} - {inp.get('command', '')[:60]}",
            "Edit": lambda: f"{inp.get('file_path', '').split('/')[-1]}",
            "Write": lambda: f"{inp.get('file_path', '').split('/')[-1]}",
            "Read": lambda: f"{inp.get('file_path', '').split('/')[-1]}",
            "Glob": lambda: inp.get("pattern", ""),
            "Grep": lambda: inp.get("pattern", ""),
            "Task": format_task,
            "TodoWrite": lambda: f"{len(inp.get('todos', []))} items",
        }

        formatter = formatters.get(name, lambda: "")
        return formatter()

    def _parse_summary(self, data: dict) -> dict:
        """요약 메시지 파싱"""
        return {
            "type": "summary",
            "content": data.get("summary", ""),
            "timestamp": datetime.now().isoformat(),
        }
