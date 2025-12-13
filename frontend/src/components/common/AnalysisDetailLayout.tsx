import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Markdown } from '@/components/ui/markdown';
import { ArrowLeft, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AnalysisDetailLayoutProps {
  title: string;
  subtitle: string;
  result: string;
  metaContent: ReactNode;
  isReanalyzing?: boolean;
  onBack: () => void;
  onReanalyze: () => void;
  onDelete: () => void;
  reanalyzeLabel?: string;
  deleteLabel?: string;
}

export function AnalysisDetailLayout({
  title,
  subtitle,
  result,
  metaContent,
  isReanalyzing = false,
  onBack,
  onReanalyze,
  onDelete,
  reanalyzeLabel,
  deleteLabel,
}: AnalysisDetailLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full flex flex-col h-full">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.back', 'Back')}
              </Button>
              <div>
                <h1 className="text-xl font-bold">{title}</h1>
                <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  {subtitle}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onReanalyze}
                disabled={isReanalyzing}
              >
                {isReanalyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {reanalyzeLabel || t('common.reanalyze', 'Reanalyze')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" style={{ color: 'var(--color-destructive)' }} />
                {deleteLabel || t('common.delete', 'Delete')}
              </Button>
            </div>
          </div>
        </div>

        {/* Meta Info */}
        <div className="px-6">
          <Card className="p-4">
            {metaContent}
          </Card>
        </div>

        {/* Result Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Card className="p-6">
            <Markdown content={result} />
          </Card>
        </div>
      </div>
    </div>
  );
}
