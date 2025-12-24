import React from 'react';

const Sidebar = () => {
  return (
    <div className="hidden md:flex flex-col w-64 bg-dark-surface border-r border-dark-border h-screen p-4">
      <div className="flex items-center gap-2 mb-8 px-2">
        <span className="text-2xl">🎙️</span>
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
          Zeempo
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
          Recent Chats
        </div>
        {/* Mock History Items */}
        <div className="space-y-2">
          <button className="w-full text-left p-2 rounded-lg hover:bg-white/5 text-sm text-slate-300 transition-colors">
            How far now?
          </button>
          <button className="w-full text-left p-2 rounded-lg hover:bg-white/5 text-sm text-slate-300 transition-colors">
            Explain markets for Lagos
          </button>
          <button className="w-full text-left p-2 rounded-lg hover:bg-white/5 text-sm text-slate-300 transition-colors">
            Translate this for me
          </button>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-dark-border">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold">
            JD
          </div>
          <div className="text-sm">
            <p className="font-medium text-slate-200">John Doe</p>
            <p className="text-xs text-slate-500">Free Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
