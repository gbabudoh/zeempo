import stripe
from app.config import get_settings
from app.database import get_db

settings = get_settings()
stripe.api_key = settings.stripe_secret_key

class StripeService:
    @staticmethod
    async def create_checkout_session(user_id: str, email: str):
        """Creates a Stripe Checkout Session for a subscription"""
        try:
            # Check if user already has a Stripe Customer ID
            db = get_db().client
            user = await db.user.find_unique(where={"id": user_id})
            
            customer_id = user.stripeCustomerId
            if not customer_id:
                # Create a new customer in Stripe
                customer = stripe.Customer.create(
                    email=email,
                    metadata={"user_id": user_id}
                )
                customer_id = customer.id
                # Update user with stripe customer ID
                await db.user.update(
                    where={"id": user_id},
                    data={"stripeCustomerId": customer_id}
                )

            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': settings.stripe_price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url="http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
                cancel_url="http://localhost:5173/settings",
                metadata={"user_id": user_id}
            )
            return session
        except Exception as e:
            print(f"Stripe Session Error: {e}")
            raise e

    @staticmethod
    async def handle_webhook(payload: bytes, sig_header: str):
        """Handles Stripe webhooks"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.stripe_webhook_secret
            )
        except ValueError as e:
            # Invalid payload
            raise e
        except stripe.error.SignatureVerificationError as e:
            # Invalid signature
            raise e

        # Handle the event
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            await StripeService._fulfill_subscription(session)
        elif event['type'] == 'customer.subscription.updated':
            subscription = event['data']['object']
            await StripeService._update_subscription(subscription)
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            await StripeService._cancel_subscription(subscription)

    @staticmethod
    async def _fulfill_subscription(session):
        user_id = session.get('metadata', {}).get('user_id')
        subscription_id = session.get('subscription')
        if user_id and subscription_id:
            db = get_db().client
            await db.user.update(
                where={"id": user_id},
                data={
                    "subscriptionId": subscription_id,
                    "subscriptionStatus": "active",
                    "planType": "pro"
                }
            )

    @staticmethod
    async def _update_subscription(subscription):
        customer_id = subscription.get('customer')
        status = subscription.get('status')
        db = get_db().client
        await db.user.update(
            where={"stripeCustomerId": customer_id},
            data={"subscriptionStatus": status}
        )

    @staticmethod
    async def _cancel_subscription(subscription):
        customer_id = subscription.get('customer')
        db = get_db().client
        await db.user.update(
            where={"stripeCustomerId": customer_id},
            data={
                "subscriptionStatus": "canceled",
                "planType": "free"
            }
        )
