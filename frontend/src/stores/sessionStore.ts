import { create } from 'zustand';
import type { Project, Session, Message, SearchResult } from '@/types';

interface SessionState {
  // Projects
  projects: Project[];
  selectedProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setSelectedProject: (project: Project | null) => void;

  // Sessions
  sessions: Session[];
  selectedSession: Session | null;
  setSessions: (sessions: Session[]) => void;
  setSelectedSession: (session: Session | null) => void;

  // Messages
  messages: Record<string, Message[]>;
  addMessage: (sessionId: string, message: Message) => void;
  setMessages: (sessionId: string, messages: Message[]) => void;

  // Search
  searchResults: SearchResult[];
  searchQuery: string;
  setSearchResults: (results: SearchResult[]) => void;
  setSearchQuery: (query: string) => void;

  // UI State
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  // Projects
  projects: [],
  selectedProject: null,
  setProjects: (projects) => set({ projects }),
  setSelectedProject: (project) => set({ selectedProject: project }),

  // Sessions
  sessions: [],
  selectedSession: null,
  setSessions: (sessions) => set({ sessions }),
  setSelectedSession: (session) => set({ selectedSession: session }),

  // Messages
  messages: {},
  addMessage: (sessionId, message) =>
    set((state) => {
      const existing = state.messages[sessionId] || [];
      // 중복 체크: 타입과 내용만으로 비교 (타임스탬프는 파싱시마다 새로 생성되므로 제외)
      const messageKey = JSON.stringify({
        type: message.type,
        content: message.content,
        items: message.items,
      });
      const isDuplicate = existing.some((m) => {
        const existingKey = JSON.stringify({
          type: m.type,
          content: m.content,
          items: m.items,
        });
        return existingKey === messageKey;
      });
      if (isDuplicate) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [sessionId]: [...existing, message],
        },
      };
    }),
  setMessages: (sessionId, messages) =>
    set((state) => {
      // 중복 제거
      const seen = new Set<string>();
      const uniqueMessages = messages.filter((m) => {
        const key = JSON.stringify({
          type: m.type,
          content: m.content,
          items: m.items,
        });
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
      return {
        messages: {
          ...state.messages,
          [sessionId]: uniqueMessages,
        },
      };
    }),

  // Search
  searchResults: [],
  searchQuery: '',
  setSearchResults: (results) => set({ searchResults: results }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // UI State
  isLoading: false,
  error: null,
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
