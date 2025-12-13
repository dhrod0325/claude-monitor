import { useState, useCallback } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { api } from '@/services/api';

export function useSessionSearch() {
  const [loading, setLoading] = useState(false);
  const { searchResults, searchQuery, setSearchResults, setSearchQuery, setError } =
    useSessionStore();

  const search = useCallback(
    async (query: string, projectId?: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      setSearchQuery(query);

      try {
        const results = await api.searchSessions(query, projectId);
        setSearchResults(results);
      } catch (err) {
        setError('검색 중 오류가 발생했습니다.');
        setSearchResults([]);
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [setSearchResults, setSearchQuery, setError]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, [setSearchQuery, setSearchResults]);

  const resumeSession = useCallback(
    async (sessionId: string, mode: 'continue' | 'resume') => {
      try {
        const result = await api.resumeSession(sessionId, mode);
        return result;
      } catch (err) {
        setError('세션 재개에 실패했습니다.');
        console.error(err);
        throw err;
      }
    },
    [setError]
  );

  return {
    searchResults,
    searchQuery,
    loading,
    search,
    clearSearch,
    resumeSession,
  };
}
