import React, { useState, useEffect, useRef } from 'react';
import logo from './logo.jpg';

const Spinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="w-6 h-6 border-4 border-blue-200 dark:border-blue-900 border-t-blue-500 rounded-full animate-spin"></div>
  </div>
);


const TypingDots = () => (
  <div className="flex items-center gap-1 py-1">
    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.1s]"></span>
    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></span>
  </div>
);


const Avatar = ({ role }) => {
  const isUser = role === 'user';
  const bg = isUser ? 'bg-blue-600' : 'bg-emerald-000';
  const emoji = isUser ? '🧑‍🎓' : <img src={logo} alt="Logo" />;
  return (
    <div className={`flex-shrink-0 w-9 h-9 ${bg} text-white rounded-full grid place-items-center shadow-md`}
         aria-hidden="true">
      <span className="text-base leading-none">{emoji}</span>
    </div>
  );
};


const DarkModeToggle = ({ darkMode, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex items-center h-10 w-20 sm:h-9 sm:w-[72px] rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-inner ${
        darkMode 
          ? 'bg-slate-700 hover:bg-slate-600' 
          : 'bg-slate-200 hover:bg-slate-300'
      }`}
      aria-label="Toggle dark mode"
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Toggle Circle with Icon */}
      <span
        className={`inline-flex items-center justify-center h-8 w-8 sm:h-7 sm:w-7 rounded-full shadow-lg transform transition-all duration-300 ${
          darkMode 
            ? 'translate-x-11 sm:translate-x-10 bg-slate-800' 
            : 'translate-x-1 bg-white'
        }`}
      >
        {/* Sun Icon (Light Mode) */}
        <svg
          className={`w-5 h-5 sm:w-4 sm:h-4 text-amber-500 transition-all duration-300 ${
            darkMode ? 'opacity-0 rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
        
        {/* Moon Icon (Dark Mode) */}
        <svg
          className={`absolute w-5 h-5 sm:w-4 sm:h-4 text-indigo-400 transition-all duration-300 ${
            darkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-0'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </span>
    </button>
  );
};

/**
 * Copy button for assistant messages.
 */
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (_) {}
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className="ml-2 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-600/60 border border-slate-200 dark:border-slate-600"
      aria-label="Copy message"
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

/**
 * Renders a single chat message bubble.
 * @param {{role: 'user' | 'assistant', content: string, ts?: number}} message - The message object to render.
 */
const ChatMessage = ({ message }) => {
  const { role, content, ts } = message;
  const isUser = role === 'user';
  const timeString = ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
      <div className={`flex items-end gap-2 sm:gap-3 max-w-[85%] sm:max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <Avatar role={role} />
        <div className="flex flex-col items-start max-w-full min-w-0">
          <div
            className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-md border ${
              isUser
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-700 rounded-br-sm'
                : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 border-gray-200 dark:border-slate-700 rounded-bl-sm'
            }`}
            style={{ wordBreak: 'break-word' }}
          >
            <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{content}</p>
            {!isUser && (
              <div className="mt-2">
                <CopyButton text={content} />
              </div>
            )}
          </div>
          {timeString && (
            <span className={`mt-1 text-xs ${isUser ? 'text-blue-700/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>{timeString}</span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Renders the chat message list.
 * @param {Array} messages - List of chat messages.
 * @param {boolean} isLoading - Whether the bot is currently responding.
 */
const MessageList = ({ messages, isLoading, onScrolledStateChange }) => {
  const containerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Track scroll to show/hide scroll-to-bottom button
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      onScrolledStateChange?.(!atBottom);
    };
    el.addEventListener('scroll', onScroll);
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [onScrolledStateChange]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 overscroll-contain">
      <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-md border bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 border-gray-200 dark:border-slate-700 rounded-bl-sm">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

//Main App Component

function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! 👋 I'm CampusPal — your APSIT AI guide. How can I help you today?",
      ts: Date.now(),
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Backend API URL
  const API_URL = 'http://localhost:8000/chat';

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem('campuspal_theme');
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : systemPrefersDark;
    setDarkMode(isDark);
  }, []);

  // Apply dark mode class
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('campuspal_theme', 'dark');
      console.log('Dark mode enabled - dark class added to html');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('campuspal_theme', 'light');
      console.log('Light mode enabled - dark class removed from html');
    }
  }, [darkMode]);

  /**
   * Handles the submission of the chat form.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newUserMessage = { role: 'user', content: userInput, ts: Date.now() };
    // Add user message to state and prepare for bot response
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setIsLoading(true);
    setError(null);
    setUserInput('');

    // Prepare history for the API.
    // The API expects the *current* history, not including the new user message.
    const historyForAPI = messages.map(({ role, content }) => ({ role, content }));

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: userInput,
          chat_history: historyForAPI, // Send the history *before* this new message
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      const botMessage = {
        role: 'assistant',
        content: data.answer || 'Sorry, I encountered a problem.',
        ts: Date.now(),
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);

    } catch (err) {
      console.error(err);
      
      let userErrorMessage = 'Failed to get a response from the bot. Please try again.';
      // Check for the specific "Failed to fetch" error, which often means the backend isn't running or CORS is misconfigured.
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        userErrorMessage = 'Error: Could not connect to the backend. Please ensure the Python server (backend.py) is running on http://localhost:8000. Also, check the server logs for any errors (like a missing FAISS database).';
      }

      setError(userErrorMessage);
      // Add an error message to the chat
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: userErrorMessage, ts: Date.now() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestionChips = [
    'Admission process and eligibility',
    'Fee structure and scholarships',
    'Placements statistics and companies',
    'Campus facilities and clubs',
  ];

  const handleChipClick = async (text) => {
    setUserInput(text);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 z-10 shadow-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Header logo container */}
            <div className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 grid place-items-center shadow-md flex-shrink-0 overflow-hidden">
               {/* Use the logo in the header */}
              <img src={logo} alt="Logo" className="w-full h-full object-cover"/>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">
                CampusPal <span className="text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">AI Assistant</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">APSIT Guide</p>
            </div>
          </div>
          <DarkModeToggle darkMode={darkMode} onToggle={() => setDarkMode((v) => !v)} />
        </div>
      </header>

      {/* Message List */}
      <main className="flex-1">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onScrolledStateChange={setShowScrollButton}
        />
      </main>

      {/* Suggestions (shown when user hasn't typed yet beyond greeting) */}
      {messages.length <= 2 && (
        <div className="px-3 sm:px-4 md:px-6 pb-2">
          <div className="mx-auto max-w-3xl flex flex-wrap gap-2">
            {suggestionChips.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleChipClick(s)}
                className="px-3 py-2 rounded-full text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-transform touch-manipulation"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <footer className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 p-3 sm:p-4 safe-area-inset-bottom">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl flex items-end gap-2">
          <label htmlFor="chat-input" className="sr-only">Type your message</label>
          <input
            id="chat-input"
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask about admissions, placements..."
            disabled={isLoading}
            className="flex-1 px-3 py-3 sm:px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 text-sm sm:text-base touch-manipulation"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !userInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-xl font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-95 transition-transform touch-manipulation min-w-[70px] sm:min-w-[80px]"
            aria-label={isLoading ? 'Sending...' : 'Send message'}
          >
            <span className="text-sm sm:text-base">{isLoading ? 'Sending…' : 'Send'}</span>
          </button>
        </form>
        {error && (
          <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm text-center mt-2 px-2">{error}</p>
        )}
      </footer>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="pointer-events-none fixed bottom-20 sm:bottom-24 right-4 sm:right-6 md:right-8 z-20">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="pointer-events-auto inline-flex items-center gap-2 px-3 py-2 sm:px-4 rounded-full bg-slate-900 text-white dark:bg-slate-700 shadow-lg hover:opacity-90 active:scale-95 transition-all text-xs sm:text-sm touch-manipulation"
            aria-label="Scroll to bottom"
          >
            ↓ <span className="hidden xs:inline">New messages</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default App;

