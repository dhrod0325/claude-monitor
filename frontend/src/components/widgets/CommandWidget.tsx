import { Terminal } from 'lucide-react';

interface CommandWidgetProps {
  commandName: string;
  commandMessage: string;
  commandArgs?: string;
}

export function CommandWidget({ commandName, commandMessage, commandArgs }: CommandWidgetProps) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'color-mix(in oklch, var(--color-background) 50%, transparent)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div
        className="px-4 py-2 border-b flex items-center gap-2"
        style={{
          backgroundColor: 'color-mix(in oklch, var(--color-muted) 50%, transparent)',
          borderColor: 'var(--color-border)',
        }}
      >
        <Terminal className="h-3.5 w-3.5" style={{ color: 'oklch(0.65 0.19 250)' }} />
        <span className="text-xs font-mono" style={{ color: 'oklch(0.70 0.15 250)' }}>
          Command
        </span>
      </div>
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            $
          </span>
          <code className="text-sm font-mono">{commandName}</code>
          {commandArgs && (
            <code className="text-sm font-mono" style={{ color: 'var(--color-muted-foreground)' }}>
              {commandArgs}
            </code>
          )}
        </div>
        {commandMessage && commandMessage !== commandName && (
          <div className="text-xs ml-4" style={{ color: 'var(--color-muted-foreground)' }}>
            {commandMessage}
          </div>
        )}
      </div>
    </div>
  );
}
