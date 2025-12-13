import { FileEdit } from 'lucide-react';
import { WidgetContainer } from './WidgetContainer';
import { truncateContent, type WidgetResultContent } from './utils';

interface EditWidgetProps {
  filePath: string;
  oldString?: string;
  newString?: string;
  result?: WidgetResultContent;
}

export function EditWidget({ filePath, oldString, newString, result }: EditWidgetProps) {
  const isError = result?.is_error || false;

  return (
    <WidgetContainer
      icon={FileEdit}
      iconColor="oklch(0.70 0.15 300)"
      title="Edit"
      isLoading={!result}
      loadingText="Editing..."
      rightContent={result && !isError ? 'Done' : undefined}
    >
      <div className="p-3 space-y-2">
        <code
          className="text-xs font-mono block truncate"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          {filePath}
        </code>
        {(oldString || newString) && (
          <div className="space-y-2 mt-2">
            {oldString && (
              <DiffBlock type="removed" content={oldString} />
            )}
            {newString && (
              <DiffBlock type="added" content={newString} />
            )}
          </div>
        )}
        {result?.is_error && (
          <ErrorBlock content={typeof result.content === 'string' ? result.content : ''} />
        )}
      </div>
    </WidgetContainer>
  );
}

interface DiffBlockProps {
  type: 'removed' | 'added';
  content: string;
}

function DiffBlock({ type, content }: DiffBlockProps) {
  const isRemoved = type === 'removed';
  const color = isRemoved ? 'oklch(0.65 0.20 25)' : 'oklch(0.72 0.19 142)';
  const label = isRemoved ? '- removed:' : '+ added:';

  return (
    <div
      className="p-2 rounded-md border text-xs font-mono max-h-32 overflow-y-auto"
      style={{
        backgroundColor: `color-mix(in oklch, ${color} 10%, transparent)`,
        borderColor: `color-mix(in oklch, ${color} 30%, transparent)`,
        color,
      }}
    >
      <div className="text-xs mb-1" style={{ color: 'var(--color-muted-foreground)' }}>{label}</div>
      <pre className="whitespace-pre-wrap">{truncateContent(content, 500)}</pre>
    </div>
  );
}

interface ErrorBlockProps {
  content: string;
}

function ErrorBlock({ content }: ErrorBlockProps) {
  if (!content) return null;
  return (
    <div
      className="p-2 rounded-md border text-xs font-mono"
      style={{
        backgroundColor: 'color-mix(in oklch, var(--color-destructive) 10%, transparent)',
        borderColor: 'color-mix(in oklch, var(--color-destructive) 30%, transparent)',
        color: 'var(--color-destructive)',
      }}
    >
      {content}
    </div>
  );
}
