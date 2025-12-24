"""
AI Service - Using Groq (Free and Fast!)
Handles Pidgin English response generation using Groq API
"""
import httpx
import os
from app.config import get_settings, PIDGIN_SYSTEM_PROMPT
from typing import List, Dict

settings = get_settings()


class AIService:
    """
    AI service using Groq
    Generates Pidgin English responses from user input
    """
    
    def __init__(self):
        self.api_key = settings.groq_api_key
        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable not set")
            
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "openai/gpt-oss-120b"  # Using the working model
        self.max_tokens = settings.max_tokens if hasattr(settings, 'max_tokens') else 1000
    
    async def generate_pidgin_response(
        self, 
        user_message: str, 
        conversation_history: List[Dict] = None
    ) -> str:
        """
        Generate Pidgin English response using Groq
        
        Args:
            user_message: User's input message (in any language)
            conversation_history: Previous conversation messages (optional)
                                Format: [{"role": "user", "content": "..."}, ...]
            
        Returns:
            Pidgin English response string
            
        Raises:
            ValueError: If API key not configured
            Exception: If API call fails
        """
        # Prepare messages list
        messages = [
            {"role": "system", "content": PIDGIN_SYSTEM_PROMPT}
        ]
        
        # Add conversation history if provided
        if conversation_history:
            messages.extend(conversation_history)
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Call Groq API
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "max_tokens": self.max_tokens,
                        "temperature": 0.7  # Slightly creative
                    }
                )
                
                if response.status_code != 200:
                    raise Exception(f"Groq API Error: {response.text}")
                
                result = response.json()
                pidgin_response = result["choices"][0]["message"]["content"]
                return pidgin_response.strip()
                
        except Exception as e:
            raise Exception(f"AI Service Error: {str(e)}")
    
    def generate_pidgin_response_sync(
        self, 
        user_message: str, 
        conversation_history: List[Dict] = None
    ) -> str:
        """
        Synchronous version of generate_pidgin_response
        Use this in non-async contexts
        
        Args:
            user_message: User's input message
            conversation_history: Previous messages (optional)
            
        Returns:
            Pidgin English response
        """
        # Prepare messages
        messages = [
            {"role": "system", "content": PIDGIN_SYSTEM_PROMPT}
        ]
        
        if conversation_history:
            messages.extend(conversation_history)
        
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Call Groq API (synchronous)
        try:
            import requests
            
            response = requests.post(
                self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": self.max_tokens,
                    "temperature": 0.7
                },
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"Groq API Error: {response.text}")
            
            result = response.json()
            pidgin_response = result["choices"][0]["message"]["content"]
            return pidgin_response.strip()
            
        except Exception as e:
            raise Exception(f"AI Service Error: {str(e)}")


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_ai_service = None

def get_ai_service() -> AIService:
    """
    Get AI service singleton instance
    Creates instance on first call, reuses afterwards
    """
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service