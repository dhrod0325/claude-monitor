import { ChevronRight } from 'lucide-react';

interface OutputWidgetProps {
  output: string;
}

export function OutputWidget({ output }: OutputWidgetProps) {
  const hasOutput = output && output.trim().length > 0;

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
        <ChevronRight className="h-3.5 w-3.5" style={{ color: 'oklch(0.72 0.19 142)' }} />
        <span className="text-xs font-mono" style={{ color: 'oklch(0.72 0.19 142)' }}>
          Output
        </span>
      </div>
      <div className="p-3">
        {hasOutput ? (
          <pre
            className="text-sm font-mono whitespace-pre-wrap max-h-64 overflow-y-auto"
            style={{ color: 'var(--color-foreground)' }}
          >
            {output}
          </pre>
        ) : (
          <span className="text-sm italic" style={{ color: 'var(--color-muted-foreground)' }}>
            No output
          </span>
        )}
      </div>
    </div>
  );
}
