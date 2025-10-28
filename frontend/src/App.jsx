import React, { useState, useEffect, useRef } from 'react';

// --- Helper Components ---

/**
 * A simple loading spinner component.
 */
const Spinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="w-6 h-6 border-4 border-blue-200 dark:border-blue-900 border-t-blue-500 rounded-full animate-spin"></div>
  </div>
);

/**
 * Animated typing indicator with three bouncing dots.
 */
const TypingDots = () => (
  <div className="flex items-center gap-1 py-1">
    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.1s]"></span>
    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></span>
  </div>
);

/**
 * Simple circular avatar with an emoji and background tint.
 */
const Avatar = ({ role }) => {
  const isUser = role === 'user';
  const bg = isUser ? 'bg-blue-600' : 'bg-emerald-600';
  const emoji = isUser ? '🧑‍🎓' : '🤖';
  return (
    <div className={`flex-shrink-0 w-9 h-9 ${bg} text-white rounded-full grid place-items-center shadow-md`}
         aria-hidden="true">
      <span className="text-base leading-none">{emoji}</span>
    </div>
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
      <div className={`flex items-end gap-3 max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <Avatar role={role} />
        <div className="flex flex-col items-start max-w-full">
          <div
            className={`px-4 py-3 rounded-2xl shadow-md border ${
              isUser
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-700 rounded-br-sm'
                : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 border-gray-200 dark:border-slate-700 rounded-bl-sm'
            }`}
            style={{ wordBreak: 'break-word' }}
          >
            <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
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
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-5">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl shadow-md border bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 border-gray-200 dark:border-slate-700 rounded-bl-sm">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

// --- Main App Component ---

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
    } else {
      root.classList.remove('dark');
      localStorage.setItem('campuspal_theme', 'light');
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
      <header className="sticky top-0 bg-white/80 dark:bg-slate-900/70 backdrop-blur border-b border-gray-200 dark:border-slate-800 z-10">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 grid place-items-center shadow-md">
              <span className="text-white text-lg">🤖</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                CampusPal <span className="text-slate-500 dark:text-slate-400 font-medium">AI Assistant</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Your A.P. Shah Institute of Technology (APSIT) Guide</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDarkMode((v) => !v)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            {darkMode ? 'Light' : 'Dark'}
          </button>
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
        <div className="px-4 sm:px-6 pb-2">
          <div className="mx-auto max-w-3xl flex flex-wrap gap-2">
            {suggestionChips.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleChipClick(s)}
                className="px-3 py-2 rounded-full text-sm border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <footer className="bg-white/80 dark:bg-slate-900/70 backdrop-blur border-t border-gray-200 dark:border-slate-800 p-3 sm:p-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl flex items-center gap-2">
          <label htmlFor="chat-input" className="sr-only">Type your message</label>
          <input
            id="chat-input"
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask about admissions, placements, or fees..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-3 rounded-xl font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label={isLoading ? 'Sending...' : 'Send message'}
          >
            {isLoading ? 'Sending…' : 'Send'}
          </button>
        </form>
        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm text-center mt-2">{error}</p>
        )}
      </footer>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="pointer-events-none fixed bottom-24 right-6 sm:right-8">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white dark:bg-slate-700 shadow-lg hover:opacity-90"
            aria-label="Scroll to bottom"
          >
            ↓ New messages
          </button>
        </div>
      )}
    </div>
  );
}

export default App;

