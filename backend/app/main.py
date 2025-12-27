"""
Main FastAPI Application
Entry point for Zeempo backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routes.health import router as health_router
from app.routes.voice import router as voice_router
from app.routes.auth import router as auth_router
from app.routes.chats import router as chat_router
from app.routes.payments import router as payment_router
from app.database import get_db

settings = get_settings()

# ============================================================================
# CREATE FASTAPI APP
# ============================================================================

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Zeempo - AI Platform in Nigerian/Ghanaian Pidgin English",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ============================================================================
# CORS MIDDLEWARE
# Allows frontend to communicate with backend
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-User-Text", "X-AI-Response", "X-Processing-Time"]
)

# ============================================================================
# INCLUDE ROUTERS
# ============================================================================

app.include_router(health_router)  # Health check endpoints
app.include_router(voice_router)   # Voice API endpoints
app.include_router(auth_router)    # Auth endpoints
app.include_router(chat_router)     # Chat history endpoints
app.include_router(payment_router)  # Payments endpoints

# ============================================================================
# STARTUP & SHUTDOWN EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Run when server starts"""
    # Connect to database
    db = get_db()
    await db.connect()
    print(f"\n{'='*70}")
    print(f"🎙️  {settings.app_name} v{settings.app_version}")
    print(f"{'='*70}")
    print(f"✅ Server starting on {settings.host}:{settings.port}")
    print(f"📚 API Documentation: http://{settings.host}:{settings.port}/docs")
    print(f"🌐 CORS Origins: {', '.join(settings.cors_origins)}")
    print(f"🤖 AI Model: {settings.ai_model}")
    print(f"{'='*70}\n")


@app.on_event("shutdown")
async def shutdown_event():
    """Run when server shuts down"""
    # Disconnect from database
    db = get_db()
    await db.disconnect()
    print(f"\n{'='*70}")
    print(f"👋 {settings.app_name} shutting down...")
    print(f"{'='*70}\n")


# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )