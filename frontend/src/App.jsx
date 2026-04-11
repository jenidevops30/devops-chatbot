import { useState, useRef, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import ChatMessage from './components/ChatMessage';
import LoadingBubble from './components/LoadingBubble';
import TopicChips from './components/TopicChips';
import WelcomeScreen from './components/WelcomeScreen';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useChatHistory } from './hooks/useChatHistory';
import ChatSidebar from './components/ChatSidebar';

const API_URL = import.meta.env.VITE_API_URL || '';

function Chat() {
  const { user, token, guestId, guestMessageCount, loading, logout, checkUser, fetchGuestStatus } = useAuth();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const { messages, setMessages, addMessage, clearMessages } = useChatHistory();
  const [aiProvider, setAiProvider] = useState('gemini');
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [ollamaModels, setOllamaModels] = useState([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const MAX_FREE_MESSAGES = 10;
  
  const currentCount = (user ? user.messageCount : guestMessageCount) || 0;
  const remainingChats = MAX_FREE_MESSAGES - currentCount;

  useEffect(() => {
    if (!showScrollButton) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, showScrollButton]);

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 200;
      setShowScrollButton(!isAtBottom);
    }
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationMessages = useCallback(async (id) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/conversations/${id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp).getTime()
        })));
        setActiveConversationId(id);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, setMessages]);

  useEffect(() => {
    if (aiProvider === 'ollama') {
      fetch(`${API_URL}/api/models/ollama`)
        .then(res => res.json())
        .then(data => {
          setOllamaModels(data);
          if (data.length > 0 && !data.find(m => m.name === selectedModel)) {
            setSelectedModel(data[0].name);
          }
        })
        .catch(err => console.error('Failed to fetch Ollama models:', err));
    } else {
      setSelectedModel('gemini-3-flash-preview');
    }
  }, [aiProvider, selectedModel]);

  const startNewChat = useCallback(() => {
    clearMessages();
    setActiveConversationId(null);
  }, [clearMessages]);

  const sendMessage = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || isLoading) return;

    if (remainingChats <= 0 && !user) {
      setShowLimitPopup(true);
      return;
    }

    setInput('');
    setIsLoading(true);

    const userMsg = { role: 'user', content: userText, timestamp: Date.now() };
    addMessage(userMsg);

    try {
      const headers = { 
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (guestId) {
        headers['x-guest-id'] = guestId;
      }

      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: [{ role: 'user', content: userText }],
          conversationHistory: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          conversationId: activeConversationId,
          provider: aiProvider,
          model: selectedModel
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }

      if (data.conversationId) {
        setActiveConversationId(data.conversationId);
      }

      addMessage({
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
        usage: data.usage,
      });
      
      // Refresh message count and check if limit was hit
      if (user) {
        await checkUser();
      } else {
        const newCount = await fetchGuestStatus();
        if (newCount >= MAX_FREE_MESSAGES) {
          // Delay briefly so user can see the message being added
          setTimeout(() => setShowLimitPopup(true), 1500);
        }
      }

    } catch (err) {
      addMessage({
        role: 'assistant',
        content: `**Error:** ${err.message}`,
        timestamp: Date.now(),
        isError: true,
      });
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, isLoading, messages, addMessage, token, guestId, remainingChats, user, checkUser, fetchGuestStatus, activeConversationId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-[#030712] text-[#f3f4f6] font-sans overflow-hidden">
      <ChatSidebar 
        token={token} 
        activeId={activeConversationId} 
        onSelectConversation={loadConversationMessages} 
        onNewChat={startNewChat}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-10 shrink-0 bg-[#030712]/80 backdrop-blur-md border-b border-gray-900/50">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-bold text-gray-100 font-sans tracking-tight">DevOps Assistant</h1>
          </div>

          <div className="flex items-center gap-4">
            {!user ? (
              <div className="px-3 py-1 rounded-full bg-red-900/10 border border-red-900/30 text-red-500 text-[10px] font-bold font-mono tracking-widest uppercase">
                {currentCount} / {MAX_FREE_MESSAGES} FREE
              </div>
            ) : (
              <div className="px-3 py-1 rounded-full bg-blue-900/20 text-blue-400 text-[10px] font-bold font-mono tracking-widest uppercase border border-blue-900/30">
                PREMIUM
              </div>
            )}

            {user ? (
              <button
                onClick={logout}
                className="text-gray-500 hover:text-white text-xs font-bold font-mono tracking-wider transition-all uppercase"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="text-gray-100 bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-lg text-xs font-bold font-sans tracking-tight transition-all border border-blue-500 shadow-lg shadow-blue-900/20"
              >
                Log In
              </Link>
            )}
          </div>
        </header>

        {/* Chat area */}
        <main 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-none relative flex flex-col items-center"
        >
          <div className="max-w-4xl w-full flex flex-col group/history">
            {messages.length === 0 ? (
              <WelcomeScreen onSelect={sendMessage} />
            ) : (
              <>
                {/* Topic chips at top of history */}
                <TopicChips onSelect={sendMessage} />
                <div className="py-4">
                  {messages.map((msg, i) => <ChatMessage key={i} message={msg} />)}
                </div>
              </>
            )}
            {isLoading && <LoadingBubble />}
            <div ref={chatEndRef} className="h-32" />
          </div>

          {/* Floating Action Button (Scroll Down) */}
          <button 
            onClick={scrollToBottom}
            className={`absolute bottom-32 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-blue-600 border border-blue-500 flex items-center justify-center text-white transition-all shadow-2xl z-50 ${
              showScrollButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            } hover:bg-blue-500 active:scale-95`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </main>

        {/* Floating Input Capsule */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center pointer-events-none">
          {/* Bottom Model Controls */}
          <div className="max-w-3xl w-full mb-3 mb-4 pointer-events-auto flex items-center justify-center gap-3">
             {/* Provider Switcher */}
             <div className="flex bg-[#0b0f1a]/80 backdrop-blur-md rounded-xl p-1 border border-gray-800 shadow-xl">
                <button 
                  onClick={() => setAiProvider('gemini')}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-bold font-sans transition-all uppercase tracking-wider ${
                    aiProvider === 'gemini' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Gemini
                </button>
                <button 
                  onClick={() => setAiProvider('ollama')}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-bold font-sans transition-all uppercase tracking-wider ${
                    aiProvider === 'ollama' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Ollama
                </button>
              </div>

              {/* Model Selector Pill */}
              <div className="flex items-center bg-[#0b0f1a]/80 backdrop-blur-md rounded-xl border border-gray-800 px-4 py-1.5 shadow-xl">
                <span className="text-[10px] text-gray-500 font-extrabold font-mono mr-3 uppercase tracking-widest opacity-60">Engine</span>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-transparent text-[11px] font-bold font-sans text-blue-400 focus:outline-none cursor-pointer hover:text-blue-300 transition-colors"
                >
                  {aiProvider === 'gemini' ? (
                    <>
                      <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                      <option value="gemini-2.0-flash">Gemini 2 Flash</option>
                      <option value="gemini-2.0-flash-lite-preview">Gemini 2 Flash Lite</option>
                    </>
                  ) : (
                    <>
                      {ollamaModels.length > 0 ? (
                        ollamaModels.map(m => (
                          <option key={m.name} value={m.name} className="bg-gray-950 text-gray-100">{m.name}</option>
                        ))
                      ) : (
                        <option value="">No models found</option>
                      )}
                    </>
                  )}
                </select>
              </div>
          </div>

          <div className="max-w-3xl w-full pointer-events-auto">
            <div className="bg-[#0b0f1a] border border-gray-800 rounded-[26px] p-2 pr-3 shadow-2xl transition-all focus-within:border-gray-700 flex flex-col group/input">
              <div className="flex gap-2 items-end px-2 py-1">
                {/* Plus Button */}
                <button className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-800 rounded-full transition-all shrink-0">
                  <span className="text-2xl font-light">+</span>
                </button>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  className="flex-1 bg-transparent outline-none text-[15px] text-gray-100 placeholder-gray-600 resize-none max-h-52 leading-relaxed py-2 font-sans"
                  rows={1}
                  style={{ minHeight: '36px' }}
                />

                {/* Send Button or Voice */}
                {input.trim() ? (
                  <button
                    onClick={() => sendMessage()}
                    disabled={isLoading}
                    className="w-9 h-9 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center transition-all shrink-0 shadow-lg"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                ) : (
                  <button className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-800 rounded-full transition-all shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-[11px] text-gray-700 text-center mt-3 font-sans opacity-80 uppercase tracking-widest font-bold">
              DevOps Assistant Core · Verified Information
            </p>
          </div>
        </div>
      </div>

      {/* Login Popup Modal */}
      {showLimitPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl shadow-blue-900/10 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/50 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-glow">
              🔒
            </div>
            <h2 className="text-xl font-bold text-gray-100 font-mono mb-2 uppercase tracking-tight">Free Limit Reached</h2>
            <p className="text-sm text-gray-400 font-sans mb-8 leading-relaxed">
              You've used all 10 free messages. Register or log in now to continue your conversation with DevOps Assistant.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Link
                to="/login"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 font-mono text-sm uppercase"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold py-3 rounded-xl transition-all border border-gray-700 font-mono text-sm uppercase"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Chat />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
