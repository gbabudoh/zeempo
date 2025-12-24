import React, { useRef, useEffect } from 'react';

const ChatHistory = ({ messages }) => {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      {messages.map((msg, idx) => {
        const isUser = msg.type === 'user';
        return (
          <div
            key={idx}
            className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm
                ${isUser ? 'bg-primary-600 text-white' : 'bg-dark-surface border border-dark-border text-primary-400'}`}>
                {isUser ? '👤' : '🤖'}
              </div>

              {/* Message Bubble */}
              <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`
                  px-5 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm
                  ${isUser 
                    ? 'bg-primary-600 text-white rounded-tr-sm' 
                    : 'bg-dark-surface border border-dark-border text-slate-200 rounded-tl-sm'}
                `}>
                  {msg.text}
                </div>
                
                {/* Time */}
                <span className="text-[10px] text-slate-500 mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatHistory;