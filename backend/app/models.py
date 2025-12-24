"""
Pydantic Models
Data validation and serialization models for API requests/responses
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ============================================================================
# REQUEST MODELS
# ============================================================================

class TextMessage(BaseModel):
    """Text message input from user"""
    message: str = Field(..., min_length=1, max_length=1000, description="User's text message")


class TextToVoiceRequest(BaseModel):
    """Request to convert text to voice"""
    text: str = Field(..., min_length=1, max_length=5000, description="Text to convert to speech")
    voice_id: Optional[str] = Field(None, description="ElevenLabs voice ID (optional)")


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class PidginResponse(BaseModel):
    """Pidgin text response from AI"""
    response: str = Field(..., description="Pidgin English response")
    processing_time: Optional[float] = Field(None, description="Time taken to process (seconds)")


class VoiceToVoiceResponse(BaseModel):
    """Response from voice-to-voice endpoint"""
    user_text: str = Field(..., description="What user said (transcribed)")
    ai_response: str = Field(..., description="AI's Pidgin response")
    audio_url: Optional[str] = Field(None, description="URL to audio file")
    processing_time: float = Field(..., description="Total processing time")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")
    timestamp: datetime = Field(default_factory=datetime.now, description="Current timestamp")


class ErrorResponse(BaseModel):
    """Error response"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp")


# ============================================================================
# CONVERSATION MODELS
# ============================================================================

class ConversationMessage(BaseModel):
    """Single message in conversation"""
    role: str = Field(..., pattern="^(user|assistant)$", description="Message sender role")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.now, description="Message timestamp")


class ConversationHistory(BaseModel):
    """Complete conversation history"""
    messages: List[ConversationMessage] = Field(default=[], description="List of messages")
    
    def add_message(self, role: str, content: str):
        """Add a message to history"""
        self.messages.append(ConversationMessage(role=role, content=content))
    
    def to_anthropic_format(self) -> List[dict]:
        """Convert to Anthropic API format"""
        return [{"role": msg.role, "content": msg.content} for msg in self.messages]