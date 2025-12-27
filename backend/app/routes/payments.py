from fastapi import APIRouter, Depends, HTTPException, Request, Header
from app.services.auth_service import get_current_user
from app.services.stripe_service import StripeService
from pydantic import BaseModel

router = APIRouter(prefix="/api/payments", tags=["payments"])

class CheckoutResponse(BaseModel):
    url: str

@router.post("/create-checkout", response_model=CheckoutResponse)
async def create_checkout(current_user=Depends(get_current_user)):
    """Creates a Stripe Checkout session for the current user"""
    try:
        session = await StripeService.create_checkout_session(
            current_user.id, current_user.email
        )
        return CheckoutResponse(url=session.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Stripe webhook endpoint"""
    payload = await request.body()
    try:
        await StripeService.handle_webhook(payload, stripe_signature)
        return {"status": "success"}
    except Exception as e:
        print(f"Webhook Error: {e}")
        raise HTTPException(status_code=400, detail="Webhook Error")
