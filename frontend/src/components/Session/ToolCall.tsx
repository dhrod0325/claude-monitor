import { motion } from 'framer-motion';
import {
  BashWidget,
  ReadWidget,
  EditWidget,
  WriteWidget,
  GlobWidget,
  GrepWidget,
  TaskWidget,
  TodoWriteWidget,
} from '@/components/widgets';
import type { ToolCallItem } from '@/types';

interface ToolCallProps {
  tool: ToolCallItem;
  compact?: boolean;
}

export function ToolCall({ tool, compact = false }: ToolCallProps) {
  const renderWidget = () => {
    switch (tool.name) {
      case 'Bash':
        return (
          <BashWidget
            command={String(tool.input.command || '')}
            description={tool.input.description as string | undefined}
          />
        );

      case 'Read':
        return <ReadWidget filePath={String(tool.input.file_path || '')} />;

      case 'Edit':
        return (
          <EditWidget
            filePath={String(tool.input.file_path || '')}
            oldString={tool.input.old_string as string | undefined}
            newString={tool.input.new_string as string | undefined}
          />
        );

      case 'Write':
        return (
          <WriteWidget
            filePath={String(tool.input.file_path || '')}
            content={tool.input.content as string | undefined}
          />
        );

      case 'Glob':
        return (
          <GlobWidget
            pattern={String(tool.input.pattern || '')}
            path={tool.input.path as string | undefined}
          />
        );

      case 'Grep':
        return (
          <GrepWidget
            pattern={String(tool.input.pattern || '')}
            path={tool.input.path as string | undefined}
          />
        );

      case 'Task':
        // Debug: log Task input
        console.log('Task tool input:', tool.input, 'formatted:', tool.formatted);
        return (
          <TaskWidget
            description={tool.input.description as string | undefined}
            subagentType={tool.input.subagent_type as string | undefined}
            prompt={tool.input.prompt as string | undefined}
            formatted={tool.formatted}
            result={tool.result}
          />
        );

      case 'TodoWrite':
        return (
          <TodoWriteWidget
            todos={(tool.input.todos as Array<{ content: string; status: 'pending' | 'in_progress' | 'completed'; priority?: 'high' | 'medium' | 'low' }>) || []}
          />
        );

      default:
        return (
          <div
            className="rounded-lg border p-3"
            style={{
              backgroundColor: 'var(--color-background)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="text-xs font-mono" style={{ color: 'var(--color-muted-foreground)' }}>
              [{tool.name}] {tool.formatted}
            </div>
          </div>
        );
    }
  };

  if (compact) {
    return (
      <div
        className="text-xs font-mono p-1 rounded"
        style={{
          backgroundColor: 'color-mix(in oklch, var(--color-muted) 30%, transparent)',
          color: 'var(--color-muted-foreground)',
        }}
      >
        [{tool.name}] {tool.formatted}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="my-2"
    >
      {renderWidget()}
    </motion.div>
  );
}
