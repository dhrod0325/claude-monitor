import { useEffect, useCallback } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { api } from '@/services/api';

export function useProjects() {
  const {
    projects,
    setProjects,
    selectedProject,
    setSelectedProject,
    sessions,
    setSessions,
    setLoading,
    setError,
  } = useSessionStore();

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      setError('프로젝트 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [setProjects, setLoading, setError]);

  const selectProject = useCallback(
    async (project: typeof selectedProject) => {
      setSelectedProject(project);
      if (!project) {
        setSessions([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await api.getSessions(project.id);
        setSessions(data);
      } catch (err) {
        setError('세션 목록을 불러오는데 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [setSelectedProject, setSessions, setLoading, setError]
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    selectedProject,
    sessions,
    loadProjects,
    selectProject,
  };
}
