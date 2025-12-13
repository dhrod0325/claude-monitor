import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, FileSearch, CheckCircle, AlertCircle } from 'lucide-react';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useTranslation } from 'react-i18next';

interface FloatingAnalysisProgressProps {
  onNavigateToAnalysis: () => void;
}

export function FloatingAnalysisProgress({ onNavigateToAnalysis }: FloatingAnalysisProgressProps) {
  const { t } = useTranslation();
  const { stream, isAnalyzing, currentAnalysis, cancelStreamingAnalysis, resetStreamState } = useAnalysisStore();

  const { isStreaming, promptCount, streamingContent, streamError } = stream;

  // 분석 중이 아니고 스트리밍 컨텐츠도 없으면 표시하지 않음
  const shouldShow = isAnalyzing || isStreaming || streamError || (streamingContent && !currentAnalysis);

  if (!shouldShow) {
    return null;
  }

  // 상태에 따른 아이콘 및 스타일
  const getStatusInfo = () => {
    if (streamError) {
      return {
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        text: t('analysis.float.error', 'Analysis failed'),
        bgColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
      };
    }
    if (!isStreaming && streamingContent && currentAnalysis) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        text: t('analysis.float.complete', 'Analysis complete'),
        bgColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 0.3)',
      };
    }
    return {
      icon: <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-primary)' }} />,
      text: promptCount > 0
        ? t('analysis.float.analyzing', { count: promptCount, defaultValue: `Analyzing ${promptCount} prompts...` })
        : t('analysis.float.preparing', 'Preparing analysis...'),
      bgColor: 'var(--color-card)',
      borderColor: 'var(--color-border)',
    };
  };

  const statusInfo = getStatusInfo();

  // 완료 시 자동 네비게이션 처리
  const handleClick = () => {
    onNavigateToAnalysis();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isStreaming) {
      cancelStreamingAnalysis();
    } else {
      resetStreamState();
    }
  };

  // 스트리밍 컨텐츠 길이로 진행률 추정 (대략적)
  const contentLength = streamingContent.length;
  const progressPercent = Math.min((contentLength / 5000) * 100, 95); // 5000자 기준 최대 95%

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.div
          className="rounded-lg shadow-lg cursor-pointer overflow-hidden"
          style={{
            backgroundColor: statusInfo.bgColor,
            border: `1px solid ${statusInfo.borderColor}`,
            minWidth: '280px',
            maxWidth: '320px',
          }}
          onClick={handleClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Progress bar */}
          {isStreaming && (
            <div
              className="h-1"
              style={{ backgroundColor: 'var(--color-border)' }}
            >
              <motion.div
                className="h-full"
                style={{ backgroundColor: 'var(--color-primary)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          <div className="p-4">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className="flex-shrink-0">
                {statusInfo.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileSearch className="w-4 h-4" style={{ color: 'var(--color-muted-foreground)' }} />
                  <span className="text-sm font-medium truncate">
                    {t('analysis.title', 'Prompt Analysis')}
                  </span>
                </div>
                <p
                  className="text-xs mt-1 truncate"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {statusInfo.text}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={handleCancel}
                className="flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                title={isStreaming ? t('common.cancel', 'Cancel') : t('common.close', 'Close')}
              >
                <X className="w-4 h-4" style={{ color: 'var(--color-muted-foreground)' }} />
              </button>
            </div>

            {/* Preview of streaming content */}
            {isStreaming && streamingContent && (
              <div
                className="mt-3 p-2 rounded text-xs font-mono overflow-hidden"
                style={{
                  backgroundColor: 'var(--color-background)',
                  maxHeight: '60px',
                }}
              >
                <p
                  className="line-clamp-2"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {streamingContent.slice(-200)}
                </p>
              </div>
            )}

            {/* Click hint */}
            <p
              className="text-xs mt-2 text-center"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              {t('analysis.float.clickToView', 'Click to view')}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
