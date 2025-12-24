/**
 * Zeempo - Text-to-Pidgin Conversation
 * Type your message and get Pidgin English responses
 */
import React, { useState, useRef, useEffect } from 'react';
import ApiService from './services/api';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [user, setUser] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Load saved data on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('zeempo-chats');
    if (savedChats) {
      setChatHistory(JSON.parse(savedChats));
    }
    const savedUser = localStorage.getItem('zeempo-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  // Save chat history
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('zeempo-chats', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice playback functionality temporarily disabled
  // useEffect(() => {
  //   if (currentAudioBlob && audioRef.current) {
  //     const audioUrl = URL.createObjectURL(currentAudioBlob);
  //     audioRef.current.src = audioUrl;
  //     audioRef.current.play()
  //       .then(() => console.log('AI voice playing...'))
  //       .catch(err => {
  //         console.error('Audio playback error:', err);
  //         setError('Cannot play voice. Enable autoplay in browser settings.');
  //       });
  //     return () => URL.revokeObjectURL(audioUrl);
  //   }
  // }, [currentAudioBlob]);

  // Start new chat
  const startNewChat = () => {
    if (messages.length > 0 && currentChatId) {
      updateChatInHistory();
    }
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    setMessages([]);
    setError('');
  };

  // Update chat in history
  const updateChatInHistory = () => {
    if (!currentChatId || messages.length === 0) return;

    const chatTitle = messages[0]?.text.slice(0, 40) + (messages[0]?.text.length > 40 ? '...' : '') || 'New Chat';
    const existingChatIndex = chatHistory.findIndex(chat => chat.id === currentChatId);

    if (existingChatIndex >= 0) {
      const updatedHistory = [...chatHistory];
      updatedHistory[existingChatIndex] = {
        id: currentChatId,
        title: chatTitle,
        messages: messages,
        timestamp: new Date().toISOString()
      };
      setChatHistory(updatedHistory);
    } else {
      setChatHistory(prev => [{
        id: currentChatId,
        title: chatTitle,
        messages: messages,
        timestamp: new Date().toISOString()
      }, ...prev]);
    }
  };

  // Load chat from history
  const loadChat = (chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chat.id);
      setMessages(chat.messages);
      setError('');
    }
  };

  // Delete chat
  const deleteChat = (chatId, e) => {
    e.stopPropagation();
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      startNewChat();
    }
  };

  // Login
  const handleLogin = (email, password) => {
    const mockUser = {
      name: email.split('@')[0],
      email: email,
      avatar: email[0].toUpperCase()
    };
    setUser(mockUser);
    setIsLoggedIn(true);
    setShowAuthModal(false);
    localStorage.setItem('zeempo-user', JSON.stringify(mockUser));
  };

  // Logout
  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('zeempo-user');
    setChatHistory([]);
    localStorage.removeItem('zeempo-chats');
    startNewChat();
  };

  // Voice recording functionality temporarily disabled
  // All voice-related functions have been removed

  // HANDLE TEXT MESSAGE - Get Pidgin response
  const handleSendText = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    setError('');
    setIsProcessing(true);
    const text = inputText;
    setInputText('');

    if (!currentChatId) {
      setCurrentChatId(Date.now().toString());
    }

    try {
      // Add user message
      setMessages(prev => [...prev, { type: 'user', text, timestamp: new Date() }]);

      // Get Pidgin response
      console.log('Getting Pidgin response...');
      const result = await ApiService.textToPidgin(text);
      
      // Add AI message
      setMessages(prev => [...prev, { type: 'ai', text: result.response, timestamp: new Date() }]);

      // Voice functionality temporarily disabled
      // Audio playback removed for now

      setTimeout(() => updateChatInHistory(), 100);

    } catch (err) {
      console.error('Text processing error:', err);
      setError(err.message || 'Something went wrong! Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };


  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex">
      
      {/* SIDEBAR */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden`}>
        
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Zeempo</h2>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={startNewChat}
            className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md flex items-center justify-center gap-2 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">Recent Chats</h3>
          {chatHistory.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm text-gray-500">No chat history yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => loadChat(chat.id)}
                  className={`group p-3 rounded-xl cursor-pointer transition-all ${
                    currentChatId === chat.id 
                      ? 'bg-emerald-50 border border-emerald-200' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{chat.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatTimestamp(chat.timestamp)}</p>
                    </div>
                    <button
                      onClick={(e) => deleteChat(chat.id, e)}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-100 transition-all"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          {isLoggedIn && user ? (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                {user.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          ) : null}
          
          <div className="space-y-2">
            {!isLoggedIn ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 font-medium text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all flex items-center gap-2 font-medium text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-gray-800 px-6 py-4 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-700 hover:bg-slate-600 transition-all"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Zeempo</h1>
              <p className="text-sm text-gray-300 font-medium">Pidgin Conversation</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-emerald-400/30">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
            <span className="text-emerald-100 text-sm font-semibold">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-slate-50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Start a Conversation with Zeempo</h2>
              <p className="text-gray-600 max-w-md mb-6">Type your message and get responses in Nigerian Pidgin English!</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                <button 
                  onClick={() => setInputText("How you dey?")}
                  className="p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left"
                >
                  <p className="text-sm font-medium text-gray-800">👋 Greeting</p>
                  <p className="text-xs text-gray-500 mt-1">How you dey?</p>
                </button>
                <button 
                  onClick={() => setInputText("Wetin be AI?")}
                  className="p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left"
                >
                  <p className="text-sm font-medium text-gray-800">❓ Question</p>
                  <p className="text-xs text-gray-500 mt-1">Wetin be AI?</p>
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex mb-6 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-3 max-w-[75%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${
                      msg.type === 'user' 
                        ? 'bg-gradient-to-br from-slate-600 to-gray-700' 
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    }`}>
                      {msg.type === 'user' ? (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className={`rounded-2xl px-5 py-3 shadow-md ${
                        msg.type === 'user' 
                          ? 'bg-gradient-to-br from-slate-700 to-gray-800 text-white' 
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                      <p className={`text-xs mt-1.5 px-2 ${
                        msg.type === 'user' ? 'text-right text-gray-400' : 'text-left text-gray-500'
                      }`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 py-4 bg-red-50 border-t border-red-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm text-red-700 flex-1 font-medium">{error}</p>
              <button 
                onClick={() => setError('')} 
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 transition-colors"
              >
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Input Area - TEXT */}
        <div className="bg-white border-t border-gray-200 px-6 py-5">
          <form onSubmit={handleSendText} className="flex items-center gap-3">
            
            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message here..."
                disabled={isProcessing}
                className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-slate-400 focus:bg-white focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 placeholder-gray-400"
              />
            </div>

            {/* SEND BUTTON */}
            <button
              type="submit"
              disabled={isProcessing || !inputText.trim()}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-gray-800 hover:from-slate-800 hover:to-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
              title="Send message"
            >
              {isProcessing ? (
                <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>

          {/* Status */}
          <div className="mt-3 text-center">
            {isProcessing && (
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-slate-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-slate-600 font-medium">Processing...</p>
              </div>
            )}
            {!isProcessing && (
              <p className="text-xs text-gray-400">Type your message and press Enter or click Send</p>
            )}
          </div>
        </div>
      </div>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Sign In to Zeempo</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleLogin(formData.get('email'), formData.get('password'));
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-700">Language</p>
                <p className="text-xs text-gray-500 mt-1">Nigerian/Ghanaian Pidgin</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-700">AI Model</p>
                <p className="text-xs text-gray-500 mt-1">Groq LLaMA 3.3 70B</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-700">Total Conversations</p>
                <p className="text-xs text-gray-500 mt-1">{chatHistory.length} chats saved</p>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio player removed - voice functionality temporarily disabled */}
    </div>
  );
}

export default App;