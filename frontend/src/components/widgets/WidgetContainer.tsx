import type { ReactNode, CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';

interface WidgetContainerProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  isLoading?: boolean;
  loadingText?: string;
  rightContent?: ReactNode;
  children: ReactNode;
  headerExtra?: ReactNode;
}

export function WidgetContainer({
  icon: Icon,
  iconColor = 'oklch(0.72 0.19 142)',
  title,
  isLoading = false,
  loadingText = 'Loading...',
  rightContent,
  children,
  headerExtra,
}: WidgetContainerProps) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'var(--color-background)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div
        className="px-4 py-2 flex items-center gap-2 border-b"
        style={{
          backgroundColor: 'color-mix(in oklch, var(--color-muted) 50%, transparent)',
          borderColor: 'var(--color-border)',
        }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />
        <span className="text-xs font-mono" style={{ color: 'var(--color-muted-foreground)' }}>
          {title}
        </span>
        {headerExtra}
        {isLoading && (
          <div className="ml-auto flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            <div
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: iconColor }}
            />
            <span>{loadingText}</span>
          </div>
        )}
        {!isLoading && rightContent && (
          <span className="ml-auto text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            {rightContent}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

interface ResultBoxProps {
  children: ReactNode;
  isError?: boolean;
  maxHeight?: string;
  style?: CSSProperties;
}

export function ResultBox({ children, isError = false, maxHeight = '12rem', style }: ResultBoxProps) {
  return (
    <pre
      className="mt-2 p-2 rounded-md border text-xs font-mono whitespace-pre-wrap overflow-y-auto"
      style={{
        backgroundColor: isError
          ? 'color-mix(in oklch, var(--color-destructive) 5%, transparent)'
          : 'color-mix(in oklch, var(--color-muted) 30%, transparent)',
        borderColor: isError
          ? 'color-mix(in oklch, var(--color-destructive) 20%, transparent)'
          : 'var(--color-border)',
        color: isError ? 'var(--color-destructive)' : 'var(--color-muted-foreground)',
        maxHeight,
        ...style,
      }}
    >
      {children}
    </pre>
  );
}
