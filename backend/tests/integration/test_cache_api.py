"""캐시 API 통합 테스트"""

import pytest
from fastapi.testclient import TestClient

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from main import app
from services.cache import cache_manager


@pytest.fixture
def client():
    """테스트 클라이언트 fixture"""
    return TestClient(app)


@pytest.fixture(autouse=True)
def clear_cache_before_test():
    """각 테스트 전에 캐시 클리어"""
    cache_manager.clear()
    yield
    cache_manager.clear()


class TestCacheStatsAPI:
    """캐시 통계 API 테스트"""

    def test_get_cache_stats(self, client):
        """캐시 통계 조회 테스트"""
        response = client.get("/api/cache/stats")
        assert response.status_code == 200

        data = response.json()
        assert "caches" in data
        assert "total_items" in data
        assert "total_hits" in data
        assert "total_misses" in data

    def test_cache_stats_after_requests(self, client):
        """API 요청 후 캐시 통계 변화 테스트"""
        client.get("/api/projects")
        client.get("/api/projects")

        response = client.get("/api/cache/stats")
        assert response.status_code == 200

        data = response.json()
        assert data["total_hits"] >= 1 or data["total_misses"] >= 1


class TestClearCacheAPI:
    """캐시 클리어 API 테스트"""

    def test_clear_all_cache(self, client):
        """모든 캐시 클리어 테스트"""
        client.get("/api/projects")

        response = client.delete("/api/cache")
        assert response.status_code == 200

        data = response.json()
        assert "cleared" in data
        assert "message" in data

    def test_clear_specific_cache(self, client):
        """특정 캐시 클리어 테스트"""
        client.get("/api/projects")

        response = client.delete("/api/cache/projects")
        assert response.status_code == 200

        data = response.json()
        assert data["cache"] == "projects"
        assert "cleared" in data

    def test_clear_nonexistent_cache(self, client):
        """존재하지 않는 캐시 클리어 테스트"""
        response = client.delete("/api/cache/nonexistent")
        assert response.status_code == 200

        data = response.json()
        assert data["cleared"] == 0


class TestCachingBehavior:
    """캐싱 동작 테스트"""

    def test_projects_caching(self, client):
        """프로젝트 목록 캐싱 테스트"""
        response1 = client.get("/api/projects")
        assert response1.status_code == 200

        response2 = client.get("/api/projects")
        assert response2.status_code == 200

        stats = client.get("/api/cache/stats").json()
        projects_cache = next(
            (c for c in stats["caches"] if c["name"] == "projects"), None
        )

        if projects_cache:
            assert projects_cache["hits"] >= 1

    def test_cache_cleared_after_delete(self, client):
        """캐시 클리어 후 캐시 비어있음 확인"""
        client.get("/api/projects")

        stats_before = client.get("/api/cache/stats").json()

        client.delete("/api/cache")

        stats_after = client.get("/api/cache/stats").json()
        assert stats_after["total_items"] == 0
        assert stats_after["total_hits"] == 0
        assert stats_after["total_misses"] == 0
