import { create } from 'zustand';
import type { WorkAnalysis, WorkAnalysisListItem, ClaudeModelId } from '@/types';
import { DEFAULT_MODEL } from '@/types';
import { api } from '@/services/api';

interface StreamState {
  isConnected: boolean;
  isStreaming: boolean;
  streamingContent: string;
  sessionCount: number;
  streamError: string | null;
  // 청크 진행 상태
  currentChunk: number;
  totalChunks: number;
  phase: 'preparing' | 'single' | 'chunk_analysis' | 'final_analysis' | 'complete';
}

interface WorkAnalysisState {
  // 상태
  analyses: WorkAnalysisListItem[];
  currentAnalysis: WorkAnalysis | null;
  isAnalyzing: boolean;
  isLoading: boolean;
  error: string | null;

  // 선택 상태
  selectedDateFrom: string;
  selectedDateTo: string;
  selectedProjectIds: string[];
  selectedModel: ClaudeModelId;

  // 스트리밍 상태
  stream: StreamState;
  wsRef: WebSocket | null;

  // 날짜 선택 액션
  setDateRange: (from: string, to: string) => void;
  setDateFrom: (date: string) => void;
  setDateTo: (date: string) => void;

  // 프로젝트 선택 액션
  toggleProjectSelection: (projectId: string) => void;
  selectProjects: (projectIds: string[]) => void;
  clearProjectSelection: () => void;
  setSelectedModel: (model: ClaudeModelId) => void;

  // API 액션
  requestWorkAnalysis: () => Promise<WorkAnalysis | null>;
  reanalyze: (id: string) => Promise<WorkAnalysis | null>;
  fetchWorkAnalyses: () => Promise<void>;
  fetchWorkAnalysis: (id: string) => Promise<void>;
  deleteWorkAnalysis: (id: string) => Promise<boolean>;
  setCurrentAnalysis: (analysis: WorkAnalysis) => void;
  clearCurrentAnalysis: () => void;
  clearError: () => void;

  // 스트리밍 액션
  startStreamingWorkAnalysis: () => void;
  startStreamingReanalyze: (analysis: WorkAnalysis) => void;
  cancelStreamingAnalysis: () => void;
  resetStreamState: () => void;
}

const initialStreamState: StreamState = {
  isConnected: false,
  isStreaming: false,
  streamingContent: '',
  sessionCount: 0,
  streamError: null,
  currentChunk: 0,
  totalChunks: 0,
  phase: 'preparing',
};

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
const getTodayString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const useWorkAnalysisStore = create<WorkAnalysisState>((set, get) => ({
  // 초기 상태
  analyses: [],
  currentAnalysis: null,
  isAnalyzing: false,
  isLoading: false,
  error: null,

  // 선택 상태 초기값
  selectedDateFrom: getTodayString(),
  selectedDateTo: getTodayString(),
  selectedProjectIds: [],
  selectedModel: DEFAULT_MODEL,

  // 스트리밍 초기 상태
  stream: initialStreamState,
  wsRef: null,

  // 날짜 선택
  setDateRange: (from: string, to: string) => {
    set({ selectedDateFrom: from, selectedDateTo: to });
  },

  setDateFrom: (date: string) => {
    set({ selectedDateFrom: date });
  },

  setDateTo: (date: string) => {
    set({ selectedDateTo: date });
  },

  // 프로젝트 선택
  toggleProjectSelection: (projectId: string) => {
    const { selectedProjectIds } = get();
    const isSelected = selectedProjectIds.includes(projectId);
    set({
      selectedProjectIds: isSelected
        ? selectedProjectIds.filter((id) => id !== projectId)
        : [...selectedProjectIds, projectId],
    });
  },

  selectProjects: (projectIds: string[]) => {
    set({ selectedProjectIds: projectIds });
  },

  clearProjectSelection: () => {
    set({ selectedProjectIds: [] });
  },

  setSelectedModel: (model: ClaudeModelId) => {
    set({ selectedModel: model });
  },

  // 분석 요청
  requestWorkAnalysis: async () => {
    const { selectedDateFrom, selectedDateTo, selectedProjectIds } = get();

    set({ isAnalyzing: true, error: null });
    try {
      const analysis = await api.analyzeWork({
        date_from: selectedDateFrom,
        date_to: selectedDateTo,
        project_ids: selectedProjectIds.length > 0 ? selectedProjectIds : undefined,
      });
      set({
        currentAnalysis: analysis,
        isAnalyzing: false,
      });
      get().fetchWorkAnalyses();
      return analysis;
    } catch (err) {
      const message = err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.';
      set({ error: message, isAnalyzing: false });
      return null;
    }
  },

  // 재분석
  reanalyze: async (id: string) => {
    set({ isAnalyzing: true, error: null });
    try {
      const analysis = await api.reanalyzeWork(id);
      set({ currentAnalysis: analysis, isAnalyzing: false });
      get().fetchWorkAnalyses();
      return analysis;
    } catch (err) {
      const message = err instanceof Error ? err.message : '재분석 중 오류가 발생했습니다.';
      set({ error: message, isAnalyzing: false });
      return null;
    }
  },

  // 분석 목록 조회
  fetchWorkAnalyses: async () => {
    set({ isLoading: true, error: null });
    try {
      const analyses = await api.getWorkAnalyses();
      set({ analyses, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '목록 조회 중 오류가 발생했습니다.';
      set({ error: message, isLoading: false });
    }
  },

  // 분석 상세 조회
  fetchWorkAnalysis: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const analysis = await api.getWorkAnalysis(id);
      set({ currentAnalysis: analysis, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '상세 조회 중 오류가 발생했습니다.';
      set({ error: message, isLoading: false });
    }
  },

  // 분석 삭제
  deleteWorkAnalysis: async (id: string) => {
    try {
      await api.deleteWorkAnalysis(id);
      set((state) => ({
        analyses: state.analyses.filter((a) => a.id !== id),
        currentAnalysis: state.currentAnalysis?.id === id ? null : state.currentAnalysis,
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.';
      set({ error: message });
      return false;
    }
  },

  setCurrentAnalysis: (analysis: WorkAnalysis) => {
    set({ currentAnalysis: analysis });
  },

  clearCurrentAnalysis: () => {
    set({ currentAnalysis: null });
  },

  clearError: () => {
    set({ error: null });
  },

  // 스트리밍 분석 시작
  startStreamingWorkAnalysis: () => {
    const { wsRef, selectedDateFrom, selectedDateTo, selectedProjectIds, selectedModel } = get();

    // 기존 연결 정리
    if (wsRef) {
      wsRef.close();
    }

    set({
      stream: {
        ...initialStreamState,
        isStreaming: true,
      },
      isAnalyzing: true,
    });

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/work-analysis/ws/stream`;

    const ws = new WebSocket(wsUrl);
    set({ wsRef: ws });

    ws.onopen = () => {
      set((state) => ({
        stream: { ...state.stream, isConnected: true },
      }));
      ws.send(JSON.stringify({
        date_from: selectedDateFrom,
        date_to: selectedDateTo,
        project_ids: selectedProjectIds.length > 0 ? selectedProjectIds : undefined,
        model: selectedModel,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'start':
            set((state) => ({
              stream: { ...state.stream, sessionCount: data.session_count },
            }));
            break;

          case 'chunk_info':
            set((state) => ({
              stream: {
                ...state.stream,
                currentChunk: data.current_chunk,
                totalChunks: data.total_chunks,
                phase: data.phase,
              },
            }));
            break;

          case 'chunk_complete':
            set((state) => ({
              stream: {
                ...state.stream,
                currentChunk: data.current_chunk,
                totalChunks: data.total_chunks,
              },
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
              stream: { ...state.stream, isStreaming: false, phase: 'complete' },
              currentAnalysis: data.analysis,
              isAnalyzing: false,
            }));
            get().fetchWorkAnalyses();
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
  startStreamingReanalyze: (analysis: WorkAnalysis) => {
    const { wsRef, selectedModel } = get();

    if (wsRef) {
      wsRef.close();
    }

    set({
      currentAnalysis: null,
      stream: {
        ...initialStreamState,
        isStreaming: true,
      },
      isAnalyzing: true,
    });

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/work-analysis/ws/stream`;

    const ws = new WebSocket(wsUrl);
    set({ wsRef: ws });

    ws.onopen = () => {
      set((state) => ({
        stream: { ...state.stream, isConnected: true },
      }));
      ws.send(JSON.stringify({
        date_from: analysis.date_from,
        date_to: analysis.date_to,
        project_ids: analysis.project_ids.length > 0 ? analysis.project_ids : undefined,
        model: selectedModel,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'start':
            set((state) => ({
              stream: { ...state.stream, sessionCount: data.session_count },
            }));
            break;

          case 'chunk_info':
            set((state) => ({
              stream: {
                ...state.stream,
                currentChunk: data.current_chunk,
                totalChunks: data.total_chunks,
                phase: data.phase,
              },
            }));
            break;

          case 'chunk_complete':
            set((state) => ({
              stream: {
                ...state.stream,
                currentChunk: data.current_chunk,
                totalChunks: data.total_chunks,
              },
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
              stream: { ...state.stream, isStreaming: false, phase: 'complete' },
              currentAnalysis: data.analysis,
              isAnalyzing: false,
            }));
            get().fetchWorkAnalyses();
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
