import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function CopyButton({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`text-xs px-2 py-1 rounded border transition-all font-mono ${
        copied
          ? 'text-green-400 border-green-800 bg-green-950'
          : 'text-gray-400 border-gray-700 hover:text-gray-200 hover:border-gray-500'
      }`}
    >
      {copied ? 'copied!' : 'copy'}
    </button>
  );
}

export default function ChatMessage({ message, userName }) {
  const isUser = message.role === 'user';
  const displayInitial = isUser && userName ? userName.charAt(0).toUpperCase() : null;
  
  const components = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const lang = match ? match[1] : '';
      const code = String(children).replace(/\n$/, '');

      if (!inline && (match || code.includes('\n'))) {
        return (
          <div className="my-5 rounded-xl overflow-hidden border border-gray-800 bg-[#0b0f1a] shadow-xl">
            <div className="flex items-center justify-between px-4 py-2 bg-[#161b2c] border-b border-gray-800">
              <span className="text-[10px] font-bold font-mono text-gray-500 uppercase tracking-widest">
                {lang || 'code'}
              </span>
              <CopyButton code={code} />
            </div>
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={lang || 'text'}
              PreTag="div"
              customStyle={{ margin: 0, padding: '20px', background: 'transparent', fontSize: '13px', lineHeight: '1.6' }}
              {...props}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <code
          className="bg-gray-800 text-blue-300 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-gray-700"
          {...props}
        >
          {children}
        </code>
      );
    },
    h1: ({ children }) => <h1 className="text-xl font-bold text-gray-100 mt-8 mb-4 font-sans tracking-tight">{children}</h1>,
    h2: ({ children }) => <h2 className="text-lg font-bold text-gray-200 mt-6 mb-3 font-sans tracking-tight">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-bold text-blue-400 mt-5 mb-2 font-sans tracking-tight">{children}</h3>,
    p: ({ children }) => <p className="my-4 leading-relaxed text-[15px] selection:bg-blue-500/30 text-gray-300">{children}</p>,
    ul: ({ children }) => <ul className="my-4 pl-6 space-y-2 list-disc marker:text-gray-600">{children}</ul>,
    ol: ({ children }) => <ol className="my-4 pl-6 space-y-2 list-decimal marker:text-gray-600 marker:font-mono">{children}</ol>,
    li: ({ children }) => <li className="text-[15px] leading-relaxed text-gray-300">{children}</li>,
    strong: ({ children }) => <strong className="font-bold text-gray-100">{children}</strong>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-600 pl-5 my-6 text-gray-400 italic text-[15px] bg-blue-600/5 py-1 rounded-r-lg">
        {children}
      </blockquote>
    ),
  };

  return (
    <div className={`w-full flex justify-center py-6 group ${isUser ? '' : 'bg-transparent'}`}>
      <div className="max-w-3xl w-full flex gap-5 px-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-lg border transition-all ${
          isUser ? 'bg-blue-600 border-blue-500 text-white text-sm' : 'bg-gray-800 border-gray-700 text-lg'
        }`}>
          {isUser ? (displayInitial || '👤') : '⚙'}
        </div>

        <div className="flex-1 min-w-0 flex flex-col pt-1">
          <div className="text-[11px] font-bold text-gray-600 font-mono uppercase tracking-[0.2em] mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {isUser ? (userName || 'You') : 'DevOps Assistant'}
          </div>
          <div className="text-gray-100">
            {isUser ? (
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed selection:bg-blue-500/30 font-medium text-gray-200">{message.content}</p>
            ) : (
              <>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                  {message.content}
                </ReactMarkdown>
                
                {message.suggestion && (
                  <button
                    onClick={() => message.onSuggestionClick && message.onSuggestionClick(message.suggestion)}
                    className="mt-4 px-5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-xl text-blue-400 text-[13px] font-bold font-mono uppercase tracking-wider transition-all flex items-center gap-2 group/btn active:scale-95"
                  >
                    <span>{message.suggestion}</span>
                    <span className="group-hover/btn:translate-x-1 transition-transform">🔄</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
