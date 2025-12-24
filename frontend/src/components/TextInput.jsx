import React, { useState } from 'react';

const TextInput = ({ onSendMessage, isProcessing }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() && !isProcessing) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
      <div className="flex-1 relative">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type 'How far?' or message here..."
          className="w-full bg-dark-bg text-slate-200 placeholder-slate-500 rounded-xl px-4 py-3 pr-12 border border-dark-border focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all outline-none"
          disabled={isProcessing}
          maxLength={500}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">
          {inputText.length > 0 && `${inputText.length}/500`}
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isProcessing || !inputText.trim()}
        className={`
          flex items-center justify-center w-12 h-12 rounded-xl transition-all
          ${!inputText.trim() || isProcessing 
            ? 'bg-dark-surface text-slate-600 cursor-not-allowed' 
            : 'bg-primary-600 text-white hover:bg-primary-500 shadow-lg'}
        `}
      >
        {isProcessing ? '...' : '➤'}
      </button>
    </form>
  );
};

export default TextInput;