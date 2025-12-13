import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkAnalysisStore } from '@/stores/workAnalysisStore';
import { StreamingAnalysisView, AnalysisPageLayout } from '@/components/common';
import { WorkAnalysisForm } from './WorkAnalysisForm';
import { WorkAnalysisList } from './WorkAnalysisList';
import { WorkAnalysisDetail } from './WorkAnalysisDetail';

interface WorkAnalysisViewProps {
  onBack: () => void;
}

export function WorkAnalysisView({ onBack }: WorkAnalysisViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const {
    currentAnalysis,
    fetchWorkAnalyses,
    clearCurrentAnalysis,
    stream,
    isAnalyzing,
    startStreamingWorkAnalysis,
    cancelStreamingAnalysis,
    resetStreamState,
  } = useWorkAnalysisStore();

  const { isStreaming, streamingContent, sessionCount, streamError } = stream;

  useEffect(() => {
    fetchWorkAnalyses();
  }, [fetchWorkAnalyses]);

  // 분석 결과가 있으면 상세 화면 표시
  if (currentAnalysis && !isAnalyzing && !isStreaming) {
    return (
      <WorkAnalysisDetail
        analysis={currentAnalysis}
        onBack={() => {
          clearCurrentAnalysis();
          resetStreamState();
        }}
      />
    );
  }

  // 스트리밍 분석 중일 때 화면
  if (isAnalyzing || isStreaming || streamingContent) {
    return (
      <StreamingAnalysisView
        isStreaming={isStreaming}
        streamingContent={streamingContent}
        streamError={streamError}
        statusText={sessionCount > 0 ? t('workAnalysis.analyzingSessions', { count: sessionCount, defaultValue: `${sessionCount}개 세션 분석 중` }) : ''}
        backgroundNotice={t('workAnalysis.backgroundNotice', '분석 중에도 다른 페이지를 이용할 수 있습니다.')}
        waitingText={t('workAnalysis.waiting', '응답 대기 중...')}
        onCancel={cancelStreamingAnalysis}
      />
    );
  }

  return (
    <AnalysisPageLayout
      title={t('workAnalysis.title', '업무분석')}
      description={t('workAnalysis.description', '일자별 업무 진행 상황을 분석합니다')}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onBack={onBack}
      newTabLabel={t('workAnalysis.newAnalysis', '새 분석')}
      historyTabLabel={t('workAnalysis.history', '히스토리')}
      formContent={<WorkAnalysisForm onAnalyze={startStreamingWorkAnalysis} />}
      listContent={<WorkAnalysisList />}
    />
  );
}
