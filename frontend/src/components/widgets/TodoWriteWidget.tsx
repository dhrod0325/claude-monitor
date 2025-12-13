import { CheckSquare, Circle, Clock, CheckCircle2 } from 'lucide-react';

interface Todo {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'high' | 'medium' | 'low';
}

interface TodoWriteWidgetProps {
  todos: Todo[];
  result?: {
    content?: string;
    is_error?: boolean;
  };
}

const statusIcons = {
  completed: <CheckCircle2 className="h-4 w-4" style={{ color: 'oklch(0.72 0.19 142)' }} />,
  in_progress: <Clock className="h-4 w-4 animate-pulse" style={{ color: 'oklch(0.65 0.19 250)' }} />,
  pending: <Circle className="h-4 w-4" style={{ color: 'var(--color-muted-foreground)' }} />,
};

const priorityStyles: Record<string, { bg: string; text: string; border: string }> = {
  high: {
    bg: 'color-mix(in oklch, oklch(0.65 0.20 25) 10%, transparent)',
    text: 'oklch(0.65 0.20 25)',
    border: 'color-mix(in oklch, oklch(0.65 0.20 25) 20%, transparent)',
  },
  medium: {
    bg: 'color-mix(in oklch, oklch(0.80 0.15 80) 10%, transparent)',
    text: 'oklch(0.80 0.15 80)',
    border: 'color-mix(in oklch, oklch(0.80 0.15 80) 20%, transparent)',
  },
  low: {
    bg: 'color-mix(in oklch, oklch(0.72 0.19 142) 10%, transparent)',
    text: 'oklch(0.72 0.19 142)',
    border: 'color-mix(in oklch, oklch(0.72 0.19 142) 20%, transparent)',
  },
};

export function TodoWriteWidget({ todos, result }: TodoWriteWidgetProps) {
  const isError = result?.is_error || false;

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
        <CheckSquare className="h-3.5 w-3.5" style={{ color: 'oklch(0.65 0.19 200)' }} />
        <span className="text-xs font-mono" style={{ color: 'var(--color-muted-foreground)' }}>
          Todo List
        </span>
        <span className="ml-auto text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          {todos.filter((t) => t.status === 'completed').length}/{todos.length}
        </span>
      </div>
      <div className="p-3 space-y-2">
        {todos.map((todo, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-2 rounded-md border"
            style={{
              backgroundColor:
                todo.status === 'completed'
                  ? 'color-mix(in oklch, var(--color-muted) 30%, transparent)'
                  : 'transparent',
              borderColor: 'var(--color-border)',
              opacity: todo.status === 'completed' ? 0.6 : 1,
            }}
          >
            <div className="mt-0.5">{statusIcons[todo.status] || statusIcons.pending}</div>
            <div className="flex-1 space-y-1">
              <p
                className="text-sm"
                style={{
                  textDecoration: todo.status === 'completed' ? 'line-through' : 'none',
                }}
              >
                {todo.content}
              </p>
              {todo.priority && (
                <span
                  className="inline-block text-xs px-1.5 py-0.5 rounded border"
                  style={{
                    backgroundColor: priorityStyles[todo.priority]?.bg,
                    color: priorityStyles[todo.priority]?.text,
                    borderColor: priorityStyles[todo.priority]?.border,
                  }}
                >
                  {todo.priority}
                </span>
              )}
            </div>
          </div>
        ))}
        {isError && result?.content && (
          <div
            className="p-2 rounded-md border text-xs"
            style={{
              backgroundColor: 'color-mix(in oklch, var(--color-destructive) 10%, transparent)',
              borderColor: 'color-mix(in oklch, var(--color-destructive) 30%, transparent)',
              color: 'var(--color-destructive)',
            }}
          >
            {result.content}
          </div>
        )}
      </div>
    </div>
  );
}
