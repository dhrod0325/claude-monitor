import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useWorkAnalysisStore } from '@/stores/workAnalysisStore';
import { AnalysisDetailLayout } from '@/components/common';
import type { WorkAnalysis } from '@/types';
import { Calendar, FolderOpen } from 'lucide-react';

interface WorkAnalysisDetailProps {
  analysis: WorkAnalysis;
  onBack: () => void;
}

export function WorkAnalysisDetail({ analysis, onBack }: WorkAnalysisDetailProps) {
  const { t, i18n } = useTranslation();
  const { startStreamingReanalyze, deleteWorkAnalysis } = useWorkAnalysisStore();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const localeMap: Record<string, string> = {
      ko: 'ko-KR',
      en: 'en-US',
      ja: 'ja-JP',
      zh: 'zh-CN',
    };
    return date.toLocaleDateString(localeMap[i18n.language] || 'ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateRange = (from: string, to: string) => {
    if (from === to) {
      return from;
    }
    return `${from} ~ ${to}`;
  };

  const handleReanalyze = () => {
    startStreamingReanalyze(analysis);
  };

  const handleDelete = async () => {
    if (window.confirm(t('workAnalysis.confirmDelete', '이 분석을 삭제하시겠습니까?'))) {
      const success = await deleteWorkAnalysis(analysis.id);
      if (success) {
        onBack();
      }
    }
  };

  return (
    <AnalysisDetailLayout
      title={t('workAnalysis.resultTitle', '업무분석 결과')}
      subtitle={formatDate(analysis.created_at)}
      result={analysis.result}
      onBack={onBack}
      onReanalyze={handleReanalyze}
      onDelete={handleDelete}
      reanalyzeLabel={t('workAnalysis.reanalyze', '재분석')}
      deleteLabel={t('workAnalysis.delete', '삭제')}
      metaContent={
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
            <span className="text-sm font-medium">
              {t('workAnalysis.period', '기간')}: {formatDateRange(analysis.date_from, analysis.date_to)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
            <span className="text-sm font-medium">
              {t('workAnalysis.projectLabel', '프로젝트')}: {analysis.project_names.join(', ')}
            </span>
          </div>
          <Badge variant="secondary">
            {analysis.session_count} {t('workAnalysis.sessions', '세션')}
          </Badge>
        </div>
      }
    />
  );
}
