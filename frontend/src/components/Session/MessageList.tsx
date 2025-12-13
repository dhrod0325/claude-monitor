import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Markdown } from '@/components/ui/markdown';
import { ToolCall } from './ToolCall';
import { CommandWidget, OutputWidget, ToolResultWidget } from '@/components/widgets';
import type { Message, ToolCallItem, ToolResultItem } from '@/types';

interface MessageListProps {
  messages: Message[];
}

function parseUserContent(content: string) {
  const result: Array<{ type: 'command' | 'output' | 'text'; data: Record<string, string> }> = [];

  // command-name 태그 파싱
  const commandMatch = content.match(
    /<command-name>(.+?)<\/command-name>[\s\S]*?<command-message>(.+?)<\/command-message>[\s\S]*?<command-args>(.*?)<\/command-args>/
  );
  if (commandMatch) {
    const [, commandName, commandMessage, commandArgs] = commandMatch;
    result.push({
      type: 'command',
      data: {
        commandName: commandName.trim(),
        commandMessage: commandMessage.trim(),
        commandArgs: commandArgs?.trim() || '',
      },
    });
  }

  // local-command-stdout 태그 파싱
  const stdoutMatch = content.match(/<local-command-stdout>([\s\S]*?)<\/local-command-stdout>/);
  if (stdoutMatch) {
    const [, output] = stdoutMatch;
    result.push({
      type: 'output',
      data: { output },
    });
  }

  // 태그가 없는 일반 텍스트
  if (result.length === 0) {
    // 태그 제거 후 남은 텍스트
    const cleanContent = content
      .replace(/<command-name>.*?<\/command-name>/gs, '')
      .replace(/<command-message>.*?<\/command-message>/gs, '')
      .replace(/<command-args>.*?<\/command-args>/gs, '')
      .replace(/<local-command-stdout>.*?<\/local-command-stdout>/gs, '')
      .trim();

    if (cleanContent) {
      result.push({
        type: 'text',
        data: { content: cleanContent },
      });
    }
  }

  return result;
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-2"
          >
            {msg.type === 'summary' && (
              <div
                className="p-3 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-muted)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <span
                  className="text-xs font-medium mb-1 block"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  이전 대화 요약
                </span>
                <p className="text-sm">{msg.content}</p>
              </div>
            )}

            {msg.type === 'user' && (
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <User className="w-4 h-4" style={{ color: 'var(--color-primary-foreground)' }} />
                </div>
                <div className="flex-1 space-y-2">
                  {/* Content 파싱 (command, output 태그) */}
                  {(() => {
                    const content = msg.content || '';
                    const parsed = parseUserContent(content);

                    if (parsed.length === 0 && content) {
                      return (
                        <div
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: 'var(--color-secondary)' }}
                        >
                          <p className="text-sm whitespace-pre-wrap">{content}</p>
                        </div>
                      );
                    }

                    return parsed.map((item, itemIdx) => {
                      if (item.type === 'command') {
                        return (
                          <CommandWidget
                            key={`content-${itemIdx}`}
                            commandName={item.data.commandName}
                            commandMessage={item.data.commandMessage}
                            commandArgs={item.data.commandArgs}
                          />
                        );
                      }
                      if (item.type === 'output') {
                        return <OutputWidget key={`content-${itemIdx}`} output={item.data.output} />;
                      }
                      return (
                        <div
                          key={`content-${itemIdx}`}
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: 'var(--color-secondary)' }}
                        >
                          <p className="text-sm whitespace-pre-wrap">{item.data.content}</p>
                        </div>
                      );
                    });
                  })()}

                  {/* Items 배열 (tool_result 등) */}
                  {msg.items?.map((item, itemIdx) => {
                    if (item.type === 'tool_result') {
                      const toolResult = item as ToolResultItem;
                      return (
                        <ToolResultWidget
                          key={`item-${itemIdx}`}
                          content={toolResult.content}
                          isError={toolResult.is_error}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}

            {msg.type === 'assistant' && (
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  <Bot className="w-4 h-4" style={{ color: 'var(--color-accent-foreground)' }} />
                </div>
                <div className="flex-1 space-y-2">
                  {msg.items?.map((item, itemIdx) => (
                    <div key={itemIdx}>
                      {item.type === 'text' && (
                        <Markdown content={item.content || ''} className="text-sm" />
                      )}
                      {item.type === 'tool' && <ToolCall tool={item as ToolCallItem} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
