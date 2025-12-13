import { useEffect, useRef } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import type { Message } from '@/types';

interface AgentMessage {
  type: 'agent_new' | 'agent_message';
  agent_id: string;
  message?: Message;
}

interface WebSocketCallbacks {
  onAgentMessage?: (data: AgentMessage) => void;
}

export function useWebSocket(sessionId: string | null, callbacks?: WebSocketCallbacks) {
  const ws = useRef<WebSocket | null>(null);
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addMessage = useSessionStore((state) => state.addMessage);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isConnecting = useRef(false);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!sessionId) return;

    // 이미 연결 중이거나 연결된 상태면 스킵
    if (isConnecting.current || ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const connect = () => {
      // 기존 연결 정리
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }

      isConnecting.current = true;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const socket = new WebSocket(`${protocol}//${host}/ws/${sessionId}`);

      socket.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts.current = 0;
        isConnecting.current = false;
      };

      socket.onmessage = (event) => {
        // ping/pong keep-alive 메시지는 무시
        if (event.data === 'pong' || event.data === 'ping') {
          return;
        }

        try {
          const data = JSON.parse(event.data);

          // 에이전트 메시지 처리
          if (data.type === 'agent_new' || data.type === 'agent_message') {
            callbacksRef.current?.onAgentMessage?.(data as AgentMessage);
          } else {
            // 일반 세션 메시지
            addMessage(sessionId, data as Message);
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        isConnecting.current = false;
        ws.current = null;

        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeout.current = setTimeout(connect, delay);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        isConnecting.current = false;
      };

      ws.current = socket;

      // Keep-alive ping
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }
      pingInterval.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send('ping');
        }
      }, 30000);
    };

    connect();

    return () => {
      isConnecting.current = false;
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
        pingInterval.current = null;
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [sessionId, addMessage]);

  return ws.current;
}
