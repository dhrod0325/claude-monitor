"""In-Memory 캐싱 모듈"""

import logging
import threading
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from cachetools import TTLCache

logger = logging.getLogger(__name__)


@dataclass
class CacheStats:
    """캐시 통계"""
    name: str
    size: int
    maxsize: int
    ttl: int
    hits: int
    misses: int
    hit_rate: float


class CacheManager:
    """중앙 캐시 관리자"""

    def __init__(self):
        self._caches: dict[str, TTLCache] = {}
        self._stats: dict[str, dict] = {}
        self._lock = threading.Lock()
        logger.debug("CacheManager initialized")

    def create_cache(self, name: str, maxsize: int = 128, ttl: int = 60) -> TTLCache:
        """새 캐시 생성"""
        with self._lock:
            if name in self._caches:
                return self._caches[name]

            cache = TTLCache(maxsize=maxsize, ttl=ttl)
            self._caches[name] = cache
            self._stats[name] = {
                "hits": 0,
                "misses": 0,
                "maxsize": maxsize,
                "ttl": ttl,
                "created_at": datetime.now(),
            }
            logger.debug(f"Cache created: {name} (maxsize={maxsize}, ttl={ttl}s)")
            return cache

    def get_cache(self, name: str) -> TTLCache | None:
        """캐시 조회"""
        return self._caches.get(name)

    def get(self, cache_name: str, key: str) -> Any | None:
        """캐시에서 값 조회"""
        cache = self._caches.get(cache_name)
        if cache is None:
            return None

        value = cache.get(key)
        with self._lock:
            if value is not None:
                self._stats[cache_name]["hits"] += 1
            else:
                self._stats[cache_name]["misses"] += 1
        return value

    def set(self, cache_name: str, key: str, value: Any) -> None:
        """캐시에 값 저장"""
        cache = self._caches.get(cache_name)
        if cache is not None:
            cache[key] = value

    def delete(self, cache_name: str, key: str) -> bool:
        """캐시에서 값 삭제"""
        cache = self._caches.get(cache_name)
        if cache is not None and key in cache:
            del cache[key]
            return True
        return False

    def clear(self, cache_name: str | None = None) -> int:
        """캐시 클리어"""
        cleared = 0
        with self._lock:
            if cache_name:
                cache = self._caches.get(cache_name)
                if cache:
                    cleared = len(cache)
                    cache.clear()
                    self._stats[cache_name]["hits"] = 0
                    self._stats[cache_name]["misses"] = 0
                    logger.debug(f"Cache cleared: {cache_name} ({cleared} items)")
            else:
                for name, cache in self._caches.items():
                    cleared += len(cache)
                    cache.clear()
                    self._stats[name]["hits"] = 0
                    self._stats[name]["misses"] = 0
                logger.debug(f"All caches cleared ({cleared} items)")
        return cleared

    def get_stats(self, cache_name: str | None = None) -> list[CacheStats]:
        """캐시 통계 조회"""
        stats_list = []
        with self._lock:
            names = [cache_name] if cache_name else self._caches.keys()
            for name in names:
                if name not in self._caches:
                    continue
                cache = self._caches[name]
                stat = self._stats[name]
                total = stat["hits"] + stat["misses"]
                hit_rate = (stat["hits"] / total * 100) if total > 0 else 0.0

                stats_list.append(CacheStats(
                    name=name,
                    size=len(cache),
                    maxsize=stat["maxsize"],
                    ttl=stat["ttl"],
                    hits=stat["hits"],
                    misses=stat["misses"],
                    hit_rate=round(hit_rate, 2),
                ))
        return stats_list

    def get_all_stats_dict(self) -> dict:
        """모든 캐시 통계를 딕셔너리로 반환"""
        stats = self.get_stats()
        return {
            "caches": [
                {
                    "name": s.name,
                    "size": s.size,
                    "maxsize": s.maxsize,
                    "ttl": s.ttl,
                    "hits": s.hits,
                    "misses": s.misses,
                    "hit_rate": s.hit_rate,
                }
                for s in stats
            ],
            "total_items": sum(s.size for s in stats),
            "total_hits": sum(s.hits for s in stats),
            "total_misses": sum(s.misses for s in stats),
        }


# 싱글톤 인스턴스
cache_manager = CacheManager()

# 캐시 이름 상수
CACHE_PROJECTS = "projects"
CACHE_SESSIONS = "sessions"
CACHE_METADATA = "metadata"
CACHE_ANALYSES = "analyses"

# 기본 캐시 생성
cache_manager.create_cache(CACHE_PROJECTS, maxsize=32, ttl=30)
cache_manager.create_cache(CACHE_SESSIONS, maxsize=64, ttl=30)
cache_manager.create_cache(CACHE_METADATA, maxsize=256, ttl=60)
cache_manager.create_cache(CACHE_ANALYSES, maxsize=64, ttl=120)
