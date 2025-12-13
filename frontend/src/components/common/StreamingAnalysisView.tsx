import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Markdown } from '@/components/ui/markdown';
import { X, Loader2, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StreamingAnalysisViewProps {
  isStreaming: boolean;
  streamingContent: string;
  streamError: string | null;
  statusText: string;
  backgroundNotice: string;
  waitingText: string;
  onCancel: () => void;
}

export function StreamingAnalysisView({
  isStreaming,
  streamingContent,
  streamError,
  statusText,
  backgroundNotice,
  waitingText,
  onCancel,
}: StreamingAnalysisViewProps) {
  const { t } = useTranslation();

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full flex flex-col h-full">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
              >
                <X className="h-4 w-4 mr-2" />
                {t('common.cancel', 'Cancel')}
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  {isStreaming && <Loader2 className="h-5 w-5 animate-spin" />}
                  {t('analysis.analyzing', 'Analyzing...')}
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  {statusText}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Background Notice */}
        <div className="px-6">
          <div
            className="p-3 rounded-lg text-sm flex items-center gap-2"
            style={{ backgroundColor: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
          >
            <Info className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
            <span style={{ color: 'var(--color-muted-foreground)' }}>
              {backgroundNotice}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {streamError && (
          <div className="px-6 mt-3">
            <div
              className="p-3 rounded-lg text-sm"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.5)' }}
            >
              {streamError}
            </div>
          </div>
        )}

        {/* Streaming Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Card className="p-6">
            <Markdown content={streamingContent || waitingText} />
            {isStreaming && (
              <span
                className="inline-block w-2 h-4 ml-1 animate-pulse"
                style={{ backgroundColor: 'var(--color-primary)' }}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
