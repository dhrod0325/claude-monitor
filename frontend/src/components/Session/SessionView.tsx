import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageList } from './MessageList';
import { BackgroundAgentPanel } from './BackgroundAgentPanel';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useSessionStore } from '@/stores/sessionStore';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api';
import type { Message, AgentLog } from '@/types';

interface SessionViewProps {
  sessionId: string;
  onBack: () => void;
}

export function SessionView({ sessionId, onBack }: SessionViewProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentLog[]>([]);
  const [agentPanelCollapsed, setAgentPanelCollapsed] = useState(false);
  const { messages, setMessages } = useSessionStore();
  const sessionMessages = messages[sessionId] || [];

  // 에이전트 메시지 실시간 처리
  const handleAgentMessage = useCallback((data: { type: string; agent_id: string; message?: Message }) => {
    setAgents((prev) => {
      const agentIndex = prev.findIndex((a) => a.agent_id === data.agent_id);

      if (data.type === 'agent_new') {
        // 새 에이전트 추가
        if (agentIndex === -1) {
          return [...prev, {
            agent_id: data.agent_id,
            messages: [],
            size_human: '0B',
            updated_at: new Date().toISOString(),
          }];
        }
        return prev;
      }

      if (data.type === 'agent_message' && data.message) {
        if (agentIndex === -1) {
          // 에이전트가 없으면 추가
          return [...prev, {
            agent_id: data.agent_id,
            messages: [data.message],
            size_human: '0B',
            updated_at: new Date().toISOString(),
          }];
        }
        // 기존 에이전트에 메시지 추가
        const updated = [...prev];
        updated[agentIndex] = {
          ...updated[agentIndex],
          messages: [...updated[agentIndex].messages, data.message],
          updated_at: new Date().toISOString(),
        };
        return updated;
      }

      return prev;
    });
  }, []);

  // WebSocket 연결 (에이전트 콜백 포함)
  useWebSocket(sessionId, { onAgentMessage: handleAgentMessage });

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const [history, agentLogs] = await Promise.all([
        api.getSessionHistory(sessionId),
        api.getSessionAgents(sessionId),
      ]);
      console.log('Loaded agents:', agentLogs);
      setMessages(sessionId, history as Message[]);
      setAgents(agentLogs);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, setMessages]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col"
    >
      <div
        className="border-b px-4 py-3 flex items-center justify-between"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="font-medium">{t('sessionView.session')}</h2>
            <p
              className="text-xs font-mono"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              {sessionId}
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={loadHistory} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {loading && sessionMessages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="rotating-symbol" />
            <span style={{ color: 'var(--color-muted-foreground)' }}>{t('common.loading')}</span>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-hidden">
              <MessageList messages={sessionMessages} />
            </div>
            {console.log('Rendering agents panel, count:', agents.length)}
            {agents.length > 0 && (
              <BackgroundAgentPanel
                agents={agents}
                isCollapsed={agentPanelCollapsed}
                onToggleCollapse={() => setAgentPanelCollapsed(!agentPanelCollapsed)}
              />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
