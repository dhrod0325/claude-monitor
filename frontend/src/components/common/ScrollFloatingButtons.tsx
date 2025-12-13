import { useState, useEffect, useCallback, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ScrollFloatingButtonsProps {
  scrollContainerRef: RefObject<HTMLElement | null>;
  showUpThreshold?: number;
  showDownThreshold?: number;
}

export function ScrollFloatingButtons({
  scrollContainerRef,
  showUpThreshold = 200,
  showDownThreshold = 100,
}: ScrollFloatingButtonsProps) {
  const [showUpButton, setShowUpButton] = useState(false);
  const [showDownButton, setShowDownButton] = useState(false);

  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    setShowUpButton(scrollTop > showUpThreshold);
    setShowDownButton(distanceFromBottom > showDownThreshold);
  }, [scrollContainerRef, showUpThreshold, showDownThreshold]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScroll();
    container.addEventListener('scroll', checkScroll);

    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', checkScroll);
      resizeObserver.disconnect();
    };
  }, [scrollContainerRef, checkScroll]);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const scrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  };

  const buttonVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  };

  return (
    <div className="absolute right-6 bottom-6 flex flex-col gap-2 z-10">
      <AnimatePresence>
        {showUpButton && (
          <motion.button
            key="scroll-up"
            variants={buttonVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15 }}
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
            title="맨 위로"
          >
            <ChevronUp className="w-5 h-5" style={{ color: 'var(--color-foreground)' }} />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDownButton && (
          <motion.button
            key="scroll-down"
            variants={buttonVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15 }}
            onClick={scrollToBottom}
            className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
            title="맨 아래로"
          >
            <ChevronDown className="w-5 h-5" style={{ color: 'var(--color-foreground)' }} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
