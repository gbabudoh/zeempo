"""
Speech-to-Text Service
Handles audio transcription using Google Cloud Speech-to-Text API
Supports Nigerian and Ghanaian English accents
"""
import base64
import json
import httpx
from app.config import get_settings

settings = get_settings()


class STTService:
    """
    Speech-to-Text service using Google Cloud
    Converts audio files to text with Nigerian/Ghanaian accent support
    """
    
    def __init__(self):
        self.api_key = settings.google_cloud_api_key
        self.base_url = "https://speech.googleapis.com/v1/speech:recognize"
    
    async def transcribe_audio(
        self, 
        audio_data: bytes, 
        encoding: str = "WEBM_OPUS",
        sample_rate: int = 48000
    ) -> str:
        """
        Transcribe audio to text
        
        Args:
            audio_data: Audio file as bytes
            encoding: Audio encoding format (WEBM_OPUS, MP3, LINEAR16, etc.)
            sample_rate: Sample rate in Hz (8000-48000)
            
        Returns:
            Transcribed text string
            
        Raises:
            ValueError: If API key not configured
            Exception: If API call fails
        """
        if not self.api_key:
            raise ValueError("Google Cloud API key not configured. Set GOOGLE_CLOUD_API_KEY in .env")
        
        # Convert audio to base64 for API
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        # Prepare API request payload
        payload = {
            "config": {
                "encoding": encoding,
                "sampleRateHertz": sample_rate,
                "languageCode": "en-NG",  # Nigerian English (primary)
                "alternativeLanguageCodes": ["en-GH", "en-US"],  # Ghanaian, US fallback
                "enableAutomaticPunctuation": True,
                "model": "default",
                "useEnhanced": True  # Better quality
            },
            "audio": {
                "content": audio_base64
            }
        }
        
        # Make API request
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}?key={self.api_key}",
                json=payload
            )
            
            if response.status_code != 200:
                # Try to parse error response for better error messages
                error_message = self._parse_api_error(response)
                raise Exception(error_message)
            
            result = response.json()
            
            # Extract transcript from response
            if not result.get("results"):
                return ""  # No speech detected
            
            transcript = result["results"][0]["alternatives"][0]["transcript"]
            return transcript.strip()
    
    def _parse_api_error(self, response: httpx.Response) -> str:
        """
        Parse Google API error response and return user-friendly error message
        
        Args:
            response: HTTP response object with error
            
        Returns:
            Formatted error message string
        """
        try:
            error_data = response.json()
            
            # Check if it's a Google API error structure
            if "error" in error_data:
                error_info = error_data["error"]
                error_code = error_info.get("code")
                error_status = error_info.get("status", "")
                error_message = error_info.get("message", "")
                
                # Check for API disabled error
                if error_code == 403 and error_status == "PERMISSION_DENIED":
                    # Look for SERVICE_DISABLED in details
                    details = error_info.get("details", [])
                    activation_url = None
                    
                    for detail in details:
                        if detail.get("@type") == "type.googleapis.com/google.rpc.ErrorInfo":
                            if detail.get("reason") == "SERVICE_DISABLED":
                                metadata = detail.get("metadata", {})
                                activation_url = metadata.get("activationUrl")
                                break
                    
                    if activation_url:
                        return (
                            f"Google Cloud Speech-to-Text API is not enabled for your project. "
                            f"Please enable it by visiting: {activation_url}\n\n"
                            f"After enabling, wait a few minutes for the changes to take effect, then try again."
                        )
                    else:
                        return (
                            f"Google Cloud Speech-to-Text API Error: {error_message}\n\n"
                            f"Please check your API key and ensure the Speech-to-Text API is enabled "
                            f"in your Google Cloud Console."
                        )
                
                # Other permission errors
                if error_code == 403:
                    return (
                        f"Permission denied: {error_message}\n\n"
                        f"Please check your Google Cloud API key and ensure it has the necessary permissions."
                    )
                
                # API key errors
                if error_code == 400 and "API key" in error_message:
                    return (
                        f"Invalid API key: {error_message}\n\n"
                        f"Please check your GOOGLE_CLOUD_API_KEY in your .env file."
                    )
                
                # Return formatted error message
                return f"Google STT API Error ({error_code}): {error_message}"
            
        except (json.JSONDecodeError, KeyError, AttributeError):
            # If we can't parse the error, return the raw response
            pass
        
        # Fallback to raw response text
        return f"Google STT API Error: {response.text}"
    
    async def transcribe_audio_file(self, audio_file) -> str:
        """
        Transcribe uploaded audio file (FastAPI UploadFile)
        
        Args:
            audio_file: FastAPI UploadFile object
            
        Returns:
            Transcribed text
        """
        # Read audio data
        audio_data = await audio_file.read()
        
        # Detect encoding from content type
        content_type = audio_file.content_type or ""
        
        if "webm" in content_type:
            encoding = "WEBM_OPUS"
            sample_rate = 48000
        elif "mp3" in content_type or "mpeg" in content_type:
            encoding = "MP3"
            sample_rate = 44100
        elif "wav" in content_type:
            encoding = "LINEAR16"
            sample_rate = 16000
        elif "ogg" in content_type:
            encoding = "OGG_OPUS"
            sample_rate = 48000
        else:
            # Default to WEBM (most common from browsers)
            encoding = "WEBM_OPUS"
            sample_rate = 48000
        
        return await self.transcribe_audio(audio_data, encoding, sample_rate)


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_stt_service = None

def get_stt_service() -> STTService:
    """
    Get STT service singleton instance
    Creates instance on first call, reuses afterwards
    """
    global _stt_service
    if _stt_service is None:
        _stt_service = STTService()
    return _stt_service