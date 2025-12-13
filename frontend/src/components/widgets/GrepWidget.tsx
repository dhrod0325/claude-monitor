import { Search } from 'lucide-react';
import { WidgetContainer, ResultBox } from './WidgetContainer';
import { extractResultContent, truncateContent, countLines, type WidgetResultContent } from './utils';

interface GrepWidgetProps {
  pattern: string;
  path?: string;
  result?: WidgetResultContent;
}

export function GrepWidget({ pattern, path, result }: GrepWidgetProps) {
  const resultContent = extractResultContent(result);
  const matchCount = result ? countLines(resultContent) : 0;

  return (
    <WidgetContainer
      icon={Search}
      title="Grep"
      isLoading={!result}
      loadingText="Searching..."
      rightContent={result ? `${matchCount} matches` : undefined}
    >
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <code
            className="text-xs font-mono px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: 'color-mix(in oklch, oklch(0.80 0.15 80) 20%, transparent)',
              color: 'oklch(0.80 0.15 80)',
            }}
          >
            {pattern}
          </code>
          {path && (
            <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              in {path}
            </span>
          )}
        </div>
        {result && resultContent && (
          <ResultBox maxHeight="12rem">
            {truncateContent(resultContent)}
          </ResultBox>
        )}
      </div>
    </WidgetContainer>
  );
}
