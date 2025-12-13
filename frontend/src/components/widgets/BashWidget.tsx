import { Terminal, ChevronRight } from 'lucide-react';
import { WidgetContainer } from './WidgetContainer';
import { extractResultContent, type WidgetResultContent } from './utils';

interface BashWidgetProps {
  command: string;
  description?: string;
  result?: WidgetResultContent;
}

export function BashWidget({ command, description, result }: BashWidgetProps) {
  const resultContent = extractResultContent(result);
  const isError = result?.is_error || false;

  return (
    <WidgetContainer
      icon={Terminal}
      title="Terminal"
      isLoading={!result}
      loadingText="Running..."
      headerExtra={
        description && (
          <>
            <ChevronRight className="h-3 w-3" style={{ color: 'var(--color-muted-foreground)' }} />
            <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              {description}
            </span>
          </>
        )
      }
    >
      <div className="p-4 space-y-3">
        <code className="text-xs font-mono block" style={{ color: 'oklch(0.72 0.20 142)' }}>
          $ {command}
        </code>

        {result && (
          <div
            className="mt-3 p-3 rounded-md border text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto"
            style={{
              borderColor: isError
                ? 'color-mix(in oklch, var(--color-destructive) 20%, transparent)'
                : 'color-mix(in oklch, oklch(0.72 0.19 142) 20%, transparent)',
              backgroundColor: isError
                ? 'color-mix(in oklch, var(--color-destructive) 5%, transparent)'
                : 'color-mix(in oklch, oklch(0.72 0.19 142) 5%, transparent)',
              color: isError ? 'var(--color-destructive)' : 'oklch(0.72 0.19 142)',
            }}
          >
            {resultContent || (isError ? 'Command failed' : 'Command completed')}
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
