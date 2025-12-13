"""Claude Code Usage 데이터 파싱 서비스"""

import json
import logging
from pathlib import Path
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Optional
from collections import defaultdict

logger = logging.getLogger(__name__)

# Claude 4 pricing constants (per million tokens)
OPUS_4_INPUT_PRICE = 15.0
OPUS_4_OUTPUT_PRICE = 75.0
OPUS_4_CACHE_WRITE_PRICE = 18.75
OPUS_4_CACHE_READ_PRICE = 1.50

SONNET_4_INPUT_PRICE = 3.0
SONNET_4_OUTPUT_PRICE = 15.0
SONNET_4_CACHE_WRITE_PRICE = 3.75
SONNET_4_CACHE_READ_PRICE = 0.30


@dataclass
class UsageEntry:
    timestamp: str
    model: str
    input_tokens: int
    output_tokens: int
    cache_creation_tokens: int
    cache_read_tokens: int
    cost: float
    session_id: str
    project_path: str


@dataclass
class ModelUsage:
    model: str
    total_cost: float = 0.0
    total_tokens: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    cache_creation_tokens: int = 0
    cache_read_tokens: int = 0
    session_count: int = 0


@dataclass
class DailyUsage:
    date: str
    total_cost: float = 0.0
    total_tokens: int = 0
    models_used: list = field(default_factory=list)


@dataclass
class ProjectUsage:
    project_path: str
    project_name: str
    total_cost: float = 0.0
    total_tokens: int = 0
    session_count: int = 0
    last_used: str = ""


@dataclass
class UsageStats:
    total_cost: float = 0.0
    total_tokens: int = 0
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_cache_creation_tokens: int = 0
    total_cache_read_tokens: int = 0
    total_sessions: int = 0
    by_model: list = field(default_factory=list)
    by_date: list = field(default_factory=list)
    by_project: list = field(default_factory=list)

    def to_dict(self):
        return {
            "total_cost": self.total_cost,
            "total_tokens": self.total_tokens,
            "total_input_tokens": self.total_input_tokens,
            "total_output_tokens": self.total_output_tokens,
            "total_cache_creation_tokens": self.total_cache_creation_tokens,
            "total_cache_read_tokens": self.total_cache_read_tokens,
            "total_sessions": self.total_sessions,
            "by_model": [
                {
                    "model": m.model,
                    "total_cost": m.total_cost,
                    "total_tokens": m.total_tokens,
                    "input_tokens": m.input_tokens,
                    "output_tokens": m.output_tokens,
                    "cache_creation_tokens": m.cache_creation_tokens,
                    "cache_read_tokens": m.cache_read_tokens,
                    "session_count": m.session_count,
                }
                for m in self.by_model
            ],
            "by_date": [
                {
                    "date": d.date,
                    "total_cost": d.total_cost,
                    "total_tokens": d.total_tokens,
                    "models_used": d.models_used,
                }
                for d in self.by_date
            ],
            "by_project": [
                {
                    "project_path": p.project_path,
                    "project_name": p.project_name,
                    "total_cost": p.total_cost,
                    "total_tokens": p.total_tokens,
                    "session_count": p.session_count,
                    "last_used": p.last_used,
                }
                for p in self.by_project
            ],
        }


def calculate_cost(model: str, input_tokens: int, output_tokens: int,
                   cache_creation_tokens: int, cache_read_tokens: int) -> float:
    """모델과 토큰 수를 기반으로 비용 계산"""
    if "opus-4" in model or "claude-opus-4" in model:
        input_price = OPUS_4_INPUT_PRICE
        output_price = OPUS_4_OUTPUT_PRICE
        cache_write_price = OPUS_4_CACHE_WRITE_PRICE
        cache_read_price = OPUS_4_CACHE_READ_PRICE
    elif "sonnet-4" in model or "claude-sonnet-4" in model:
        input_price = SONNET_4_INPUT_PRICE
        output_price = SONNET_4_OUTPUT_PRICE
        cache_write_price = SONNET_4_CACHE_WRITE_PRICE
        cache_read_price = SONNET_4_CACHE_READ_PRICE
    else:
        # Unknown model - return 0
        return 0.0

    cost = (
        (input_tokens * input_price / 1_000_000)
        + (output_tokens * output_price / 1_000_000)
        + (cache_creation_tokens * cache_write_price / 1_000_000)
        + (cache_read_tokens * cache_read_price / 1_000_000)
    )
    return cost


def get_earliest_timestamp(path: Path) -> Optional[str]:
    """파일에서 가장 이른 타임스탬프 가져오기"""
    earliest = None
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    ts = data.get("timestamp")
                    if ts:
                        if earliest is None or ts < earliest:
                            earliest = ts
                except json.JSONDecodeError:
                    continue
    except Exception as e:
        logger.debug(f"Error reading {path}: {e}")
    return earliest


def parse_jsonl_file(path: Path, encoded_project_name: str,
                     processed_hashes: set) -> list[UsageEntry]:
    """JSONL 파일에서 usage 엔트리 파싱"""
    entries = []
    actual_project_path = None

    # 세션 ID 추출 (파일 경로에서)
    session_id = path.parent.name if path.parent else "unknown"

    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue

                try:
                    data = json.loads(line)

                    # cwd에서 실제 프로젝트 경로 추출
                    if actual_project_path is None and "cwd" in data:
                        actual_project_path = data["cwd"]

                    # message에서 usage 데이터 추출
                    message = data.get("message")
                    if not message:
                        continue

                    usage = message.get("usage")
                    if not usage:
                        continue

                    # 중복 제거
                    msg_id = message.get("id", "")
                    req_id = data.get("requestId", "")
                    if msg_id and req_id:
                        unique_hash = f"{msg_id}:{req_id}"
                        if unique_hash in processed_hashes:
                            continue
                        processed_hashes.add(unique_hash)

                    input_tokens = usage.get("input_tokens", 0) or 0
                    output_tokens = usage.get("output_tokens", 0) or 0
                    cache_creation = usage.get("cache_creation_input_tokens", 0) or 0
                    cache_read = usage.get("cache_read_input_tokens", 0) or 0

                    # 토큰이 없는 엔트리 건너뛰기
                    if input_tokens == 0 and output_tokens == 0 and cache_creation == 0 and cache_read == 0:
                        continue

                    model = message.get("model", "unknown")
                    cost = data.get("costUSD")
                    if cost is None:
                        cost = calculate_cost(model, input_tokens, output_tokens,
                                              cache_creation, cache_read)

                    project_path = actual_project_path or encoded_project_name

                    entries.append(UsageEntry(
                        timestamp=data.get("timestamp", ""),
                        model=model,
                        input_tokens=input_tokens,
                        output_tokens=output_tokens,
                        cache_creation_tokens=cache_creation,
                        cache_read_tokens=cache_read,
                        cost=cost,
                        session_id=data.get("sessionId", session_id),
                        project_path=project_path,
                    ))

                except json.JSONDecodeError:
                    continue

    except Exception as e:
        logger.debug(f"Error parsing {path}: {e}")

    return entries


def get_all_usage_entries(claude_path: Path) -> list[UsageEntry]:
    """모든 usage 엔트리 가져오기"""
    all_entries = []
    processed_hashes = set()
    projects_dir = claude_path / "projects"

    if not projects_dir.exists():
        return all_entries

    # 처리할 파일 수집
    files_to_process = []
    for project_dir in projects_dir.iterdir():
        if not project_dir.is_dir():
            continue

        project_name = project_dir.name
        for jsonl_file in project_dir.rglob("*.jsonl"):
            files_to_process.append((jsonl_file, project_name))

    # 타임스탬프 순으로 정렬
    files_to_process.sort(key=lambda x: get_earliest_timestamp(x[0]) or "")

    # 파일 처리
    for path, project_name in files_to_process:
        entries = parse_jsonl_file(path, project_name, processed_hashes)
        all_entries.extend(entries)

    # 타임스탬프 순 정렬
    all_entries.sort(key=lambda x: x.timestamp)

    return all_entries


class UsageService:
    def __init__(self):
        self.claude_path = Path.home() / ".claude"
        logger.debug(f"UsageService initialized with claude_path: {self.claude_path}")

    def get_usage_stats(self, days: Optional[int] = None) -> dict:
        """전체 또는 특정 기간의 usage 통계 조회"""
        all_entries = get_all_usage_entries(self.claude_path)

        if not all_entries:
            return UsageStats().to_dict()

        # days가 지정되면 필터링
        if days is not None:
            cutoff = datetime.now() - timedelta(days=days)
            filtered_entries = []
            for entry in all_entries:
                try:
                    entry_dt = datetime.fromisoformat(entry.timestamp.replace("Z", "+00:00"))
                    if entry_dt.replace(tzinfo=None) >= cutoff:
                        filtered_entries.append(entry)
                except ValueError:
                    continue
        else:
            filtered_entries = all_entries

        return self._calculate_stats(filtered_entries)

    def get_usage_by_date_range(self, start_date: str, end_date: str) -> dict:
        """날짜 범위로 usage 통계 조회"""
        all_entries = get_all_usage_entries(self.claude_path)

        if not all_entries:
            return UsageStats().to_dict()

        # 날짜 파싱
        try:
            if "T" in start_date:
                start = datetime.fromisoformat(start_date.replace("Z", "+00:00")).replace(tzinfo=None)
            else:
                start = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            start = datetime.min

        try:
            if "T" in end_date:
                end = datetime.fromisoformat(end_date.replace("Z", "+00:00")).replace(tzinfo=None)
            else:
                end = datetime.strptime(end_date, "%Y-%m-%d")
        except ValueError:
            end = datetime.max

        # 필터링
        filtered_entries = []
        for entry in all_entries:
            try:
                entry_dt = datetime.fromisoformat(entry.timestamp.replace("Z", "+00:00")).replace(tzinfo=None)
                if start <= entry_dt <= end:
                    filtered_entries.append(entry)
            except ValueError:
                continue

        return self._calculate_stats(filtered_entries)

    def _calculate_stats(self, entries: list[UsageEntry]) -> dict:
        """엔트리에서 통계 계산"""
        if not entries:
            return UsageStats().to_dict()

        total_cost = 0.0
        total_input_tokens = 0
        total_output_tokens = 0
        total_cache_creation = 0
        total_cache_read = 0

        model_stats: dict[str, ModelUsage] = {}
        daily_stats: dict[str, DailyUsage] = {}
        project_stats: dict[str, ProjectUsage] = {}

        for entry in entries:
            # 총계 업데이트
            total_cost += entry.cost
            total_input_tokens += entry.input_tokens
            total_output_tokens += entry.output_tokens
            total_cache_creation += entry.cache_creation_tokens
            total_cache_read += entry.cache_read_tokens

            # 모델별 통계
            if entry.model not in model_stats:
                model_stats[entry.model] = ModelUsage(model=entry.model)
            ms = model_stats[entry.model]
            ms.total_cost += entry.cost
            ms.input_tokens += entry.input_tokens
            ms.output_tokens += entry.output_tokens
            ms.cache_creation_tokens += entry.cache_creation_tokens
            ms.cache_read_tokens += entry.cache_read_tokens
            ms.total_tokens = ms.input_tokens + ms.output_tokens
            ms.session_count += 1

            # 일별 통계
            date = entry.timestamp.split("T")[0] if "T" in entry.timestamp else entry.timestamp
            if date not in daily_stats:
                daily_stats[date] = DailyUsage(date=date)
            ds = daily_stats[date]
            ds.total_cost += entry.cost
            ds.total_tokens += (entry.input_tokens + entry.output_tokens +
                                entry.cache_creation_tokens + entry.cache_read_tokens)
            if entry.model not in ds.models_used:
                ds.models_used.append(entry.model)

            # 프로젝트별 통계
            if entry.project_path not in project_stats:
                project_name = entry.project_path.split("/")[-1] if "/" in entry.project_path else entry.project_path
                project_stats[entry.project_path] = ProjectUsage(
                    project_path=entry.project_path,
                    project_name=project_name,
                )
            ps = project_stats[entry.project_path]
            ps.total_cost += entry.cost
            ps.total_tokens += (entry.input_tokens + entry.output_tokens +
                                entry.cache_creation_tokens + entry.cache_read_tokens)
            ps.session_count += 1
            if entry.timestamp > ps.last_used:
                ps.last_used = entry.timestamp

        total_tokens = total_input_tokens + total_output_tokens + total_cache_creation + total_cache_read

        # 정렬
        by_model = sorted(model_stats.values(), key=lambda x: x.total_cost, reverse=True)
        by_date = sorted(daily_stats.values(), key=lambda x: x.date, reverse=True)
        by_project = sorted(project_stats.values(), key=lambda x: x.total_cost, reverse=True)

        stats = UsageStats(
            total_cost=total_cost,
            total_tokens=total_tokens,
            total_input_tokens=total_input_tokens,
            total_output_tokens=total_output_tokens,
            total_cache_creation_tokens=total_cache_creation,
            total_cache_read_tokens=total_cache_read,
            total_sessions=len(entries),
            by_model=by_model,
            by_date=by_date,
            by_project=by_project,
        )

        return stats.to_dict()
