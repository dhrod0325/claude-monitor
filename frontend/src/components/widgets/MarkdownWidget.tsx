import { FileText } from 'lucide-react';
import { Markdown } from '@/components/ui/markdown';

interface MarkdownWidgetProps {
  content: string;
  title?: string;
}

export function MarkdownWidget({ content, title }: MarkdownWidgetProps) {
  const hasContent = content && content.trim().length > 0;

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
        <FileText className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
        <span className="text-xs font-mono" style={{ color: 'var(--color-muted-foreground)' }}>
          {title || 'Markdown'}
        </span>
      </div>
      <div className="p-4">
        {hasContent ? (
          <Markdown content={content} className="text-sm" />
        ) : (
          <span className="text-sm italic" style={{ color: 'var(--color-muted-foreground)' }}>
            No content
          </span>
        )}
      </div>
    </div>
  );
}
