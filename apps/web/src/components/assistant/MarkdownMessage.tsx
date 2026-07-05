'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownMessageProps {
  content: string;
  variant: 'user' | 'assistant';
}

export function MarkdownMessage({ content, variant }: MarkdownMessageProps) {
  const isUser = variant === 'user';

  const components: Components = {
    p: ({ children }) => (
      <p className="mb-2 last:mb-0 [&:not(:first-child)]:mt-2">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    h1: ({ children }) => (
      <h3 className="mb-2 mt-3 text-base font-bold first:mt-0">{children}</h3>
    ),
    h2: ({ children }) => (
      <h3 className="mb-2 mt-3 text-base font-bold first:mt-0">{children}</h3>
    ),
    h3: ({ children }) => (
      <h4 className="mb-2 mt-2 text-sm font-bold first:mt-0">{children}</h4>
    ),
    h4: ({ children }) => (
      <h5 className="mb-1 mt-2 text-sm font-semibold first:mt-0">{children}</h5>
    ),
    pre: ({ children }) => (
      <pre
        className={`mb-2 overflow-x-auto rounded-lg p-3 text-xs last:mb-0 ${
          isUser ? 'bg-white/15 text-white' : 'bg-slate-900 text-slate-100'
        }`}
      >
        {children}
      </pre>
    ),
    code: ({ className, children, ...props }) => {
      const isBlock = Boolean(className?.includes('language-'));
      if (isBlock) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }
      return (
        <code
          className={`rounded px-1 py-0.5 font-mono text-[0.85em] ${
            isUser ? 'bg-white/20' : 'bg-slate-100 text-slate-800'
          }`}
          {...props}
        >
          {children}
        </code>
      );
    },
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline underline-offset-2 ${
          isUser ? 'text-white hover:text-white/90' : 'text-efundo-primary hover:text-efundo-primary-dark'
        }`}
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className={`mb-2 border-l-4 pl-3 italic last:mb-0 ${
          isUser ? 'border-white/40 text-white/95' : 'border-slate-300 text-slate-600'
        }`}
      >
        {children}
      </blockquote>
    ),
    hr: () => (
      <hr className={`my-3 ${isUser ? 'border-white/30' : 'border-slate-200'}`} />
    ),
    table: ({ children }) => (
      <div className="mb-2 overflow-x-auto last:mb-0">
        <table className="min-w-full border-collapse text-left text-xs">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className={isUser ? 'bg-white/10' : 'bg-slate-100'}>{children}</thead>
    ),
    th: ({ children }) => (
      <th className="border px-2 py-1 font-semibold">{children}</th>
    ),
    td: ({ children }) => (
      <td className={`border px-2 py-1 ${isUser ? 'border-white/20' : 'border-slate-200'}`}>
        {children}
      </td>
    ),
  };

  return (
    <div className="markdown-message leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
