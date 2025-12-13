import { create } from 'zustand';
import type { Analysis, AnalysisListItem, SelectedSession, ClaudeModelId } from '@/types';
import { DEFAULT_MODEL } from '@/types';
import { api } from '@/services/api';

interface StreamState {
  isConnected: boolean;
  isStreaming: boolean;
  streamingContent: string;
  promptCount: number;
  streamError: string | null;
}

interface AnalysisState {
  // 상태
  analyses: AnalysisListItem[];
  currentAnalysis: Analysis | null;
  selectedSessions: SelectedSession[];
  selectedModel: ClaudeModelId;
  isAnalyzing: boolean;
  isLoading: boolean;
  error: string | null;

  // 스트리밍 상태
  stream: StreamState;
  wsRef: WebSocket | null;

  // 액션
  toggleSessionSelection: (session: SelectedSession) => void;
  selectAllSessions: (sessions: SelectedSession[]) => void;
  clearSelection: () => void;
  clearProjectSessions: (projectId: string) => void;
  isSessionSelected: (sessionId: string) => boolean;
  setSelectedModel: (model: ClaudeModelId) => void;

  requestAnalysis: () => Promise<Analysis | null>;
  reanalyze: (analysisId: string) => Promise<Analysis | null>;
  fetchAnalyses: (projectId?: string) => Promise<void>;
  fetchAnalysis: (analysisId: string) => Promise<void>;
  deleteAnalysis: (analysisId: string) => Promise<boolean>;
  setCurrentAnalysis: (analysis: Analysis) => void;
  clearCurrentAnalysis: () => void;
  clearError: () => void;

  // 스트리밍 액션
  startStreamingAnalysis: () => void;
  startStreamingReanalyze: (analysis: Analysis) => void;
  cancelStreamingAnalysis: () => void;
  resetStreamState: () => void;
}

const initialStreamState: StreamState = {
  isConnected: false,
  isStreaming: false,
  streamingContent: '',
  promptCount: 0,
  streamError: null,
};

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  // 초기 상태
  analyses: [],
  currentAnalysis: null,
  selectedSessions: [],
  selectedModel: DEFAULT_MODEL,
  isAnalyzing: false,
  isLoading: false,
  error: null,

  // 스트리밍 초기 상태
  stream: initialStreamState,
  wsRef: null,

  // 세션 선택
  toggleSessionSelection: (session: SelectedSession) => {
    const { selectedSessions } = get();
    const isSelected = selectedSessions.some((s) => s.sessionId === session.sessionId);
    set({
      selectedSessions: isSelected
        ? selectedSessions.filter((s) => s.sessionId !== session.sessionId)
        : [...selectedSessions, session],
    });
  },

  selectAllSessions: (sessions: SelectedSession[]) => {
    const { selectedSessions } = get();
    // 이미 선택된 세션 제외하고 추가
    const newSessions = sessions.filter(
      (s) => !selectedSessions.some((selected) => selected.sessionId === s.sessionId)
    );
    set({ selectedSessions: [...selectedSessions, ...newSessions] });
  },

  clearSelection: () => {
    set({ selectedSessions: [] });
  },

  clearProjectSessions: (projectId: string) => {
    const { selectedSessions } = get();
    set({
      selectedSessions: selectedSessions.filter((s) => s.projectId !== projectId),
    });
  },

  isSessionSelected: (sessionId: string) => {
    const { selectedSessions } = get();
    return selectedSessions.some((s) => s.sessionId === sessionId);
  },

  setSelectedModel: (model: ClaudeModelId) => {
    set({ selectedModel: model });
  },

  // 분석 요청
  requestAnalysis: async () => {
    const { selectedSessions } = get();
    if (selectedSessions.length === 0) {
      set({ error: '분석할 세션을 선택해주세요.' });
      return null;
    }

    set({ isAnalyzing: true, error: null });
    try {
      const sessionIds = selectedSessions.map((s) => s.sessionId);
      // 단일 프로젝트면 project_id 포함, 여러 프로젝트면 생략
      const uniqueProjects = [...new Set(selectedSessions.map((s) => s.projectId))];
      const analysis = await api.analyzePrompts({
        project_id: uniqueProjects.length === 1 ? uniqueProjects[0] : undefined,
        session_ids: sessionIds,
      });
      set({
        currentAnalysis: analysis,
        isAnalyzing: false,
        selectedSessions: [],
      });
      // 목록 갱신
      get().fetchAnalyses();
      return analysis;
    } catch (err) {
      const message = err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.';
      set({ error: message, isAnalyzing: false });
      return null;
    }
  },

  // 재분석
  reanalyze: async (analysisId: string) => {
    set({ isAnalyzing: true, error: null });
    try {
      const analysis = await api.reanalyze(analysisId);
      set({ currentAnalysis: analysis, isAnalyzing: false });
      // 목록 갱신
      get().fetchAnalyses();
      return analysis;
    } catch (err) {
      const message = err instanceof Error ? err.message : '재분석 중 오류가 발생했습니다.';
      set({ error: message, isAnalyzing: false });
      return null;
    }
  },

  // 분석 목록 조회
  fetchAnalyses: async (projectId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const analyses = await api.getAnalyses(projectId);
      set({ analyses, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '목록 조회 중 오류가 발생했습니다.';
      set({ error: message, isLoading: false });
    }
  },

  // 분석 상세 조회
  fetchAnalysis: async (analysisId: string) => {
    set({ isLoading: true, error: null });
    try {
      const analysis = await api.getAnalysis(analysisId);
      set({ currentAnalysis: analysis, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '상세 조회 중 오류가 발생했습니다.';
      set({ error: message, isLoading: false });
    }
  },

  // 분석 삭제
  deleteAnalysis: async (analysisId: string) => {
    try {
      await api.deleteAnalysis(analysisId);
      set((state) => ({
        analyses: state.analyses.filter((a) => a.id !== analysisId),
        currentAnalysis:
          state.currentAnalysis?.id === analysisId ? null : state.currentAnalysis,
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.';
      set({ error: message });
      return false;
    }
  },

  setCurrentAnalysis: (analysis: Analysis) => {
    set({ currentAnalysis: analysis });
  },

  clearCurrentAnalysis: () => {
    set({ currentAnalysis: null });
  },

  clearError: () => {
    set({ error: null });
  },

  // 스트리밍 분석 시작
  startStreamingAnalysis: () => {
    const { wsRef, selectedSessions, selectedModel } = get();

    if (selectedSessions.length === 0) {
      set({ error: '분석할 세션을 선택해주세요.' });
      return;
    }

    // 기존 연결 정리
    if (wsRef) {
      wsRef.close();
    }

    set({
      stream: {
        isConnected: false,
        isStreaming: true,
        streamingContent: '',
        promptCount: 0,
        streamError: null,
      },
      isAnalyzing: true,
    });

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/analysis/ws/stream`;

    const ws = new WebSocket(wsUrl);
    set({ wsRef: ws });

    const sessionIds = selectedSessions.map((s) => s.sessionId);
    const uniqueProjects = [...new Set(selectedSessions.map((s) => s.projectId))];
    const projectId = uniqueProjects.length === 1 ? uniqueProjects[0] : undefined;

    ws.onopen = () => {
      set((state) => ({
        stream: { ...state.stream, isConnected: true },
      }));
      ws.send(JSON.stringify({
        project_id: projectId,
        session_ids: sessionIds,
        model: selectedModel,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'start':
            set((state) => ({
              stream: { ...state.stream, promptCount: data.prompt_count },
            }));
            break;

          case 'chunk':
            set((state) => ({
              stream: {
                ...state.stream,
                streamingContent: state.stream.streamingContent + data.content,
              },
            }));
            break;

          case 'complete':
            set((state) => ({
              stream: { ...state.stream, isStreaming: false },
              currentAnalysis: data.analysis,
              isAnalyzing: false,
              selectedSessions: [],
            }));
            // 목록 갱신
            get().fetchAnalyses();
            break;

          case 'error':
            set((state) => ({
              stream: {
                ...state.stream,
                isStreaming: false,
                streamError: data.message,
              },
              isAnalyzing: false,
            }));
            break;
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = () => {
      set((state) => ({
        stream: {
          ...state.stream,
          isStreaming: false,
          streamError: 'WebSocket connection error',
        },
        isAnalyzing: false,
      }));
    };

    ws.onclose = () => {
      set((state) => ({
        stream: { ...state.stream, isConnected: false },
        wsRef: null,
      }));
    };
  },

  // 스트리밍 재분석
  startStreamingReanalyze: (analysis: Analysis) => {
    const { wsRef, selectedModel } = get();

    // 기존 연결 정리
    if (wsRef) {
      wsRef.close();
    }

    // 현재 분석 결과 초기화
    set({
      currentAnalysis: null,
      stream: {
        isConnected: false,
        isStreaming: true,
        streamingContent: '',
        promptCount: 0,
        streamError: null,
      },
      isAnalyzing: true,
    });

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/analysis/ws/stream`;

    const ws = new WebSocket(wsUrl);
    set({ wsRef: ws });

    ws.onopen = () => {
      set((state) => ({
        stream: { ...state.stream, isConnected: true },
      }));
      // 기존 분석의 project_id와 session_ids 사용, 현재 선택된 모델 사용
      ws.send(JSON.stringify({
        project_id: analysis.project_id,
        session_ids: analysis.session_ids,
        model: selectedModel,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'start':
            set((state) => ({
              stream: { ...state.stream, promptCount: data.prompt_count },
            }));
            break;

          case 'chunk':
            set((state) => ({
              stream: {
                ...state.stream,
                streamingContent: state.stream.streamingContent + data.content,
              },
            }));
            break;

          case 'complete':
            set((state) => ({
              stream: { ...state.stream, isStreaming: false },
              currentAnalysis: data.analysis,
              isAnalyzing: false,
            }));
            get().fetchAnalyses();
            break;

          case 'error':
            set((state) => ({
              stream: {
                ...state.stream,
                isStreaming: false,
                streamError: data.message,
              },
              isAnalyzing: false,
            }));
            break;
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = () => {
      set((state) => ({
        stream: {
          ...state.stream,
          isStreaming: false,
          streamError: 'WebSocket connection error',
        },
        isAnalyzing: false,
      }));
    };

    ws.onclose = () => {
      set((state) => ({
        stream: { ...state.stream, isConnected: false },
        wsRef: null,
      }));
    };
  },

  // 스트리밍 취소
  cancelStreamingAnalysis: () => {
    const { wsRef } = get();
    if (wsRef) {
      wsRef.close();
    }
    set({
      stream: { ...initialStreamState },
      wsRef: null,
      isAnalyzing: false,
    });
  },

  // 스트리밍 상태 리셋
  resetStreamState: () => {
    set({
      stream: { ...initialStreamState },
    });
  },
}));
