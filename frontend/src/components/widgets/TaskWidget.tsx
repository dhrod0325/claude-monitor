import { Bot } from 'lucide-react';
import { Markdown } from '@/components/ui/markdown';

interface TaskWidgetProps {
  description?: string;
  subagentType?: string;
  prompt?: string;
  formatted?: string;
  result?: {
    content?: string;
    is_error?: boolean;
  };
}

export function TaskWidget({ description, subagentType, prompt, formatted, result }: TaskWidgetProps) {
  const isError = result?.is_error || false;
  const displayText = description || (formatted && formatted.trim()) || null;
  const hasContent = displayText || prompt || result;

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'var(--color-background)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div
        className="px-4 py-2 flex items-center gap-2 border-b"
        style={{
          backgroundColor: 'color-mix(in oklch, var(--color-muted) 50%, transparent)',
          borderColor: 'var(--color-border)',
        }}
      >
        <Bot className="h-3.5 w-3.5" style={{ color: 'oklch(0.65 0.20 25)' }} />
        <span className="text-xs font-mono" style={{ color: 'var(--color-muted-foreground)' }}>
          Task
        </span>
        {subagentType && (
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: 'color-mix(in oklch, oklch(0.65 0.20 25) 20%, transparent)',
              color: 'oklch(0.65 0.20 25)',
            }}
          >
            {subagentType}
          </span>
        )}
        {!result && (
          <div className="ml-auto flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            <div
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: 'oklch(0.65 0.20 25)' }}
            />
            <span>Running...</span>
          </div>
        )}
      </div>
      <div className="p-3 space-y-2">
        {displayText && (
          <div className="text-sm" style={{ color: 'var(--color-foreground)' }}>
            {displayText}
          </div>
        )}
        {prompt && (
          <pre
            className="p-2 rounded-md border text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto"
            style={{
              backgroundColor: 'color-mix(in oklch, var(--color-muted) 30%, transparent)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-muted-foreground)',
            }}
          >
            {prompt.length > 500 ? prompt.slice(0, 500) + '...' : prompt}
          </pre>
        )}
        {result && (
          <div
            className="p-2 rounded-md border text-xs whitespace-pre-wrap max-h-64 overflow-y-auto"
            style={{
              backgroundColor: isError
                ? 'color-mix(in oklch, var(--color-destructive) 10%, transparent)'
                : 'color-mix(in oklch, oklch(0.72 0.19 142) 10%, transparent)',
              borderColor: isError
                ? 'color-mix(in oklch, var(--color-destructive) 30%, transparent)'
                : 'color-mix(in oklch, oklch(0.72 0.19 142) 30%, transparent)',
            }}
          >
            <Markdown content={result.content || (isError ? 'Task failed' : 'Task completed')} className="text-xs" />
          </div>
        )}
        {!hasContent && (
          <div className="text-xs italic" style={{ color: 'var(--color-muted-foreground)' }}>
            Background agent running...
          </div>
        )}
      </div>
    </div>
  );
}
