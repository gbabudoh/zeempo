"""
Health Check Routes
Simple endpoints to verify service is running
"""
from fastapi import APIRouter
from app.models import HealthResponse
from app.config import get_settings

router = APIRouter(tags=["health"])
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    
    Returns service status and version information
    Use this to verify the API is running correctly
    
    Returns:
        HealthResponse with status, service name, and version
    """
    return HealthResponse(
        status="healthy",
        service=settings.app_name,
        version=settings.app_version
    )


@router.get("/")
async def root():
    """
    Root endpoint - Welcome message and API info
    
    Returns basic information about the API and available endpoints
    """
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "message": "Welcome to Zeempo! E don set! 🎙️",
        "description": "AI platform for Nigerian/Ghanaian Pidgin English",
        "endpoints": {
            "GET /health": "Health check",
            "POST /api/voice-to-voice": "Voice input → Voice output in Pidgin",
            "POST /api/text-to-pidgin": "Text input → Pidgin text response",
            "POST /api/pidgin-to-voice": "Pidgin text → Voice output",
            "GET /api/voices": "List available voices",
            "GET /docs": "Interactive API documentation",
            "GET /redoc": "API documentation (ReDoc style)"
        },
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        },
        "status": "🟢 Running"
    }