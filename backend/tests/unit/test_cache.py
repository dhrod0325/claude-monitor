"""캐시 모듈 단위 테스트"""

import time
import pytest
from services.cache import CacheManager, CacheStats


class TestCacheManager:
    """CacheManager 클래스 테스트"""

    def setup_method(self):
        """각 테스트 전에 새로운 CacheManager 인스턴스 생성"""
        self.manager = CacheManager()

    def test_create_cache(self):
        """캐시 생성 테스트"""
        cache = self.manager.create_cache("test", maxsize=10, ttl=60)
        assert cache is not None
        assert self.manager.get_cache("test") is cache

    def test_create_cache_duplicate(self):
        """중복 캐시 생성 시 기존 캐시 반환"""
        cache1 = self.manager.create_cache("test", maxsize=10, ttl=60)
        cache2 = self.manager.create_cache("test", maxsize=20, ttl=120)
        assert cache1 is cache2

    def test_get_set(self):
        """캐시 get/set 테스트"""
        self.manager.create_cache("test", maxsize=10, ttl=60)

        self.manager.set("test", "key1", "value1")
        assert self.manager.get("test", "key1") == "value1"

        assert self.manager.get("test", "nonexistent") is None

    def test_get_nonexistent_cache(self):
        """존재하지 않는 캐시 조회"""
        assert self.manager.get("nonexistent", "key") is None

    def test_delete(self):
        """캐시 항목 삭제 테스트"""
        self.manager.create_cache("test", maxsize=10, ttl=60)
        self.manager.set("test", "key1", "value1")

        assert self.manager.delete("test", "key1") is True
        assert self.manager.get("test", "key1") is None
        assert self.manager.delete("test", "key1") is False

    def test_clear_specific_cache(self):
        """특정 캐시 클리어 테스트"""
        self.manager.create_cache("test1", maxsize=10, ttl=60)
        self.manager.create_cache("test2", maxsize=10, ttl=60)

        self.manager.set("test1", "key1", "value1")
        self.manager.set("test1", "key2", "value2")
        self.manager.set("test2", "key1", "value1")

        cleared = self.manager.clear("test1")
        assert cleared == 2
        assert self.manager.get("test1", "key1") is None
        assert self.manager.get("test2", "key1") == "value1"

    def test_clear_all_caches(self):
        """모든 캐시 클리어 테스트"""
        self.manager.create_cache("test1", maxsize=10, ttl=60)
        self.manager.create_cache("test2", maxsize=10, ttl=60)

        self.manager.set("test1", "key1", "value1")
        self.manager.set("test2", "key1", "value1")

        cleared = self.manager.clear()
        assert cleared == 2
        assert self.manager.get("test1", "key1") is None
        assert self.manager.get("test2", "key1") is None

    def test_stats_hits_misses(self):
        """캐시 통계 (hits/misses) 테스트"""
        self.manager.create_cache("test", maxsize=10, ttl=60)
        self.manager.set("test", "key1", "value1")

        self.manager.get("test", "key1")  # hit
        self.manager.get("test", "key1")  # hit
        self.manager.get("test", "nonexistent")  # miss

        stats = self.manager.get_stats("test")
        assert len(stats) == 1
        assert stats[0].hits == 2
        assert stats[0].misses == 1
        assert stats[0].hit_rate == pytest.approx(66.67, rel=0.01)

    def test_stats_all_caches(self):
        """모든 캐시 통계 조회 테스트"""
        self.manager.create_cache("test1", maxsize=10, ttl=60)
        self.manager.create_cache("test2", maxsize=20, ttl=120)

        stats = self.manager.get_stats()
        assert len(stats) == 2

    def test_get_all_stats_dict(self):
        """딕셔너리 형태의 통계 조회 테스트"""
        self.manager.create_cache("test", maxsize=10, ttl=60)
        self.manager.set("test", "key1", "value1")
        self.manager.get("test", "key1")

        stats_dict = self.manager.get_all_stats_dict()

        assert "caches" in stats_dict
        assert "total_items" in stats_dict
        assert "total_hits" in stats_dict
        assert "total_misses" in stats_dict
        assert stats_dict["total_items"] == 1
        assert stats_dict["total_hits"] == 1

    def test_ttl_expiration(self):
        """TTL 만료 테스트"""
        self.manager.create_cache("test", maxsize=10, ttl=1)
        self.manager.set("test", "key1", "value1")

        assert self.manager.get("test", "key1") == "value1"

        time.sleep(1.1)

        assert self.manager.get("test", "key1") is None

    def test_maxsize_eviction(self):
        """maxsize 초과 시 eviction 테스트"""
        self.manager.create_cache("test", maxsize=2, ttl=60)

        self.manager.set("test", "key1", "value1")
        self.manager.set("test", "key2", "value2")
        self.manager.set("test", "key3", "value3")

        cache = self.manager.get_cache("test")
        assert len(cache) == 2

    def test_stats_reset_on_clear(self):
        """캐시 클리어 시 통계 리셋 테스트"""
        self.manager.create_cache("test", maxsize=10, ttl=60)
        self.manager.set("test", "key1", "value1")
        self.manager.get("test", "key1")

        self.manager.clear("test")

        stats = self.manager.get_stats("test")
        assert stats[0].hits == 0
        assert stats[0].misses == 0


class TestCacheStats:
    """CacheStats 데이터클래스 테스트"""

    def test_cache_stats_creation(self):
        """CacheStats 생성 테스트"""
        stats = CacheStats(
            name="test",
            size=10,
            maxsize=100,
            ttl=60,
            hits=50,
            misses=10,
            hit_rate=83.33,
        )

        assert stats.name == "test"
        assert stats.size == 10
        assert stats.maxsize == 100
        assert stats.ttl == 60
        assert stats.hits == 50
        assert stats.misses == 10
        assert stats.hit_rate == 83.33
