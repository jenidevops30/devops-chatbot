import { useState, useEffect } from 'react';

export default function ChatSidebar({ onSelectConversation, onNewChat, activeId, token }) {
  const [conversations, setConversations] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || '';

  const fetchConversations = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setConversations(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [token, activeId]);

  return (
    <aside className="w-[260px] bg-[#020617] flex flex-col h-full shrink-0 group/sidebar overflow-hidden transition-all border-r border-gray-900 shadow-2xl">
      <div className="p-3.5">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-3 py-3 bg-transparent hover:bg-gray-800/50 text-gray-100 border border-gray-800 rounded-xl transition-all group font-sans font-medium text-sm"
        >
          <span className="w-7 h-7 bg-blue-600/20 group-hover:bg-blue-600/30 text-blue-400 rounded-lg flex items-center justify-center text-lg">+</span>
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none p-2 space-y-0.5">
        <p className="px-3 py-2 text-[10px] font-bold text-gray-700 uppercase tracking-[0.2em] font-mono">History</p>
        
        {!token ? (
          <div className="px-3 py-10 text-center">
            <p className="text-[11px] text-gray-600 font-sans leading-relaxed italic">
              Login to save persistent chat history
            </p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-3 py-10 text-center text-gray-700 font-sans text-[11px]">
            No chats yet
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`w-full text-left px-3 py-3 rounded-xl transition-all group relative overflow-hidden flex items-center gap-3 ${
                activeId === conv.id 
                  ? 'bg-blue-600/10 text-blue-400' 
                  : 'text-gray-400 hover:bg-gray-800/40 hover:text-gray-200'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate font-sans tracking-tight">{conv.title}</p>
                <p className="text-[10px] text-gray-600 font-mono mt-0.5">
                  {new Date(conv.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </p>
              </div>
              {activeId === conv.id && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              )}
            </button>
          ))
        )}
      </div>

      <div className="p-4 bg-black/10 mt-auto border-t border-gray-900/50">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
          <span className="text-[10px] text-gray-600 font-mono font-bold uppercase tracking-widest">DevOps Core</span>
        </div>
      </div>
    </aside>
  );
}
