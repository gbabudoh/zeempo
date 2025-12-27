"""
Authentication Routes
Endpoints for user registration and login
"""
from fastapi import APIRouter, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models import UserRegister, UserLogin, Token, UserResponse, ErrorResponse
from app.services.auth_service import get_auth_service
from app.database import ensure_db_connection
from app.config import get_settings
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["auth"])
auth_scheme = HTTPBearer()
settings = get_settings()

async def get_current_user(token: HTTPAuthorizationCredentials = Security(auth_scheme)):
    """Dependency to get the current authenticated user"""
    auth_service = get_auth_service()
    payload = auth_service.verify_token(token.credentials)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    db = await ensure_db_connection()
    user = await db.user.find_unique(where={"id": payload.get("sub")})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user

@router.post("/register", response_model=Token, responses={400: {"model": ErrorResponse}})
async def register(user_data: UserRegister):
    """Register a new user"""
    db = await ensure_db_connection()
    auth_service = get_auth_service()
    
    # Check if user already exists
    existing_user = await db.user.find_unique(where={"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Dis email don already get owner o!")
    
    # Create new user
    hashed_password = auth_service.get_password_hash(user_data.password)
    user = await db.user.create(
        data={
            "email": user_data.email,
            "password": hashed_password,
            "name": user_data.name,
            "avatar": user_data.avatar
        }
    )
    
    # Create token
    access_token = auth_service.create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token, responses={401: {"model": ErrorResponse}})
async def login(login_data: UserLogin):
    """Authenticates a user and returns a token"""
    db = await ensure_db_connection()
    auth_service = get_auth_service()
    
    user = await db.user.find_unique(where={"email": login_data.email})
    if not user or not auth_service.verify_password(login_data.password, user.password):
        raise HTTPException(status_code=401, detail="Email or password no correct o!")
    
    # Create token
    access_token = auth_service.create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user = Depends(get_current_user)):
    """Get the current user's profile"""
    return current_user
