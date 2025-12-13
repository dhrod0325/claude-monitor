import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useAnalysisStore } from '@/stores/analysisStore';
import { AnalysisDetailLayout } from '@/components/common';
import type { Analysis } from '@/types';

interface AnalysisDetailProps {
  analysis: Analysis;
  onBack: () => void;
}

export function AnalysisDetail({ analysis, onBack }: AnalysisDetailProps) {
  const { t, i18n } = useTranslation();
  const { startStreamingReanalyze, deleteAnalysis, isAnalyzing } = useAnalysisStore();

  const formatDate = (dateStr: string) => {
    const localeMap: Record<string, string> = {
      ko: 'ko-KR',
      en: 'en-US',
      ja: 'ja-JP',
      zh: 'zh-CN',
    };
    return new Date(dateStr).toLocaleDateString(localeMap[i18n.language] || 'ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReanalyze = () => {
    startStreamingReanalyze(analysis);
  };

  const handleDelete = async () => {
    if (window.confirm(t('analysis.confirmDelete', 'Are you sure you want to delete this analysis?'))) {
      const success = await deleteAnalysis(analysis.id);
      if (success) {
        onBack();
      }
    }
  };

  return (
    <AnalysisDetailLayout
      title={t('analysis.resultTitle', 'Analysis Result')}
      subtitle={formatDate(analysis.created_at)}
      result={analysis.result}
      isReanalyzing={isAnalyzing}
      onBack={onBack}
      onReanalyze={handleReanalyze}
      onDelete={handleDelete}
      reanalyzeLabel={t('analysis.reanalyze', 'Reanalyze')}
      deleteLabel={t('analysis.delete', 'Delete')}
      metaContent={
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              {t('analysis.project', 'Project')}:
            </span>
            <Badge variant="outline">{analysis.project_name}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              {t('analysis.sessions', 'Sessions')}:
            </span>
            <Badge variant="secondary">{analysis.session_ids.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              {t('analysis.prompts', 'Prompts')}:
            </span>
            <Badge variant="secondary">{analysis.prompt_count}</Badge>
          </div>
          {analysis.updated_at && analysis.updated_at !== analysis.created_at && (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                {t('analysis.updated', 'Updated')}:
              </span>
              <span className="text-xs">{formatDate(analysis.updated_at)}</span>
            </div>
          )}
        </div>
      }
    />
  );
}
