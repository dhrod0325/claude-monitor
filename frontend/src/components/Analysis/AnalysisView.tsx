import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useSessionStore } from '@/stores/sessionStore';
import { StreamingAnalysisView, AnalysisPageLayout } from '@/components/common';
import { AnalysisForm } from './AnalysisForm';
import { AnalysisList } from './AnalysisList';
import { AnalysisDetail } from './AnalysisDetail';

interface AnalysisViewProps {
  onBack: () => void;
}

export function AnalysisView({ onBack }: AnalysisViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const {
    currentAnalysis,
    fetchAnalyses,
    clearCurrentAnalysis,
    stream,
    isAnalyzing,
    startStreamingAnalysis,
    cancelStreamingAnalysis,
    resetStreamState,
  } = useAnalysisStore();
  const { selectedProject } = useSessionStore();

  const { isStreaming, streamingContent, promptCount, streamError } = stream;

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  // 분석 결과가 있으면 상세 화면 표시
  if (currentAnalysis && !isAnalyzing && !isStreaming) {
    return (
      <AnalysisDetail
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
        statusText={promptCount > 0 ? t('analysis.analyzingPrompts', { count: promptCount, defaultValue: `Analyzing ${promptCount} prompts` }) : ''}
        backgroundNotice={t('analysis.backgroundNotice', 'You can navigate to other pages while analysis is running. Progress will be shown in the floating indicator.')}
        waitingText={t('analysis.waiting', 'Waiting for response...')}
        onCancel={cancelStreamingAnalysis}
      />
    );
  }

  return (
    <AnalysisPageLayout
      title={t('analysis.title')}
      description={t('analysis.description')}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onBack={onBack}
      newTabLabel={t('analysis.newAnalysis')}
      historyTabLabel={t('analysis.history')}
      formContent={
        <AnalysisForm
          projectId={selectedProject?.id}
          onAnalyze={startStreamingAnalysis}
        />
      }
      listContent={<AnalysisList />}
    />
  );
}
