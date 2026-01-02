"""
Voice API Routes
Main endpoints for voice-to-voice, text-to-pidgin, and pidgin-to-voice
"""
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime
import time
import io

from app.models import TextMessage, PidginResponse, TextToVoiceRequest
from app.services import get_stt_service, get_ai_service, get_tts_service
from app.utils import validate_audio_file, audio_bytes_to_io
from app.config import get_settings
from app.database import ensure_db_connection
from app.routes.auth import get_current_user
from fastapi import Depends
from typing import Optional

router = APIRouter(prefix="/api", tags=["voice"])
settings = get_settings()


# ============================================================================
# VOICE-TO-VOICE ENDPOINT - TEMPORARILY DISABLED
# This endpoint requires Speech-to-Text API which is currently disabled
# To re-enable: Uncomment the code below and ensure STT service is configured
# ============================================================================

@router.post("/voice-to-voice", response_class=StreamingResponse)
async def voice_to_voice(audio: UploadFile = File(...)):
    """
    Complete Voice-to-Voice Pipeline - TEMPORARILY DISABLED
    
    This endpoint is currently disabled. Voice input functionality will be
    re-enabled once the Speech-to-Text service is properly configured.
    
    For now, please use the /text-to-pidgin endpoint for text-based interactions.
    """
    raise HTTPException(
        status_code=503,
        detail="Voice-to-voice feature is temporarily disabled. Please use /text-to-pidgin endpoint for text-based interactions."
    )

# ============================================================================
# ORIGINAL VOICE-TO-VOICE IMPLEMENTATION (COMMENTED OUT - CAN BE RE-ENABLED)
# ============================================================================
# @router.post("/voice-to-voice", response_class=StreamingResponse)
# async def voice_to_voice(audio: UploadFile = File(...)):
#     """
#     Complete Voice-to-Voice Pipeline
#     
#     User speaks → Speech-to-Text → AI generates Pidgin → Text-to-Speech → User hears Pidgin
#     
#     Process:
#     1. Receive audio file from user
#     2. Convert speech to text (Google STT)
#     3. Generate Pidgin response (Claude AI)
#     4. Convert Pidgin to speech (ElevenLabs)
#     5. Return audio file
#     
#     Returns:
#         StreamingResponse with MP3 audio
#         Headers contain:
#         - X-User-Text: What the user said
#         - X-AI-Response: Pidgin response text
#         - X-Processing-Time: Time taken (seconds)
#     """
#     start_time = time.time()
#     
#     try:
#         # STEP 1: Validate audio file
#         is_valid, error_msg = validate_audio_file(
#             audio.content_type, 
#             audio.size, 
#             settings.max_audio_size
#         )
#         
#         if not is_valid:
#             raise HTTPException(status_code=400, detail=error_msg)
#         
#         # STEP 2: Speech-to-Text
#         stt_service = get_stt_service()
#         user_text = await stt_service.transcribe_audio_file(audio)
#         
#         if not user_text:
#             raise HTTPException(
#                 status_code=400, 
#                 detail="Abeg I no hear anything o! Try talk again, make e loud small."
#             )
#         
#         # STEP 3: Generate Pidgin Response
#         ai_service = get_ai_service()
#         pidgin_response = await ai_service.generate_pidgin_response(user_text)
#         
#         # STEP 4: Text-to-Speech
#         tts_service = get_tts_service()
#         audio_response = await tts_service.text_to_speech(pidgin_response)
#         
#         # Calculate processing time
#         processing_time = time.time() - start_time
#         
#         # STEP 5: Return audio with metadata
#         return StreamingResponse(
#             io.BytesIO(audio_response),
#             media_type="audio/mpeg",
#             headers={
#                 "X-User-Text": user_text,
#                 "X-AI-Response": pidgin_response,
#                 "X-Processing-Time": str(processing_time),
#                 "Access-Control-Expose-Headers": "X-User-Text, X-AI-Response, X-Processing-Time"
#             }
#         )
#         
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=500, 
#             detail=f"Wahala dey o! Something no work: {str(e)}"
#         )


@router.post("/text-to-pidgin", response_model=PidginResponse)
async def text_to_pidgin(
    message: TextMessage, 
    session_id: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """
    Convert Text to Pidgin Response with History Persistence
    """
    start_time = time.time()
    db = await ensure_db_connection()
    
    try:
        # 1. Handle Session
        if not session_id:
            # Create a new session if none provided
            session = await db.chatsession.create(
                data={
                    "title": message.message[:30] + "...",
                    "userId": current_user.id,
                    "language": message.language
                }
            )
            session_id = session.id
        else:
            # Verify session belongs to user
            session = await db.chatsession.find_unique(where={"id": session_id})
            if not session or session.userId != current_user.id:
                raise HTTPException(status_code=404, detail="Yarn session no dey!")

        # 2. Save User Message
        await db.chatmessage.create(
            data={
                "role": "user",
                "content": message.message,
                "sessionId": session_id
            }
        )

        # 3. Generate AI response
        ai_service = get_ai_service()
        ai_response = await ai_service.generate_ai_response(
            message.message, 
            language=message.language
        )
        
        # 4. Save AI Response
        await db.chatmessage.create(
            data={
                "role": "assistant",
                "content": ai_response,
                "sessionId": session_id
            }
        )
        
        # Update session timestamp
        await db.chatsession.update(
            where={"id": session_id},
            data={"updatedAt": datetime.now()}
        )
        
        processing_time = time.time() - start_time
        
        return PidginResponse(
            response=ai_response,
            language=message.language,
            processing_time=processing_time,
            session_id=session_id # Need to update PidginResponse model
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI no work o: {str(e)}"
        )


# ============================================================================
# VOICE ENDPOINTS - TEMPORARILY DISABLED
# These endpoints require Text-to-Speech service which is currently disabled
# To re-enable: Uncomment the code below and ensure TTS service is configured
# ============================================================================

@router.post("/pidgin-to-voice", response_class=StreamingResponse)
async def pidgin_to_voice(request: TextToVoiceRequest):
    """
    Convert Pidgin Text to Voice - TEMPORARILY DISABLED
    
    This endpoint is currently disabled. Voice output functionality will be
    re-enabled once the Text-to-Speech service is properly configured.
    """
    raise HTTPException(
        status_code=503,
        detail="Voice output feature is temporarily disabled. Text-to-Pidgin functionality is still available."
    )


@router.get("/voices")
async def get_voices():
    """
    Get Available Voices - TEMPORARILY DISABLED
    
    This endpoint is currently disabled along with voice functionality.
    """
    raise HTTPException(
        status_code=503,
        detail="Voice features are temporarily disabled."
    )


# ============================================================================
# CUSTOM LLM ENDPOINT FOR ELEVENLABS
# ============================================================================

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from fastapi.responses import StreamingResponse
import json

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    messages: List[ChatMessage]
    model: str
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1000
    stream: Optional[bool] = False
    # ElevenLabs might send extra fields, so we allow extra
    class Config:
        extra = "allow"

@router.post("/v1/chat/completions")
async def custom_llm_chat(request: ChatCompletionRequest):
    """
    Custom LLM Endpoint for ElevenLabs
    
    Acts as a proxy between ElevenLabs and Groq (or any other LLM).
    Accepts OpenAI-format chat completion requests and streams back the response.
    """
    ai_service = get_ai_service()
    
    # Convert Pydantic models to dicts for the service
    messages_dicts = [{"role": msg.role, "content": msg.content} for msg in request.messages]
    
    # If the system prompt isn't in the messages (ElevenLabs might control this), 
    # we can inject our persona here if needed. 
    # For now, we assume ElevenLabs sends the full context or we rely on the service to prepend it.
    # However, existing service prepends it based on 'language' arg which we don't have here easily.
    # We will rely on ElevenLabs System Prompt configuration OR inject a default if missing.
    
    # Check if system prompt exists
    has_system = any(msg["role"] == "system" for msg in messages_dicts)
    if not has_system:
        # Default to Pidgin if no system prompt provided
        from app.config import PIDGIN_SYSTEM_PROMPT
        messages_dicts.insert(0, {"role": "system", "content": PIDGIN_SYSTEM_PROMPT})

    async def event_generator():
        stream = ai_service.generate_ai_response_stream(messages_dicts)
        
        async for content in stream:
            # Format as OpenAI Stream Response
            chunk_data = {
                "id": "chatcmpl-123",
                "object": "chat.completion.chunk",
                "created": int(time.time()),
                "model": request.model,
                "choices": [
                    {
                        "index": 0,
                        "delta": {"content": content},
                        "finish_reason": None
                    }
                ]
            }
            yield f"data: {json.dumps(chunk_data)}\n\n"
            
        # Send [DONE] message
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# ============================================================================
# ORIGINAL VOICE ENDPOINTS (COMMENTED OUT - CAN BE RE-ENABLED)
# ============================================================================
# @router.post("/pidgin-to-voice", response_class=StreamingResponse)
# async def pidgin_to_voice(request: TextToVoiceRequest):
#     """
#     Convert Pidgin Text to Voice
#     
#     Takes Pidgin text and converts it to speech audio
#     
#     Args:
#         request: TextToVoiceRequest with text and optional voice_id
#         
#     Returns:
#         StreamingResponse with MP3 audio
#     """
#     try:
#         tts_service = get_tts_service()
#         audio_data = await tts_service.text_to_speech(
#             request.text, 
#             request.voice_id
#         )
#         
#         return StreamingResponse(
#             io.BytesIO(audio_data),
#             media_type="audio/mpeg"
#         )
#         
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Voice no come out: {str(e)}"
#         )
#
#
# @router.get("/voices")
# async def get_voices():
#     """
#     Get Available Voices
#     
#     Fetches list of available voices from ElevenLabs
#     Useful for letting users choose different voice styles
#     
#     Returns:
#         JSON with list of available voices
#     """
#     try:
#         tts_service = get_tts_service()
#         voices = await tts_service.get_available_voices()
#         
#         return {
#             "voices": voices,
#             "count": len(voices),
#             "note": "Use voice_id from this list in pidgin-to-voice endpoint"
#         }
#         
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Cannot fetch voices: {str(e)}"
#         )