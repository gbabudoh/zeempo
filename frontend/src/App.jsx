/**
 * Zeempo - Text-to-Pidgin Conversation
 * Type your message and get Pidgin English responses
 */
import React, { useState, useRef, useEffect } from 'react';
import ApiService from './services/api';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { HiPlus, HiChatBubbleLeftRight, HiTrash, HiXMark, HiBars3, HiMicrophone, HiPaperAirplane, HiCog6Tooth, HiArrowLeftOnRectangle, HiUserCircle, HiSun, HiMoon } from 'react-icons/hi2';

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
  const [targetLanguage, setTargetLanguage] = useState('pidgin');
  const [isListening, setIsListening] = useState(false);
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
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
    const savedTheme = localStorage.getItem('zeempo-theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('zeempo-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('zeempo-theme', 'light');
    }
  }, [isDarkMode]);

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
  const handleLogin = (email) => {
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

  // Voice Speaking Functionality (TTS)
  const speakText = (text, language) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language for TTS
    if (language === 'swahili') {
      utterance.lang = 'sw-KE';
    } else {
      utterance.lang = 'en-NG'; // Nigeria English as best proxy for Pidgin
    }

    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  };

  // Voice Recognition Functionality (STT)
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Your browser doesn't support voice recognition. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    if (targetLanguage === 'swahili') {
      recognition.lang = 'sw-KE'; // Standard for Swahili (Kenya)
    } else {
      recognition.lang = 'en-NG'; // Standard for Nigeria English
    }
    
    console.log(`Speech recognition started in ${recognition.lang} mode`);

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setError(`Voice error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      // Automatically send from voice
      handleSendText(null, transcript, true);
    };

    recognition.start();
  };

  // HANDLE TEXT MESSAGE - Get Pidgin response
  const handleSendText = async (e, forcedText = null, isVoiceInput = false) => {
    if (e) e.preventDefault();
    
    const textToProcess = forcedText || inputText;
    if (!textToProcess.trim() || isProcessing) return;

    setError('');
    setIsProcessing(true);
    const text = textToProcess;
    
    // Clear input if it wasn't a forced send (voice)
    if (!forcedText) setInputText('');

    if (!currentChatId) {
      setCurrentChatId(Date.now().toString());
    }

    try {
      // Add user message
      setMessages(prev => [...prev, { type: 'user', text, timestamp: new Date() }]);

      // Get AI response
      console.log(`Getting ${targetLanguage} response...`);
      const result = await ApiService.textToPidgin(text, targetLanguage);
      
      // Add AI message
      setMessages(prev => [...prev, { type: 'ai', text: result.response, timestamp: new Date(), language: targetLanguage }]);

      // Speak response ONLY if it was voice input
      if (isVoiceInput) {
        speakText(result.response, targetLanguage);
      }

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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex overflow-hidden font-sans transition-colors duration-500">
      
      {/* SIDEBAR */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div 
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 h-screen bg-[#DCDCDC] dark:bg-slate-900 flex flex-col z-30 shadow-xl border-r border-slate-300 dark:border-white/10 animate-in slide-in-from-left duration-300 transition-colors duration-500"
          >
            <div className="p-6 border-b border-slate-300/50 dark:border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="Zeempo Logo" className="h-10 w-auto object-contain" />
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
                >
                  <HiXMark className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={startNewChat}
                className="w-full px-4 py-3 bg-[#0a878f] hover:brightness-110 text-white rounded-xl transition-all shadow-lg shadow-[#0a878f]/20 flex items-center justify-center gap-2 font-semibold group cursor-pointer"
              >
                <HiPlus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                {targetLanguage === 'pidgin' ? 'New Chat' : 'Mazungumzo Mapya'}
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] mb-4 px-2">
                {targetLanguage === 'pidgin' ? 'History' : 'Historia'}
              </h3>
              {chatHistory.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <HiChatBubbleLeftRight className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">Silence is boring. Yarn something!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {chatHistory.map((chat) => (
                    <motion.div
                      layout
                      key={chat.id}
                      onClick={() => loadChat(chat.id)}
                      className={`group p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                        currentChatId === chat.id 
                          ? 'bg-black/5 dark:bg-white/10 border-black/5 dark:border-white/10 shadow-sm' 
                          : 'hover:bg-black/5 dark:hover:bg-white/5 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <HiChatBubbleLeftRight className={`w-4 h-4 shrink-0 ${currentChatId === chat.id ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${currentChatId === chat.id ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                            {chat.title}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{formatTimestamp(chat.timestamp)}</p>
                        </div>
                        <button
                          onClick={(e) => deleteChat(chat.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 text-slate-500 dark:text-slate-400 hover:text-red-400 transition-all"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* User Section */}
            <div className="p-4 border-t border-slate-300 dark:border-white/10 bg-black/5 dark:bg-white/5">
              {isLoggedIn && user ? (
                <div className="flex items-center gap-3 p-2 rounded-xl bg-white/40 dark:bg-slate-800/40 mb-4 border border-black/5 dark:border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-sm">
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
              ) : null}
              
              <div className="space-y-1">
                {!isLoggedIn && (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="w-full px-4 py-3 bg-[#0a878f] text-white rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-3 font-semibold text-sm shadow-sm shadow-[#0a878f]/20 cursor-pointer mb-2"
                  >
                    <HiUserCircle className="w-5 h-5 text-emerald-400" />
                    Sign In
                  </button>
                )}
                
                <div className="space-y-1">
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="w-full px-4 py-2.5 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-3 font-medium text-sm group cursor-pointer"
                  >
                    <HiCog6Tooth className="w-5 h-5 text-slate-500 group-hover:text-emerald-600" />
                    Settings
                  </button>
                  
                  {isLoggedIn && (
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-red-600 rounded-xl hover:bg-red-500/10 transition-all flex items-center gap-3 font-medium text-sm group cursor-pointer"
                    >
                      <HiArrowLeftOnRectangle className="w-5 h-5 text-red-400 group-hover:text-red-600" />
                      Sign Out
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 relative transition-colors duration-500">
        
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSidebarOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all"
              >
                <HiBars3 className="w-5 h-5" />
              </motion.button>
            )}
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {targetLanguage === 'pidgin' ? 'Pidgin AI' : 'Swahili AI'}
              </h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">System Active</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-white/5">
              {['pidgin', 'swahili'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setTargetLanguage(lang)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    targetLanguage === lang 
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-sm"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]/50 dark:bg-slate-950/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mb-8 shadow-inner"
              >
                <HiChatBubbleLeftRight className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight"
              >
                {targetLanguage === 'pidgin' ? 'Ready to Yarn?' : 'Tayari kuongea?'}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-slate-500 dark:text-slate-400 mb-12 leading-relaxed"
              >
                {targetLanguage === 'pidgin' 
                  ? 'I fit help you translate English to Pidgin sharp-sharp. Wetin dey for your mind?' 
                  : 'Ninaweza kukusaidia kutafsiri Kiingereza hadi Kiswahili kwa urahisi. Unataka kusema nini?'}
              </motion.p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {[
                  { icon: "👋", text: targetLanguage === 'pidgin' ? "How you dey?" : "Habari yako?", label: targetLanguage === 'pidgin' ? 'Greeting' : 'Salamu' },
                  { icon: "❓", text: targetLanguage === 'pidgin' ? "Wetin be AI?" : "AI ni nini?", label: targetLanguage === 'pidgin' ? 'Curiosity' : 'Udadisi' }
                ].map((item, i) => (
                  <motion.button 
                    key={i}
                    whileHover={{ scale: 1.02, translateY: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInputText(item.text)}
                    className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{item.label}</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{item.text}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.map((msg, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end gap-3 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                      msg.type === 'user' 
                        ? 'bg-slate-800 dark:bg-slate-300 text-white dark:text-slate-900' 
                        : 'bg-emerald-500 text-white'
                    }`}>
                      {msg.type === 'user' ? <HiUserCircle className="w-5 h-5" /> : <span className="font-bold text-xs">Z</span>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className={`rounded-[22px] px-6 py-4 shadow-sm relative group/bubble ${
                        msg.type === 'user' 
                          ? 'bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 rounded-br-none' 
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-white/5 rounded-bl-none'
                      }`}>
                        <p className="text-[15px] leading-relaxed font-medium">{msg.text}</p>
                        {msg.type === 'ai' && (
                          <button 
                            onClick={() => speakText(msg.text, msg.language || targetLanguage)}
                            className="absolute -right-12 bottom-0 p-2 text-slate-300 dark:text-slate-600 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                            title="Listen"
                          >
                            <HiMicrophone className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ${msg.type === 'user' ? 'text-right pr-2' : 'text-left pl-2'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error Overlay */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-20"
            >
              <div className="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HiXMark className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold flex-1">{error}</p>
                <button onClick={() => setError('')} className="p-1 hover:bg-white/10 rounded-md transition-colors">
                  <HiXMark className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="px-8 pb-8 pt-4 bg-white dark:bg-slate-950 transition-colors duration-500">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendText} className="relative flex items-center gap-3">
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={targetLanguage === 'pidgin' ? "Type message..." : "Andika ujumbe..."}
                  disabled={isProcessing}
                  className="w-full pl-6 pr-16 py-5 bg-slate-50 dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-white/5 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-200 dark:focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 focus:outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium"
                />
                
                <div className="absolute right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startListening}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                      isListening 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 shadow-sm border border-slate-100 dark:border-white/5'
                    }`}
                  >
                    <HiMicrophone className="w-5 h-5" />
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing || !inputText.trim()}
                    className="w-11 h-11 rounded-full bg-[#0a878f] text-white shadow-lg shadow-[#0a878f]/30 hover:brightness-110 disabled:opacity-30 disabled:shadow-none flex items-center justify-center transition-all"
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <HiPaperAirplane className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </form>
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest mt-4">
              {isProcessing ? 'Agent is thinking' : 'Powered by Zeempo AI Engine'}
            </p>
          </div>
        </div>
      </main>

      {/* AUTH MODAL */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-slate-100 dark:border-white/5"
            >
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Welcome Back</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Sign in to sync your yarns across devices.</p>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleLogin(formData.get('email'));
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-900 dark:text-white"
                      placeholder="e.g. oga@zeempo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Password</label>
                    <input
                      type="password"
                      name="password"
                      required
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-900 dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="pt-4 space-y-3">
                    <button
                      type="submit"
                      className="w-full py-4 bg-[#0a878f] text-white rounded-2xl font-bold hover:brightness-110 transition-all shadow-lg shadow-[#0a878f]/20 cursor-pointer"
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(false)}
                      className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-slate-100 dark:border-white/5"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Settings</h2>
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full border border-slate-200 dark:border-white/5">
                  <button 
                    onClick={() => setIsDarkMode(false)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${!isDarkMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    <HiSun className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsDarkMode(true)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-slate-700 text-emerald-400 shadow-sm' : 'text-slate-400'}`}
                  >
                    <HiMoon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: "Theme", value: isDarkMode ? 'Dark Mode' : 'Light Mode', icon: isDarkMode ? "🌙" : "☀️", onClick: () => setIsDarkMode(!isDarkMode) },
                  { label: "Language", value: targetLanguage === 'pidgin' ? 'Nigerian/Ghanaian Pidgin' : 'Kiswahili (East Africa)', icon: "🌍" },
                  { label: "History", value: `${chatHistory.length} yarns saved`, icon: "📜" }
                ].map((item, i) => (
                  <div 
                    key={i} 
                    onClick={item.onClick}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${item.onClick ? 'cursor-pointer hover:border-emerald-500/30' : ''} ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center text-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>{item.icon}</div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">{item.label}</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full py-4 mt-4 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-bold hover:brightness-110 transition-all shadow-lg dark:shadow-emerald-500/20"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Audio player removed - voice functionality temporarily disabled */}
    </div>
  );
}

export default App;