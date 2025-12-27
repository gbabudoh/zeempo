/**
 * API Service for Vite/React
 * Handles all communication with the backend API
 */

// Vite uses import.meta.env instead of process.env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('zeempo-token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('zeempo-token', token);
    } else {
      localStorage.removeItem('zeempo-token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * Auth: Register a new user
   */
  async register(email, password, name = '', avatar = '👤') {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, avatar }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    const data = await response.json();
    this.setToken(data.access_token);
    return data;
  }

  /**
   * Auth: Login
   */
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    this.setToken(data.access_token);
    return data;
  }

  /**
   * Auth: Get current user
   */
  async getMe() {
    if (!this.token) return null;
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      this.setToken(null);
      return null;
    }

    return await response.json();
  }

  /**
   * Chat: Get all sessions
   */
  async getChatSessions() {
    const response = await fetch(`${API_BASE_URL}/api/chats`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch yarns');
    }

    return await response.json();
  }

  /**
   * Chat: Get session history
   */
  async getChatHistory(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/chats/${sessionId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch yarn history');
    }

    return await response.json();
  }

  /**
   * Payment: Create Stripe checkout session
   */
  async createCheckoutSession() {
    const response = await fetch(`${API_BASE_URL}/api/payments/create-checkout`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create checkout session');
    }

    return await response.json();
  }

  /**
   * Chat: Delete session
   */
  async deleteChatSession(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/chats/${sessionId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete yarn');
    }

    return await response.json();
  }

  /**
   * Voice-to-Voice: Send audio and get audio response
   */
  async voiceToVoice(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/voice-to-voice`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Voice processing failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
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
  async textToPidgin(message, language = 'pidgin', sessionId = null) {
    const url = sessionId 
      ? `${API_BASE_URL}/api/text-to-pidgin?session_id=${sessionId}`
      : `${API_BASE_URL}/api/text-to-pidgin`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
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
      headers: this.getHeaders(),
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
    const response = await fetch(`${API_BASE_URL}/api/voices`, {
      headers: this.getHeaders(),
    });

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