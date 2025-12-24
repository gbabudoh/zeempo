import React from 'react';

const ErrorMessage = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
      <div className="bg-red-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
        <span className="text-xl">⚠️</span>
        <div className="flex flex-col">
          <span className="text-xs font-bold opacity-75 uppercase tracking-wide">Wahala dey o!</span>
          <span className="text-sm font-medium">{error}</span>
        </div>
        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="ml-2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-xs"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;