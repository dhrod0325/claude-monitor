import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWorkAnalysisStore } from '@/stores/workAnalysisStore';

interface FloatingWorkAnalysisProgressProps {
  onClick: () => void;
}

export function FloatingWorkAnalysisProgress({ onClick }: FloatingWorkAnalysisProgressProps) {
  const { t } = useTranslation();
  const { stream, isAnalyzing, currentAnalysis } = useWorkAnalysisStore();
  const { isStreaming, sessionCount, streamError, currentChunk, totalChunks, phase } = stream;

  // 분석 중이거나 에러가 있거나 완료되었을 때만 표시
  const shouldShow = isAnalyzing || isStreaming || streamError || (currentAnalysis && !isStreaming);

  if (!shouldShow) return null;

  const getChunkText = () => {
    if (totalChunks <= 1) return '';
    if (phase === 'chunk_analysis') {
      return t('workAnalysis.float.chunkProgress', {
        current: currentChunk,
        total: totalChunks,
        defaultValue: `(${currentChunk}/${totalChunks} 청크)`,
      });
    }
    if (phase === 'final_analysis') {
      return t('workAnalysis.float.finalAnalysis', '(종합 분석)');
    }
    return '';
  };

  const getStatus = () => {
    if (streamError) {
      return {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        text: t('workAnalysis.float.error', '분석 실패'),
        color: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.5)',
      };
    }
    if (currentAnalysis && !isStreaming && !isAnalyzing) {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        text: t('workAnalysis.float.complete', '분석 완료'),
        color: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 0.5)',
      };
    }
    if (phase === 'chunk_analysis' || phase === 'final_analysis') {
      const chunkText = getChunkText();
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--color-primary)' }} />,
        text: t('workAnalysis.float.analyzing', { count: sessionCount, defaultValue: `${sessionCount}개 세션 분석 중...` }) + ' ' + chunkText,
        color: 'var(--color-muted)',
        borderColor: 'var(--color-border)',
      };
    }
    if (sessionCount > 0 || phase === 'single') {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--color-primary)' }} />,
        text: t('workAnalysis.float.analyzing', { count: sessionCount, defaultValue: `${sessionCount}개 세션 분석 중...` }),
        color: 'var(--color-muted)',
        borderColor: 'var(--color-border)',
      };
    }
    return {
      icon: <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--color-primary)' }} />,
      text: t('workAnalysis.float.preparing', '분석 준비 중...'),
      color: 'var(--color-muted)',
      borderColor: 'var(--color-border)',
    };
  };

  const status = getStatus();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <button
          onClick={onClick}
          className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg cursor-pointer transition-transform hover:scale-105"
          style={{
            backgroundColor: status.color,
            border: `1px solid ${status.borderColor}`,
          }}
        >
          <Briefcase className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
          {status.icon}
          <div className="text-left">
            <p className="text-sm font-medium">{status.text}</p>
            <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              {t('workAnalysis.float.clickToView', '클릭하여 보기')}
            </p>
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
