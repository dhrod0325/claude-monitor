import { FolderSearch } from 'lucide-react';
import { WidgetContainer, ResultBox } from './WidgetContainer';
import { extractResultContent, truncateContent, countLines, type WidgetResultContent } from './utils';

interface GlobWidgetProps {
  pattern: string;
  path?: string;
  result?: WidgetResultContent;
}

export function GlobWidget({ pattern, path, result }: GlobWidgetProps) {
  const resultContent = extractResultContent(result);
  const fileCount = result ? countLines(resultContent) : 0;

  return (
    <WidgetContainer
      icon={FolderSearch}
      title="Glob"
      isLoading={!result}
      loadingText="Searching..."
      rightContent={result ? `${fileCount} files` : undefined}
    >
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono" style={{ color: 'oklch(0.80 0.15 80)' }}>
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
