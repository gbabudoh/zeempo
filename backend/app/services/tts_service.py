"""
Text-to-Speech Service
Handles voice synthesis using ElevenLabs API
Converts Pidgin text to natural Nigerian/Ghanaian voice
"""
import httpx
from app.config import get_settings

settings = get_settings()


class TTSService:
    """
    Text-to-Speech service using ElevenLabs
    Converts text to natural-sounding voice audio
    """
    
    def __init__(self):
        self.api_key = settings.elevenlabs_api_key
        self.default_voice_id = settings.elevenlabs_voice_id
        self.base_url = "https://api.elevenlabs.io/v1"
    
    async def text_to_speech(
        self, 
        text: str, 
        voice_id: str = None,
        stability: float = 0.5,
        similarity_boost: float = 0.75
    ) -> bytes:
        """
        Convert text to speech audio
        
        Args:
            text: Text to convert to speech (Pidgin English)
            voice_id: ElevenLabs voice ID (uses default if not provided)
            stability: Voice stability (0.0-1.0, higher = more stable/consistent)
            similarity_boost: Voice similarity (0.0-1.0, higher = more similar to original)
            
        Returns:
            Audio data as bytes (MP3 format)
            
        Raises:
            ValueError: If API key not configured
            Exception: If API call fails
        """
        if not self.api_key:
            raise ValueError("ElevenLabs API key not configured. Set ELEVENLABS_API_KEY in .env")
        
        # Use default voice if not specified
        if not voice_id:
            voice_id = self.default_voice_id
        
        # API endpoint
        url = f"{self.base_url}/text-to-speech/{voice_id}"
        
        # Request headers
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }
        
        # Request payload
        payload = {
            "text": text,
            "model_id": "eleven_monolingual_v1",  # English model
            "voice_settings": {
                "stability": stability,
                "similarity_boost": similarity_boost
            }
        }
        
        # Make API request
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            
            if response.status_code != 200:
                raise Exception(f"ElevenLabs TTS API Error: {response.text}")
            
            # Return MP3 audio data
            return response.content
    
    async def get_available_voices(self) -> list:
        """
        Get list of available voices from ElevenLabs
        Useful for letting users choose different voices
        
        Returns:
            List of voice objects with id, name, etc.
            
        Raises:
            ValueError: If API key not configured
            Exception: If API call fails
        """
        if not self.api_key:
            raise ValueError("ElevenLabs API key not configured")
        
        url = f"{self.base_url}/voices"
        
        headers = {
            "xi-api-key": self.api_key
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code != 200:
                raise Exception(f"Failed to fetch voices: {response.text}")
            
            data = response.json()
            return data.get("voices", [])
    
    async def get_voice_settings(self, voice_id: str = None) -> dict:
        """
        Get voice settings for a specific voice
        
        Args:
            voice_id: Voice ID to get settings for (uses default if not provided)
            
        Returns:
            Dictionary with voice settings
        """
        if not voice_id:
            voice_id = self.default_voice_id
        
        url = f"{self.base_url}/voices/{voice_id}/settings"
        
        headers = {
            "xi-api-key": self.api_key
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code != 200:
                raise Exception(f"Failed to fetch voice settings: {response.text}")
            
            return response.json()


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_tts_service = None

def get_tts_service() -> TTSService:
    """
    Get TTS service singleton instance
    Creates instance on first call, reuses afterwards
    """
    global _tts_service
    if _tts_service is None:
        _tts_service = TTSService()
    return _tts_service