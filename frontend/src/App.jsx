/**
 * Zeempo - Text-to-Pidgin Conversation
 * Type your message and get Pidgin English responses
 */
import React, { useState, useRef, useEffect } from 'react';
import ApiService from './services/api';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { HiPlus, HiChatBubbleLeftRight, HiTrash, HiXMark, HiBars3, HiMicrophone, HiPaperAirplane, HiCog6Tooth, HiArrowLeftOnRectangle, HiUserCircle, HiSun, HiMoon } from 'react-icons/hi2';
import { VoiceAgent } from './components/VoiceAgent';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
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
    const initApp = async () => {
      // 1. Check Theme
      const savedTheme = localStorage.getItem('zeempo-theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
      }

      // 2. Check Auth
      const token = localStorage.getItem('zeempo-token');
      if (token) {
        try {
          const userData = await ApiService.getMe();
          if (userData) {
            setUser(userData);
            setIsLoggedIn(true);
            fetchSessions();
          }
        } catch (err) {
          console.error("Auth check failed:", err);
          ApiService.setToken(null);
        }
      }
    };
    initApp();
  }, []);

  const fetchSessions = async () => {
    try {
      const sessions = await ApiService.getChatSessions();
      setChatHistory(sessions);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const loadChat = async (sessionId) => {
    setIsProcessing(true);
    setCurrentChatId(sessionId);
    try {
      const history = await ApiService.getChatHistory(sessionId);
      setMessages(history.messages.map(m => ({
        text: m.content,
        type: m.role === 'assistant' ? 'ai' : 'user',
        timestamp: m.timestamp
      })));
    } catch (err) {
      console.error("Load yarn error:", err);
      setError("I no fit load dis yarn.");
    } finally {
      setIsProcessing(false);
    }
  };

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
  //    //   .catch(() => {
    //     setError('Cannot play voice. Enable autoplay in browser settings.');
    //   });
  //     return () => URL.revokeObjectURL(audioUrl);
  //   }
  // }, [currentAudioBlob]);

  // Start new chat
  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setError('');
  };

  // Logout
  const handleLogout = () => {
    ApiService.setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    setChatHistory([]);
    setMessages([]);
    setCurrentChatId(null);
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

    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    setError('');
    setIsProcessing(true);
    const text = textToProcess;
    
    // Clear input if it wasn't a forced send (voice)
    if (!forcedText) setInputText('');

    try {
      // Add user message locally
      setMessages(prev => [...prev, { type: 'user', text, timestamp: new Date() }]);

      // Get AI response (Server saves the messages automatically)
      const data = await ApiService.textToPidgin(text, targetLanguage, currentChatId);
      
      const aiMessage = { 
        text: data.response, 
        type: 'ai', 
        timestamp: new Date(),
        language: targetLanguage 
      };
      setMessages(prev => [...prev, aiMessage]);

      // Always fetch sessions to update sidebar (order, title, etc)
      if (!currentChatId && data.session_id) {
        setCurrentChatId(data.session_id);
      }
      fetchSessions();

      // Speak response ONLY if it was voice input
      if (isVoiceInput) {
        speakText(data.response, targetLanguage);
      }

    } catch (err) {
      console.error('Text processing error:', err);
      setError(err.message || 'Something went wrong! Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteChat = async (id, e) => {
    e.stopPropagation();
    try {
      await ApiService.deleteChatSession(id);
      setChatHistory(prev => prev.filter(chat => chat.id !== id));
      if (currentChatId === id) {
        startNewChat();
      }
    } catch (err) {
      console.error("Delete yarn error:", err);
      setError("I no fit delete dis yarn.");
    }
  };

  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  const handleLogin = async (email, password) => {
    setIsProcessing(true);
    setError('');
    try {
      await ApiService.login(email, password);
      const userData = await ApiService.getMe();
      setUser(userData);
      setIsLoggedIn(true);
      setShowAuthModal(false);
      fetchSessions();
    } catch (err) {
      setError(err.message || "Email or password no correct o!");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegister = async (email, password, name) => {
    setIsProcessing(true);
    setError('');
    try {
      await ApiService.register(email, password, name);
      const userData = await ApiService.getMe();
      setUser(userData);
      setIsLoggedIn(true);
      setShowAuthModal(false);
      fetchSessions();
    } catch (err) {
      setError(err.message || "Registration fail o!");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgrade = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const { url } = await ApiService.createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      setError(err.message || "I no fit process dis payment.");
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
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            />
            <motion.div 
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 w-[85vw] max-w-80 h-screen bg-[#DCDCDC] dark:bg-slate-900 flex flex-col z-30 shadow-xl border-r border-slate-300 dark:border-white/10 transition-colors duration-500"
            >
            <div className="p-6 border-b border-slate-300/50 dark:border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 cursor-pointer" onClick={startNewChat}>
                  <img src="/logo.png" alt="Zeempo Logo" className="h-10 w-auto object-contain hover:opacity-80 transition-opacity" />
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
                >
                  <HiXMark className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={() => {
                  startNewChat();
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
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
                      onClick={() => {
                        loadChat(chat.id);
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                      }}
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
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{formatTimestamp(chat.updatedAt)}</p>
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
          </>
        )}
      </AnimatePresence>

      {/* MAIN CHAT AREA */}
      <main className={`flex-1 flex flex-col h-full bg-white dark:bg-slate-950 relative transition-all duration-500 ${sidebarOpen ? 'lg:ml-80' : ''}`}>
        
        {/* Header */}
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 border-b border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3 md:gap-4">
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
          
          <div className="flex items-center gap-2 md:gap-6">
            <div className="flex items-center gap-1 sm:gap-3 p-0.5 sm:p-1 bg-slate-100 dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200/50 dark:border-white/5">
              {['pidgin', 'swahili'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setTargetLanguage(lang)}
                  className={`px-2 sm:px-4 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
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
              className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-sm"
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
                className="text-sm sm:text-base md:text-lg text-slate-500 dark:text-slate-400 mb-8 md:mb-12 leading-relaxed px-2"
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
        <div className="px-4 md:px-8 pb-4 md:pb-8 pt-3 md:pt-4 bg-white dark:bg-slate-950 transition-colors duration-500">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendText} className="relative flex items-center gap-3">
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={targetLanguage === 'pidgin' ? "Type message..." : "Andika ujumbe..."}
                  disabled={isProcessing}
                  className="w-full pl-4 sm:pl-6 pr-14 sm:pr-16 py-4 sm:py-5 bg-slate-50 dark:bg-slate-900 rounded-[20px] sm:rounded-[24px] border border-slate-100 dark:border-white/5 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-200 dark:focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 focus:outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium text-sm sm:text-base"
                />
                
                <div className="absolute right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startListening}
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all ${
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

      {/* VOICE AGENT */}
      <VoiceAgent language={targetLanguage} />

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
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
                {authMode === 'login' ? 'Sign in to sync your yarns across devices.' : 'Join Zeempo to save your chat sessions.'}
              </p>
              
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-bold flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  {error}
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                if (authMode === 'login') {
                  handleLogin(formData.get('email'), formData.get('password'));
                } else {
                  const password = formData.get('password');
                  const confirmPassword = formData.get('confirmPassword');
                  if (password !== confirmPassword) {
                    setError('Passwords no match o! Make sure dem be the same.');
                    return;
                  }
                  handleRegister(formData.get('email'), password, formData.get('name'));
                }
              }}>
                <div className="space-y-4">
                  {authMode === 'register' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-900 dark:text-white"
                        placeholder="e.g. Oga Boss"
                      />
                    </div>
                  )}
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
                      minLength={6}
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-900 dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                  {authMode === 'register' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Confirm Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        required
                        minLength={6}
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-900 dark:text-white"
                        placeholder="••••••••"
                      />
                    </div>
                  )}
                  <div className="pt-4 space-y-3">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-4 bg-[#0a878f] text-white rounded-2xl font-bold hover:brightness-110 transition-all shadow-lg shadow-[#0a878f]/20 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? 'Yarning...' : (authMode === 'login' ? 'Sign In' : 'Sign Up')}
                    </button>
                    
                    <div className="text-center pt-2">
                      <button 
                        type="button"
                        onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        {authMode === 'login' ? "Don't get account? Join us!" : "Already get account? Sign in!"}
                      </button>
                    </div>

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
                  { label: "Pidgin / Swahili", value: "Pidgin / Swahili", icon: "🌍" },
                  { 
                    label: "Plan Type", 
                    value: user?.planType === 'pro' ? 'Zeempo Pro' : 'Free Plan', 
                    icon: "⭐", 
                    onClick: user?.planType !== 'pro' ? handleUpgrade : null,
                    highlight: user?.planType !== 'pro'
                  },
                  { label: "History", value: `${chatHistory.length} yarns saved`, icon: "📜" }
                ].map((item, i) => (
                  <div 
                    key={i} 
                    onClick={item.onClick}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${item.onClick ? 'cursor-pointer hover:border-emerald-500/30' : ''} ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'} ${item.highlight ? 'ring-2 ring-emerald-500/20' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center text-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>{item.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{item.label}</p>
                      <p className={`text-xs font-bold mt-0.5 ${item.highlight ? 'text-[#0a878f]' : 'text-emerald-600 dark:text-emerald-400'}`}>{item.value}</p>
                    </div>
                    {item.highlight && (
                      <span className="text-[10px] font-black bg-[#0a878f]/10 text-[#0a878f] px-2 py-1 rounded-full uppercase tracking-widest">Upgrade</span>
                    )}
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