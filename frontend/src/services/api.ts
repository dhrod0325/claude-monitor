import type { Project, Session, SessionMetadata, SearchResult, Message, AgentLog, UsageStats, Analysis, AnalysisListItem, AnalysisRequest, WorkAnalysis, WorkAnalysisListItem, WorkAnalysisRequest } from '@/types';

const API_BASE = '/api';

export const api = {
  // Projects
  getProjects: async (): Promise<Project[]> => {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  getProject: async (projectId: string): Promise<Project> => {
    const res = await fetch(`${API_BASE}/projects/${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch project');
    return res.json();
  },

  // Sessions
  getSessions: async (projectId: string): Promise<Session[]> => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/sessions`);
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return res.json();
  },

  getSessionHistory: async (sessionId: string, limit = 100): Promise<Message[]> => {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/history?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch session history');
    return res.json();
  },

  getSessionMetadata: async (sessionId: string): Promise<SessionMetadata> => {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/metadata`);
    if (!res.ok) throw new Error('Failed to fetch session metadata');
    return res.json();
  },

  getSessionAgents: async (sessionId: string): Promise<AgentLog[]> => {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/agents`);
    if (!res.ok) throw new Error('Failed to fetch agent logs');
    return res.json();
  },

  // Search
  searchSessions: async (query: string, projectId?: string): Promise<SearchResult[]> => {
    const params = new URLSearchParams({ q: query });
    if (projectId) params.append('project_id', projectId);
    const res = await fetch(`${API_BASE}/sessions/search?${params}`);
    if (!res.ok) throw new Error('Failed to search sessions');
    return res.json();
  },

  // Resume
  getResumeInfo: async (sessionId: string) => {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/resume-info`);
    if (!res.ok) throw new Error('Failed to fetch resume info');
    return res.json();
  },

  resumeSession: async (sessionId: string, mode: 'continue' | 'resume') => {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/resume?mode=${mode}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to resume session');
    return res.json();
  },

  // Usage
  getUsageStats: async (days?: number): Promise<UsageStats> => {
    const params = days ? `?days=${days}` : '';
    const res = await fetch(`${API_BASE}/usage/stats${params}`);
    if (!res.ok) throw new Error('Failed to fetch usage stats');
    return res.json();
  },

  getUsageByDateRange: async (startDate: string, endDate: string): Promise<UsageStats> => {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    const res = await fetch(`${API_BASE}/usage/range?${params}`);
    if (!res.ok) throw new Error('Failed to fetch usage by date range');
    return res.json();
  },

  // Analysis
  analyzePrompts: async (request: AnalysisRequest): Promise<Analysis> => {
    const res = await fetch(`${API_BASE}/analysis/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Analysis failed' }));
      throw new Error(error.detail || 'Analysis failed');
    }
    return res.json();
  },

  getAnalyses: async (projectId?: string): Promise<AnalysisListItem[]> => {
    const params = projectId ? `?project_id=${projectId}` : '';
    const res = await fetch(`${API_BASE}/analysis/list${params}`);
    if (!res.ok) throw new Error('Failed to fetch analyses');
    return res.json();
  },

  getAnalysis: async (analysisId: string): Promise<Analysis> => {
    const res = await fetch(`${API_BASE}/analysis/${analysisId}`);
    if (!res.ok) throw new Error('Failed to fetch analysis');
    return res.json();
  },

  deleteAnalysis: async (analysisId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/analysis/${analysisId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete analysis');
  },

  reanalyze: async (analysisId: string): Promise<Analysis> => {
    const res = await fetch(`${API_BASE}/analysis/${analysisId}/reanalyze`, {
      method: 'POST',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Reanalysis failed' }));
      throw new Error(error.detail || 'Reanalysis failed');
    }
    return res.json();
  },

  // Work Analysis
  analyzeWork: async (request: WorkAnalysisRequest): Promise<WorkAnalysis> => {
    const res = await fetch(`${API_BASE}/work-analysis/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Work analysis failed' }));
      throw new Error(error.detail || 'Work analysis failed');
    }
    return res.json();
  },

  getWorkAnalyses: async (): Promise<WorkAnalysisListItem[]> => {
    const res = await fetch(`${API_BASE}/work-analysis/list`);
    if (!res.ok) throw new Error('Failed to fetch work analyses');
    return res.json();
  },

  getWorkAnalysis: async (id: string): Promise<WorkAnalysis> => {
    const res = await fetch(`${API_BASE}/work-analysis/${id}`);
    if (!res.ok) throw new Error('Failed to fetch work analysis');
    return res.json();
  },

  deleteWorkAnalysis: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/work-analysis/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete work analysis');
  },

  reanalyzeWork: async (id: string): Promise<WorkAnalysis> => {
    const res = await fetch(`${API_BASE}/work-analysis/${id}/reanalyze`, {
      method: 'POST',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Work reanalysis failed' }));
      throw new Error(error.detail || 'Work reanalysis failed');
    }
    return res.json();
  },

  getSessionsByDateRange: async (dateFrom: string, dateTo: string, projectIds?: string[]): Promise<{ project_id: string; project_name: string; sessions: Session[] }[]> => {
    const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
    if (projectIds && projectIds.length > 0) {
      projectIds.forEach(id => params.append('project_ids', id));
    }
    const res = await fetch(`${API_BASE}/sessions/by-date-range?${params}`);
    if (!res.ok) throw new Error('Failed to fetch sessions by date range');
    return res.json();
  },
};
