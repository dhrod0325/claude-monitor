import { FileText } from 'lucide-react';
import { WidgetContainer, ResultBox } from './WidgetContainer';
import { extractResultContent, truncateContent, type WidgetResultContent } from './utils';

interface ReadWidgetProps {
  filePath: string;
  result?: WidgetResultContent;
}

export function ReadWidget({ filePath, result }: ReadWidgetProps) {
  const resultContent = extractResultContent(result);

  return (
    <WidgetContainer
      icon={FileText}
      iconColor="oklch(0.65 0.19 250)"
      title="Read"
      isLoading={!result}
      loadingText="Loading..."
    >
      <div className="p-3">
        <code
          className="text-xs font-mono block truncate"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          {filePath}
        </code>
        {result && resultContent && (
          <ResultBox maxHeight="16rem" style={{ marginTop: '0.75rem' }}>
            {truncateContent(resultContent)}
          </ResultBox>
        )}
      </div>
    </WidgetContainer>
  );
}
