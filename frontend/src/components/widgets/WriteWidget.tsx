import { FilePlus } from 'lucide-react';
import { WidgetContainer, ResultBox } from './WidgetContainer';
import { truncateContent, type WidgetResultContent } from './utils';

interface WriteWidgetProps {
  filePath: string;
  content?: string;
  result?: WidgetResultContent;
}

export function WriteWidget({ filePath, content, result }: WriteWidgetProps) {
  const isError = result?.is_error || false;

  return (
    <WidgetContainer
      icon={FilePlus}
      iconColor="oklch(0.70 0.15 300)"
      title="Write"
      isLoading={!result}
      loadingText="Writing..."
      rightContent={result && !isError ? 'Done' : undefined}
    >
      <div className="p-3 space-y-2">
        <code
          className="text-xs font-mono block truncate"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          {filePath}
        </code>
        {content && (
          <ResultBox maxHeight="12rem" style={{ marginTop: '0.5rem' }}>
            {truncateContent(content, 1000)}
          </ResultBox>
        )}
        {result?.is_error && typeof result.content === 'string' && result.content && (
          <div
            className="p-2 rounded-md border text-xs font-mono"
            style={{
              backgroundColor: 'color-mix(in oklch, var(--color-destructive) 10%, transparent)',
              borderColor: 'color-mix(in oklch, var(--color-destructive) 30%, transparent)',
              color: 'var(--color-destructive)',
            }}
          >
            {result.content}
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
