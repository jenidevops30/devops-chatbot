import { useState, useEffect } from 'react';

export default function OnboardingModal({ onComplete }) {
  const [name, setName] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay for smooth entrance
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete(name.trim());
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-700 ${isVisible ? 'backdrop-blur-xl bg-black/60 opacity-100' : 'backdrop-blur-0 bg-transparent opacity-0'}`}>
      <div className={`w-full max-w-md bg-[#0b0f1a] border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl transition-all duration-700 transform ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-12 scale-95'}`}>
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 animate-bounce-slow">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
              Welcome to DevOps AI
            </h2>
            <p className="text-gray-400 text-sm">To give you the best experience, what should I call you?</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative group">
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full bg-gray-950 border-2 border-gray-800 rounded-2xl px-6 py-4 text-white placeholder-gray-600 outline-none focus:border-blue-600/50 focus:ring-4 focus:ring-blue-600/10 transition-all text-lg font-medium"
              />
              <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
            </div>
            
            <button
              disabled={!name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:grayscale py-4 rounded-2xl text-white font-bold text-lg shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              Get Started
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
