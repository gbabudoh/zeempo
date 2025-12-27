/**
 * API Service for Vite/React
 * Handles all communication with the backend API
 */

// Vite uses import.meta.env instead of process.env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  /**
   * Voice-to-Voice: Send audio and get audio response
   * NOTE: This endpoint is temporarily disabled
   */
  async voiceToVoice(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch(`${API_BASE_URL}/api/voice-to-voice`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      // Try to parse JSON error first (for 503 Service Unavailable)
      let errorMessage = 'Voice processing failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // If not JSON, try text
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return {
      audioBlob: await response.blob(),
      userText: response.headers.get('X-User-Text') || '',
      aiResponse: response.headers.get('X-AI-Response') || '',
      processingTime: parseFloat(response.headers.get('X-Processing-Time') || '0'),
    };
  }

  /**
   * Text-to-Pidgin: Convert text message to Pidgin/Swahili response
   */
  async textToPidgin(message, language = 'pidgin') {
    const response = await fetch(`${API_BASE_URL}/api/text-to-pidgin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, language }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get response');
    }

    return await response.json();
  }

  /**
   * Pidgin-to-Voice: Convert text to voice audio
   */
  async pidginToVoice(text, voiceId = null) {
    const response = await fetch(`${API_BASE_URL}/api/pidgin-to-voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, voice_id: voiceId }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate voice');
    }

    return await response.blob();
  }

  /**
   * Get available voices from ElevenLabs
   */
  async getVoices() {
    const response = await fetch(`${API_BASE_URL}/api/voices`);

    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }

    return await response.json();
  }

  /**
   * Health check
   */
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await response.json();
  }
}

export default new ApiService();