import { CheckCircle2, XCircle } from 'lucide-react';

interface ToolResultWidgetProps {
  content: string;
  isError?: boolean;
}

export function ToolResultWidget({ content, isError = false }: ToolResultWidgetProps) {
  const lines = content.split('\n').filter((line) => line.trim());
  const hasMultipleLines = lines.length > 1;

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'var(--color-background)',
        borderColor: isError
          ? 'color-mix(in oklch, var(--color-destructive) 30%, var(--color-border))'
          : 'var(--color-border)',
      }}
    >
      <div
        className="px-4 py-2 flex items-center gap-2 border-b"
        style={{
          backgroundColor: isError
            ? 'color-mix(in oklch, var(--color-destructive) 10%, var(--color-muted))'
            : 'color-mix(in oklch, var(--color-muted) 50%, transparent)',
          borderColor: 'var(--color-border)',
        }}
      >
        {isError ? (
          <XCircle className="h-3.5 w-3.5" style={{ color: 'var(--color-destructive)' }} />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'oklch(0.72 0.19 142)' }} />
        )}
        <span
          className="text-xs font-mono"
          style={{ color: isError ? 'var(--color-destructive)' : 'oklch(0.72 0.19 142)' }}
        >
          {isError ? 'Error' : 'Result'}
        </span>
        {hasMultipleLines && (
          <span className="ml-auto text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            {lines.length} lines
          </span>
        )}
      </div>
      <div className="p-3">
        <pre
          className="text-xs font-mono whitespace-pre-wrap max-h-64 overflow-y-auto"
          style={{
            color: isError ? 'var(--color-destructive)' : 'oklch(0.72 0.19 142)',
          }}
        >
          {content || (isError ? 'Error occurred' : 'No output')}
        </pre>
      </div>
    </div>
  );
}
