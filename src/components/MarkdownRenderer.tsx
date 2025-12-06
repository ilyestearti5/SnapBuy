import React from "react";
import ReactMarkdown from "react-markdown";
interface MarkdownRendererProps {
  content: string;
  className?: string;
}
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        components={{
          // Custom styling for different markdown elements
          h1: ({ children }) => (
            <h1 className="mt-4 mb-2 font-bold text-2xl">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-4 mb-2 font-semibold text-xl">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 mb-2 font-semibold text-lg">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-2">{children}</p>,
          code: ({ inline, children }: any) =>
            inline ? (
              <code className="px-2 py-1 rounded font-mono text-sm">
                {children}
              </code>
            ) : (
              <code className="font-mono text-sm">{children}</code>
            ),
          pre: ({ children }) => (
            <pre className="mt-2 mb-2 p-3 rounded-lg overflow-x-auto">
              {children}
            </pre>
          ),
          ul: ({ children }) => (
            <ul className="mb-2 pl-6 list-disc">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 pl-6 list-decimal">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mb-2 py-2 pl-4 border-[--biqpod-primary] border-l-4 rounded-r">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[--biqpod-primary] hover:underline"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          img: ({ src, alt }) => (
            <img
              src={src || ""}
              alt={alt || ""}
              className="my-2 rounded max-h-[200px]"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
export default MarkdownRenderer;
