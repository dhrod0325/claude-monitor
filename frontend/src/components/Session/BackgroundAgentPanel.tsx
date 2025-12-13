import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Bot, Layers, Maximize2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Markdown } from '@/components/ui/markdown';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AgentLog, Message, ToolCallItem } from '@/types';
import { ToolCall } from './ToolCall';

interface BackgroundAgentPanelProps {
  agents: AgentLog[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function BackgroundAgentPanel({
  agents,
  isCollapsed,
  onToggleCollapse,
}: BackgroundAgentPanelProps) {
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [fullScreenAgent, setFullScreenAgent] = useState<AgentLog | null>(null);

  const toggleAgent = (agentId: string) => {
    setExpandedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  if (agents.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className="border-l flex flex-col h-full"
        style={{
          borderColor: 'var(--color-border)',
          width: isCollapsed ? '48px' : undefined,
          minWidth: isCollapsed ? '48px' : '400px',
          transition: 'width 0.2s ease, min-width 0.2s ease',
        }}
      >
        <div
          className="border-b px-3 py-3 flex items-center justify-between cursor-pointer"
          style={{ borderColor: 'var(--color-border)' }}
          onClick={onToggleCollapse}
        >
          {isCollapsed ? (
            <div className="flex flex-col items-center w-full gap-1">
              <Layers className="w-4 h-4" style={{ color: 'var(--color-muted-foreground)' }} />
              <Badge variant="secondary" className="text-xs px-1">
                {agents.length}
              </Badge>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" style={{ color: 'var(--color-muted-foreground)' }} />
                <span className="font-medium text-sm">Background Agents</span>
                <Badge variant="secondary">{agents.length}</Badge>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-muted-foreground)' }} />
            </>
          )}
        </div>

        {!isCollapsed && (
          <ScrollArea className="h-full flex-1">
            <div className="p-2 space-y-2">
              {agents.map((agent) => (
                <AgentItem
                  key={agent.agent_id}
                  agent={agent}
                  isExpanded={expandedAgents.has(agent.agent_id)}
                  onToggle={() => toggleAgent(agent.agent_id)}
                  onFullScreen={() => setFullScreenAgent(agent)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <Dialog open={!!fullScreenAgent} onOpenChange={(open) => !open && setFullScreenAgent(null)}>
        <DialogContent fullScreen className="rounded-lg">
          <DialogHeader className="border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
              <span className="font-mono">{fullScreenAgent?.agent_id}</span>
              <Badge variant="secondary" className="ml-2">
                {fullScreenAgent?.messages.length} messages
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 mt-4">
            <div className="space-y-4 pr-4">
              {fullScreenAgent?.messages.map((msg, idx) => (
                <AgentMessage key={idx} message={msg} fullScreen />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface AgentItemProps {
  agent: AgentLog;
  isExpanded: boolean;
  onToggle: () => void;
  onFullScreen: () => void;
}

function AgentItem({ agent, isExpanded, onToggle, onFullScreen }: AgentItemProps) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-card)',
      }}
    >
      <div
        className="px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-opacity-80"
        style={{ backgroundColor: 'var(--color-muted)' }}
        onClick={onToggle}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        )}
        <Bot className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
        <span className="font-mono text-xs truncate">{agent.agent_id}</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFullScreen();
            }}
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="Full screen"
          >
            <Maximize2 className="w-3.5 h-3.5" style={{ color: 'var(--color-muted-foreground)' }} />
          </button>
          <Badge variant="outline" className="text-xs">
            {agent.messages.length} msgs
          </Badge>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-4 max-h-[500px] overflow-y-auto">
              {agent.messages.map((msg, idx) => (
                <AgentMessage key={idx} message={msg} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AgentMessageProps {
  message: Message;
  fullScreen?: boolean;
}

function AgentMessage({ message, fullScreen = false }: AgentMessageProps) {
  const padding = fullScreen ? 'p-4' : 'p-3';
  const textSize = fullScreen ? 'text-sm' : 'text-xs';
  const iconSize = fullScreen ? 'w-5 h-5' : 'w-4 h-4';
  const borderWidth = fullScreen ? '4px' : '3px';
  const gap = fullScreen ? 'gap-3' : 'gap-2';
  const marginBottom = fullScreen ? 'mb-3' : 'mb-2';
  const spaceY = fullScreen ? 'space-y-3' : 'space-y-2';

  if (message.type === 'summary') {
    return (
      <Card className={`${padding} ${textSize}`}>
        <div className={`flex items-start ${gap}`}>
          <span
            className={`font-medium shrink-0 ${textSize}`}
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            Summary:
          </span>
          <Markdown content={message.content || ''} className={textSize} />
        </div>
      </Card>
    );
  }

  if (message.type === 'user') {
    return (
      <Card
        className={`${padding} ${textSize}`}
        style={{
          backgroundColor: 'var(--color-secondary)',
          borderColor: 'var(--color-primary)',
          borderLeftWidth: borderWidth,
        }}
      >
        <span
          className={`font-semibold block ${marginBottom} ${textSize}`}
          style={{ color: 'var(--color-primary)' }}
        >
          Task
        </span>
        <Markdown content={message.content || ''} className={textSize} />
      </Card>
    );
  }

  if (message.type === 'assistant') {
    return (
      <Card className={`${padding} ${spaceY}`}>
        <div className={`flex items-center ${gap} ${marginBottom}`}>
          <Bot className={iconSize} style={{ color: 'var(--color-primary)' }} />
          <span className={`${textSize} font-medium`}>Assistant</span>
        </div>
        {message.items?.map((item, idx) => (
          <div key={idx}>
            {item.type === 'text' && (
              <Markdown content={item.content || ''} className={textSize} />
            )}
            {item.type === 'tool' && (
              <ToolCall tool={item as ToolCallItem} compact={!fullScreen} />
            )}
          </div>
        ))}
      </Card>
    );
  }

  return null;
}
