"""
Chat History Routes
Endpoints for managing chat sessions and messages
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models import ConversationMessage, ErrorResponse
from app.routes.auth import get_current_user
from app.database import ensure_db_connection
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/api/chats", tags=["chats"])

class ChatSessionResponse(BaseModel):
    id: str
    title: str
    language: str
    updatedAt: datetime

class ChatHistoryResponse(BaseModel):
    id: str
    messages: List[ConversationMessage]

@router.get("", response_model=List[ChatSessionResponse])
async def get_sessions(current_user = Depends(get_current_user)):
    """Get all chat sessions for the current user"""
    db = await ensure_db_connection()
    sessions = await db.chatsession.find_many(
        where={"userId": current_user.id},
        order={"updatedAt": "desc"}
    )
    return sessions

@router.get("/{session_id}", response_model=ChatHistoryResponse)
async def get_history(session_id: str, current_user = Depends(get_current_user)):
    """Get message history for a specific session"""
    db = await ensure_db_connection()
    
    # Ensure session exists and belongs to user
    session = await db.chatsession.find_unique(
        where={"id": session_id},
        include={"messages": {"order_by": {"timestamp": "asc"}}}
    )
    
    if not session or session.userId != current_user.id:
        raise HTTPException(status_code=404, detail="Chat no exist o!")
        
    return {
        "id": session.id,
        "messages": [
            ConversationMessage(
                role=msg.role,
                content=msg.content,
                timestamp=msg.timestamp
            ) for msg in session.messages
        ]
    }

@router.delete("/{session_id}")
async def delete_session(session_id: str, current_user = Depends(get_current_user)):
    """Delete a chat session"""
    db = await ensure_db_connection()
    
    # Ensure session exists and belongs to user
    session = await db.chatsession.find_unique(where={"id": session_id})
    if not session or session.userId != current_user.id:
        raise HTTPException(status_code=404, detail="I no fit find the yarn to delete.")
        
    await db.chatsession.delete(where={"id": session_id})
    return {"status": "success", "message": "Yarn don go!"}
