import React, { useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid';

export function VoiceAgent({ language = 'pidgin' }) {
  // Select the correct agent ID based on language
  const pidginAgentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID_PIDGIN;
  const swahiliAgentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID_SWAHILI;
  const activeAgentId = language === 'swahili' ? swahiliAgentId : pidginAgentId;
  const conversation = useConversation({
    onConnect: () => console.log('Connected to ElevenLabs'),
    onDisconnect: () => {
        console.log('Disconnected from ElevenLabs');
    },
    onMessage: (message) => console.log('Message:', message),
    onError: (error) => console.error('Error:', error),
  });

  const { status } = conversation;

  const toggleConversation = useCallback(async () => {
    if (status === 'connected') {
      await conversation.endSession();
    } else {
      try {
        console.log("Attempting to connect with Agent ID:", activeAgentId);

        if (!activeAgentId) {
          alert('Agent ID is missing! Check your .env.local file.');
          return;
        }

        // Request mic permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Connect to agent
        await conversation.startSession({
          agentId: activeAgentId, 
        });
      } catch (error) {
        console.error('Failed to start conversation:', error);
        
        // Log detailed websocket closure info if available
        if (error?.code || error?.reason) {
            console.error(`WebSocket Closed: Code ${error.code}, Reason: ${error.reason}`);
        }
        
        alert(`Connection Failed: ${error.message || 'Check console for details'}. Ensure Agent ID is correct and Server is running.`);
      }
    }
  }, [conversation, status, activeAgentId]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
        {status === 'connected' && (
           <div 
             className="mb-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-4 w-72 border border-zinc-200 dark:border-zinc-700 transform transition-all duration-300 ease-in-out"
           >
             <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                        {status === 'connected' ? 'Listening...' : 'Connecting...'}
                    </span>
                </div>
                <button onClick={toggleConversation} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full cursor-pointer">
                    <StopIcon className="w-5 h-5 text-red-500" />
                </button>
             </div>
             
             <div className="h-16 flex items-center justify-center gap-1 bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden">
                {/* Visualizer Simulation */}
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="w-2 bg-indigo-500 rounded-full animate-pulse"
                        style={{ height: '20px', animationDelay: `${i * 0.1}s` }}
                    />
                ))}
             </div>
           </div>
        )}

      <button
        onClick={toggleConversation}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-colors transform hover:scale-105 active:scale-95 duration-200 cursor-pointer ${
            status === 'connected' 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {status === 'connected' ? (
            <StopIcon className="w-7 h-7 text-white" />
        ) : (
            <MicrophoneIcon className="w-7 h-7 text-white" />
        )}
      </button>
    </div>
  );
}
