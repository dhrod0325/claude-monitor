import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className = '' }: MarkdownProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table
                className="min-w-full border-collapse text-sm"
                style={{
                  borderColor: 'var(--color-border)',
                }}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead
              style={{
                backgroundColor: 'var(--color-muted)',
              }}
            >
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th
              className="px-3 py-2 text-left font-semibold border"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)',
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className="px-3 py-2 border"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)',
              }}
            >
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr
              className="hover:bg-opacity-50"
              style={{
                backgroundColor: 'transparent',
              }}
            >
              {children}
            </tr>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded text-sm font-mono"
                  style={{
                    backgroundColor: 'var(--color-muted)',
                    color: 'var(--color-foreground)',
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={`block p-3 rounded-lg overflow-x-auto text-sm font-mono ${className || ''}`}
                style={{
                  backgroundColor: 'var(--color-muted)',
                  color: 'var(--color-foreground)',
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre
              className="my-3 rounded-lg overflow-hidden"
              style={{
                backgroundColor: 'var(--color-muted)',
              }}
            >
              {children}
            </pre>
          ),
          h1: ({ children }) => (
            <h1
              className="text-xl font-bold mt-4 mb-2"
              style={{ color: 'var(--color-foreground)' }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className="text-lg font-bold mt-4 mb-2"
              style={{ color: 'var(--color-foreground)' }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className="text-base font-bold mt-3 mb-1"
              style={{ color: 'var(--color-foreground)' }}
            >
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="ml-2">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
              style={{ color: 'var(--color-primary)' }}
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className="border-l-4 pl-4 my-3 italic"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-muted-foreground)',
              }}
            >
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr
              className="my-4"
              style={{
                borderColor: 'var(--color-border)',
              }}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
