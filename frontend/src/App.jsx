import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import logo from './logo.jpg';


const CustomToast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: {
      bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      icon: <CheckCircle2 className="w-5 h-5" />,
      borderColor: 'border-emerald-400'
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500 to-red-600',
      icon: <XCircle className="w-5 h-5" />,
      borderColor: 'border-red-400'
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
      icon: <AlertCircle className="w-5 h-5" />,
      borderColor: 'border-blue-400'
    }
  };

  const { bg, icon, borderColor } = config[type] || config.success;

  return (
    <div className="fixed top-[70px] right-4 z-[9999] animate-slide-in-right">
      <div className={`${bg} ${borderColor} border-2 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[320px] max-w-[400px] backdrop-blur-md`}>
        <div className="flex-shrink-0 animate-scale-in">
          {icon}
        </div>
        <p className="font-semibold text-sm flex-1">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all focus:outline-none active:scale-95"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

/**
 * Shadcn-style Spinner Component with proper animation
 */
const Spinner = ({ className = "" }) => (
  <div className={`inline-block ${className}`}>
    <svg
      className="animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width="100%"
      height="100%"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </div>
);

/**
 * Chat History Viewer with Storage Stats
 */
const ChatHistoryViewer = ({ isOpen, onClose, messages, onDeleteMessages }) => {
  const [selectedMessages, setSelectedMessages] = React.useState([]);
  
  if (!isOpen) return null;

  const handleSelectMessage = (index) => {
    setSelectedMessages(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleSelectAll = () => {
    if (selectedMessages.length === messages.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(messages.map((_, index) => index));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedMessages.length === 0) return;
    onDeleteMessages(selectedMessages);
    setSelectedMessages([]);
  };

  const handleClose = () => {
    setSelectedMessages([]);
    onClose();
  };

  // Calculate storage usage
  const getStorageStats = () => {
    try {
      let totalSize = 0;
      let chatHistorySize = 0;
      
      // Calculate total localStorage usage (characters are stored as UTF-16, 2 bytes each)
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const itemSize = (localStorage[key].length + key.length) * 2; // UTF-16 = 2 bytes per char
          totalSize += itemSize;
          if (key === 'campuspal_chat_history') {
            chatHistorySize = localStorage[key].length * 2;
          }
        }
      }
      
      // Most browsers allow ~5-10MB, we'll use 5MB as conservative estimate
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      const usedPercentage = Math.min(((totalSize / maxSize) * 100), 100).toFixed(1);
      const remainingSize = Math.max(maxSize - totalSize, 0);
      
      return {
        used: (totalSize / 1024).toFixed(2), // KB
        remaining: (remainingSize / 1024).toFixed(2), // KB
        percentage: parseFloat(usedPercentage),
        chatSize: (chatHistorySize / 1024).toFixed(2), // KB
        messageCount: messages.length
      };
    } catch (error) {
      return { used: 0, remaining: 0, percentage: 0, chatSize: 0, messageCount: 0 };
    }
  };

  const stats = getStorageStats();

  return (
    <div className="sticky inset-0 z-50 flex items-center sm:items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel - slides from bottom on mobile, scales in on desktop */}
      <div className="sticky bg-white dark:bg-slate-800 w-full sm:max-w-3xl sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col animate-slide-up sm:animate-scale-in will-change-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chat History</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {stats.messageCount} messages
                {selectedMessages.length > 0 && ` • ${selectedMessages.length} selected`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none active:scale-95"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Storage Stats */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700/50 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Storage Usage</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats.percentage}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(stats.percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-600 dark:text-slate-400">
            <span>Used: {stats.used} KB</span>
            <span>Available: {stats.remaining} KB</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Chat history: {stats.chatSize} KB
          </div>
        </div>

        {/* Selection Controls */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedMessages.length === messages.length && messages.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Select All</span>
          </label>
          {selectedMessages.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-200 ease-out active:scale-95 will-change-transform focus:outline-none shadow-md text-sm"
            >
              Delete {selectedMessages.length === messages.length ? 'All' : `(${selectedMessages.length})`}
            </button>
          )}
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {messages.map((msg, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border transition-all duration-200 ${
                selectedMessages.includes(index)
                  ? 'ring-2 ring-blue-500 dark:ring-blue-400'
                  : ''
              } ${
                msg.role === 'user'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selectedMessages.includes(index)}
                  onChange={() => handleSelectMessage(index)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {msg.role === 'user' ? '👤 You' : 'CampusPal'}
                    </span>
                    {msg.ts && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(msg.ts).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
                    {msg.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Custom Delete Confirmation Modal
 */
const DeleteModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in will-change-transform">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 animate-bounce-in">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        
        {/* Content */}
        <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
          Clear Chat History?
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
          This will permanently delete all your conversation history. This action cannot be undone.
        </p>
        
        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200 ease-out active:scale-95 will-change-transform focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-200 ease-out active:scale-95 will-change-transform focus:outline-none shadow-lg"
          >
            Delete All
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Animated typing indicator with three bouncing dots.
 */
const TypingDots = () => (
  <div className="flex items-center gap-1 py-1">
    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.2s] will-change-transform"></span>
    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.1s] will-change-transform"></span>
    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce will-change-transform"></span>
  </div>
);

/**
 * Simple circular avatar with an emoji and background tint.
 */
const Avatar = ({ role }) => {
  const isUser = role === 'user';
  const bg = isUser ? 'bg-blue-0' : 'bg-emerald-00';
  const emoji = isUser ? '🧑‍🎓' : <img src={logo} alt="Logo" />;
  return (
    <div className={`flex-shrink-0 w-9 h-9 ${bg} text-white rounded-full grid place-items-center shadow-md`}
         aria-hidden="true">
      <span className="text-base leading-none">{emoji}</span>
    </div>
  );
};

/**
 * Enhanced Dark Mode Toggle Switch with animated icon
 */
const DarkModeToggle = ({ darkMode, onToggle }) => {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle();
  };

  const handleTouchStart = (e) => {
    e.currentTarget.style.transform = 'scale(0.95)';
  };

  const handleTouchEnd = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
    // Prevent ghost clicks on Android
    e.preventDefault();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative inline-flex items-center h-9 w-[72px] sm:h-10 sm:w-20 md:h-9 md:w-[72px] rounded-full transition-all duration-300 ease-out focus:outline-none shadow-inner will-change-transform touch-manipulation select-none cursor-pointer ${
        darkMode 
          ? 'bg-slate-700 active:bg-slate-800' 
          : 'bg-slate-200 active:bg-slate-400'
      }`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      aria-label="Toggle dark mode"
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Toggle Circle with Icon */}
      <span
        className={`inline-flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 md:h-7 md:w-7 rounded-full shadow-lg transition-all duration-300 ease-out will-change-transform ${
          darkMode 
            ? 'bg-slate-800' 
            : 'bg-white'
        }`}
        style={{
          transform: darkMode ? 'translateX(40px)' : 'translateX(4px)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Sun Icon (Light Mode) */}
        <svg
          className={`w-5 h-5 sm:w-4 sm:h-4 text-amber-500 transition-all duration-300 ease-out will-change-transform ${
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
          className={`absolute w-5 h-5 sm:w-4 sm:h-4 text-indigo-400 transition-all duration-300 ease-out will-change-transform ${
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
      className="ml-2 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-600/60 border border-slate-200 dark:border-slate-600 transition-all duration-200 ease-out active:scale-95 will-change-transform focus:outline-none"
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
    <div ref={containerRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 overscroll-contain scroll-smooth">
      <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5 will-change-scroll">
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

// --- Main App Component ---

function App() {
  // LocalStorage key for chat history
  const CHAT_HISTORY_KEY = 'campuspal_chat_history';
  
  // Default welcome message function to avoid stale timestamps
  const getDefaultMessage = () => ({
    role: 'assistant',
    content: "Hello! 👋 I'm CampusPal your APSIT AI guide. How can I help you today?",
    ts: Date.now(),
  });

  // Initialize messages from localStorage or default
  const [messages, setMessages] = useState(() => {
    try {
      const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          return parsedHistory;
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
    return [getDefaultMessage()];
  });
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryViewer, setShowHistoryViewer] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  // Backend API URL
  const API_URL = 'http://localhost:8000/chat';

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat history to localStorage:', error);
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        showToast('Storage full! Consider clearing old chat history. ⚠️', 'error');
      }
    }
  }, [messages]);

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

  /**
   * Shows the delete confirmation modal
   */
  const handleClearHistory = () => {
    setShowDeleteModal(true);
  };

  /**
   * Shows a toast notification
   */
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  /**
   * Removes a toast notification
   */
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  /**
   * Confirms and clears the chat history
   */
  const confirmClearHistory = () => {
    setMessages([getDefaultMessage()]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
    setShowDeleteModal(false);
    showToast('Chat history cleared successfully! 🎉', 'success');
  };

  /**
   * Deletes selected messages by index
   */
  const handleDeleteMessages = (selectedIndices) => {
    const newMessages = messages.filter((_, index) => !selectedIndices.includes(index));
    
    // If all messages are deleted, add default message
    if (newMessages.length === 0) {
      setMessages([getDefaultMessage()]);
      setShowHistoryViewer(false);
      showToast('All messages deleted! ', 'success');
    } else {
      setMessages(newMessages);
      showToast(`${selectedIndices.length} message${selectedIndices.length > 1 ? 's' : ''} deleted! `, 'success');
    }
  };


  return (
    <div className="flex flex-col h-screen overflow-auto bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 z-10 shadow-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br grid place-items-center shadow-md flex-shrink-0">
              <span className="text-white text-lg sm:text-base"><img src={logo} alt="Logo" /></span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">
                CampusPal <span className="text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">AI Assistant</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">APSIT Guide</p>
            </div>
          </div>
          <div className="flex items-center">
            <DarkModeToggle darkMode={darkMode} onToggle={() => setDarkMode((v) => !v)} />
          </div>
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
                className="px-3 py-2 rounded-full text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all duration-200 ease-out touch-manipulation will-change-transform focus:outline-none"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 sticky bottom-0 z-10 shadow-sm w-auto">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl flex items-end gap-2 p-3 sm:p-4">
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
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-xl font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none active:scale-95 transition-all duration-200 ease-out touch-manipulation min-w-[70px] sm:min-w-[80px] will-change-transform"
            aria-label={isLoading ? 'Sending...' : 'Send message'}
          >
            {isLoading ? (
              <Spinner className="w-5 h-5" />
            ) : (
              <span className="text-sm sm:text-base">Send</span>
            )}
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
            className="pointer-events-auto inline-flex items-center gap-2 px-3 py-2 sm:px-4 rounded-full bg-slate-900 text-white dark:bg-slate-700 shadow-lg hover:opacity-90 active:scale-95 transition-all duration-200 ease-out text-xs sm:text-sm touch-manipulation will-change-transform focus:outline-none"
            aria-label="Scroll to bottom"
          >
            ↓ <span className="hidden xs:inline">New messages</span>
          </button>
        </div>
      )}

      {/* Floating Storage/History Button - Sticky */}
      <div className="sticky bottom-0 left-0 right-0 pointer-events-none z-40">
        <div className="flex justify-end p-4 sm:p-6">
          <button
            type="button"
            onClick={() => setShowHistoryViewer(true)}
            className="pointer-events-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-2xl hover:shadow-blue-500/50 active:scale-95 transition-all duration-200 ease-out flex items-center justify-center will-change-transform focus:outline-none group touch-manipulation"
            aria-label="View chat history and storage"
            title="Chat History & Storage"
          >
            <svg className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            {/* Pulse animation ring */}
            <span className="absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover:opacity-20" />
          </button>
        </div>
      </div>

      {/* Chat History Viewer Modal */}
      <ChatHistoryViewer
        isOpen={showHistoryViewer}
        onClose={() => setShowHistoryViewer(false)}
        messages={messages}
        onDeleteMessages={handleDeleteMessages}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onConfirm={confirmClearHistory}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Custom Toast Notifications */}
      <div className="fixed top-[70px] right-4 z-[9999] flex flex-col gap-3">
        {toasts.map(toast => (
          <CustomToast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default App;

