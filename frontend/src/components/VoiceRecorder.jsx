import React, { useState, useRef, useEffect } from 'react';

const VoiceRecorder = ({ onRecordingComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000
        } 
      });
      
      streamRef.current = stream;
      const mimeType = 'audio/webm;codecs=opus';
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        onRecordingComplete(audioBlob);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        setRecordingTime(0);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Microphone access error:', err);
      // In a real app we would use a toast here
      alert('Abeg enable microphone make we yarn!');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`
          relative group flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300
          ${isRecording ? 'bg-red-500 hover:bg-red-600 scale-110' : 'bg-primary-600 hover:bg-primary-500'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer shadow-lg hover:shadow-primary-500/50'}
        `}
      >
        {/* Pulse Effect */}
        {isRecording && (
           <span className="absolute w-full h-full rounded-full bg-red-500 animate-ping opacity-75"></span>
        )}
        
        <span className="text-2xl z-10 relative">
          {isProcessing ? '⏳' : (isRecording ? '⏹️' : '🎙️')}
        </span>
      </button>

      {/* Timer / Status */}
      <div className="mt-2 h-6 flex items-center justify-center">
        {isRecording && (
          <span className="text-xs font-mono text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded-full animate-pulse">
            {formatTime(recordingTime)}
          </span>
        )}
        {isProcessing && (
           <span className="text-xs text-primary-300 animate-pulse">
             Processing... This fit take small time.
           </span>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;