import Markdown from "markdown-to-jsx";

interface BlogPreviewProps {
  content: string;
  className?: string;
}

export function BlogPreview({ content, className = "" }: BlogPreviewProps) {
  return (
    <article className={`prose prose-lg prose-invert max-w-none ${className}`}>
      <Markdown
        options={{
          overrides: {
            a: {
              props: {
                className: "text-blue-400 hover:text-blue-300 underline transition",
                target: "_blank",
                rel: "noopener noreferrer",
              },
            },
            h1: {
              props: {
                className: "text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6 mt-8",
              },
            },
            h2: {
              props: {
                className: "text-3xl font-bold text-blue-400 mt-10 mb-5 border-b border-blue-500/30 pb-3",
              },
            },
            h3: {
              props: {
                className: "text-2xl font-semibold text-purple-400 mt-8 mb-4",
              },
            },
            h4: {
              props: {
                className: "text-xl font-semibold text-gray-200 mt-6 mb-3",
              },
            },
            p: {
              props: {
                className: "text-gray-300 mb-4 leading-relaxed",
              },
            },
            ul: {
              props: {
                className: "list-disc list-inside text-gray-300 mb-4 space-y-2",
              },
            },
            ol: {
              props: {
                className: "list-decimal list-inside text-gray-300 mb-4 space-y-2",
              },
            },
            li: {
              props: {
                className: "text-gray-300",
              },
            },
            blockquote: {
              props: {
                className: "border-l-4 border-blue-500 pl-4 italic text-gray-400 my-4",
              },
            },
            code: {
              props: {
                className: "bg-white/10 px-1.5 py-0.5 rounded text-sm text-blue-300",
              },
            },
            pre: {
              props: {
                className: "bg-white/5 p-4 rounded-lg overflow-x-auto mb-4",
              },
            },
          },
        }}
      >
        {content}
      </Markdown>
    </article>
  );
}
