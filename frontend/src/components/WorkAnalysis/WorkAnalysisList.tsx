import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';
import { useWorkAnalysisStore } from '@/stores/workAnalysisStore';
import { Loader2, Trash2, Calendar, FolderOpen } from 'lucide-react';

export function WorkAnalysisList() {
  const { t, i18n } = useTranslation();
  const {
    analyses,
    isLoading,
    fetchWorkAnalyses,
    fetchWorkAnalysis,
    deleteWorkAnalysis,
  } = useWorkAnalysisStore();

  useEffect(() => {
    fetchWorkAnalyses();
  }, [fetchWorkAnalyses]);

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

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm(t('workAnalysis.confirmDelete', '이 분석을 삭제하시겠습니까?'))) {
      await deleteWorkAnalysis(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-muted-foreground)' }} />
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          {t('workAnalysis.noHistory', '분석 히스토리가 없습니다')}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-3">
        {analyses.map((analysis) => (
          <Card
            key={analysis.id}
            className="p-4 cursor-pointer transition-colors hover:bg-accent"
            onClick={() => fetchWorkAnalysis(analysis.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* 날짜 범위 */}
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                  <span className="font-semibold text-sm">
                    {formatDateRange(analysis.date_from, analysis.date_to)}
                  </span>
                </div>

                {/* 프로젝트 목록 */}
                <div className="flex items-center gap-2 mb-2">
                  <FolderOpen className="h-4 w-4" style={{ color: 'var(--color-muted-foreground)' }} />
                  <span className="text-sm truncate" style={{ color: 'var(--color-muted-foreground)' }}>
                    {analysis.project_names.join(', ')}
                  </span>
                </div>

                {/* 메타 정보 */}
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {analysis.session_count} {t('workAnalysis.sessions', '세션')}
                  </Badge>
                  <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {formatDate(analysis.created_at)}
                  </span>
                </div>

                {/* 요약 */}
                <p
                  className="text-xs line-clamp-2"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {analysis.summary}
                </p>
              </div>

              {/* 삭제 버튼 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDelete(e, analysis.id)}
                className="ml-2 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" style={{ color: 'var(--color-destructive)' }} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
