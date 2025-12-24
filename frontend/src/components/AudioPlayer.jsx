/**
 * Audio Player Component
 * Handles playback of AI voice responses
 */
import React, { useRef, useEffect } from 'react';

const AudioPlayer = ({ audioBlob, autoPlay = true, onEnded }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioBlob && audioRef.current) {
      // Create URL from blob
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current.src = audioUrl;
      
      // Auto-play if enabled
      if (autoPlay) {
        audioRef.current.play().catch(err => {
          console.error('Audio playback error:', err);
          // Some browsers block autoplay, user needs to interact first
        });
      }

      // Cleanup URL when component unmounts or blob changes
      return () => {
        URL.revokeObjectURL(audioUrl);
      };
    }
  }, [audioBlob, autoPlay]);

  // Handle audio ended event
  const handleEnded = () => {
    if (onEnded) {
      onEnded();
    }
  };

  return (
    <audio 
      ref={audioRef} 
      onEnded={handleEnded}
      style={{ display: 'none' }}
      controls={false}
    />
  );
};

export default AudioPlayer;