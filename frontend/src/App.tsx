import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from '@/components/Layout/Header';
import { Sidebar } from '@/components/Layout/Sidebar';
import { SessionList } from '@/components/Session/SessionList';
import { SessionView } from '@/components/Session/SessionView';
import { UsageDashboard } from '@/components/Usage/UsageDashboard';
import { AnalysisView, FloatingAnalysisProgress } from '@/components/Analysis';
import { WorkAnalysisView, FloatingWorkAnalysisProgress } from '@/components/WorkAnalysis';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useWorkAnalysisStore } from '@/stores/workAnalysisStore';

type View = 'list' | 'session' | 'usage' | 'analysis' | 'workAnalysis';

function App() {
  const [view, setView] = useState<View>('list');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { stream, currentAnalysis } = useAnalysisStore();
  const { stream: workStream, currentAnalysis: workCurrentAnalysis } = useWorkAnalysisStore();

  // 분석 완료 시 자동으로 analysis 페이지로 이동
  useEffect(() => {
    if (!stream.isStreaming && stream.streamingContent && currentAnalysis && view !== 'analysis') {
      setView('analysis');
    }
  }, [stream.isStreaming, stream.streamingContent, currentAnalysis, view]);

  // 업무분석 완료 시 자동으로 workAnalysis 페이지로 이동
  useEffect(() => {
    if (!workStream.isStreaming && workStream.streamingContent && workCurrentAnalysis && view !== 'workAnalysis') {
      setView('workAnalysis');
    }
  }, [workStream.isStreaming, workStream.streamingContent, workCurrentAnalysis, view]);

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setView('session');
  };

  const handleBack = () => {
    setView('list');
    setSelectedSessionId(null);
  };

  const handleProjectSelect = () => {
    // 프로젝트 선택 시 세션 리스트 화면으로 전환
    setView('list');
    setSelectedSessionId(null);
  };

  const handleUsageClick = () => {
    setView('usage');
    setSelectedSessionId(null);
  };

  const handleAnalysisClick = useCallback(() => {
    setView('analysis');
    setSelectedSessionId(null);
  }, []);

  const handleWorkAnalysisClick = useCallback(() => {
    setView('workAnalysis');
    setSelectedSessionId(null);
  }, []);

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background)' }}>
      <Header
        onUsageClick={handleUsageClick}
        onAnalysisClick={handleAnalysisClick}
        onWorkAnalysisClick={handleWorkAnalysisClick}
      />
      {/* 플로팅 분석 진행 상태 표시 - analysis 페이지 외에서만 표시 */}
      {view !== 'analysis' && (
        <FloatingAnalysisProgress onNavigateToAnalysis={handleAnalysisClick} />
      )}
      {/* 플로팅 업무분석 진행 상태 표시 - workAnalysis 페이지 외에서만 표시 */}
      {view !== 'workAnalysis' && (
        <FloatingWorkAnalysisProgress onClick={handleWorkAnalysisClick} />
      )}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onProjectSelect={handleProjectSelect} />
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {view === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                <SessionList onSelectSession={handleSelectSession} />
              </motion.div>
            )}

            {view === 'session' && selectedSessionId && (
              <motion.div
                key="session"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                <SessionView sessionId={selectedSessionId} onBack={handleBack} />
              </motion.div>
            )}

            {view === 'usage' && (
              <motion.div
                key="usage"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                <UsageDashboard onBack={handleBack} />
              </motion.div>
            )}

            {view === 'analysis' && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                <AnalysisView onBack={handleBack} />
              </motion.div>
            )}

            {view === 'workAnalysis' && (
              <motion.div
                key="workAnalysis"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                <WorkAnalysisView onBack={handleBack} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;
