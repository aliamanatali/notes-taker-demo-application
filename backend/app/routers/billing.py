from fastapi import APIRouter, Depends, HTTPException, Request, Header
from app.core.dependencies import get_current_user
from app.models.user import UserInDB
from app.core.config import settings
from app.database.connection import get_database
import stripe
import logging
from datetime import datetime
from pydantic import BaseModel

logger = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/api/v1/billing",
    tags=["billing"],
    responses={404: {"description": "Not found"}},
)

stripe.api_key = settings.STRIPE_SECRET_KEY


async def get_or_create_customer(user: UserInDB, db):
    """Get or create a Stripe customer for the user"""
    if user.stripe_customer_id:
        return user.stripe_customer_id

    try:
        # Check if customer already exists in Stripe
        existing_customers = stripe.Customer.list(email=user.email, limit=1)
        if existing_customers.data:
            customer = existing_customers.data[0]
            customer_id = customer.id
        else:
            # Create new customer
            customer = stripe.Customer.create(
                email=user.email,
                metadata={"user_id": str(user.id)},
            )
            customer_id = customer.id

        # Save customer ID to database
        await db.users.update_one(
            {"_id": user.id},
            {"$set": {"stripe_customer_id": customer_id}},
        )
        return customer_id
    except Exception as e:
        logger.error(f"Stripe customer creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initialize billing account")


class CheckoutSessionRequest(BaseModel):
    price_id: str | None = None
    lookup_key: str | None = None


@router.post("/create-checkout-session")
async def create_checkout_session(
    request_data: CheckoutSessionRequest,
    user: UserInDB = Depends(get_current_user),
):
    """Create a Stripe Checkout Session for subscription"""
    price_id = request_data.price_id
    lookup_key = request_data.lookup_key

    db = await get_database()
    customer_id = await get_or_create_customer(user, db)

    try:
        # Resolve price_id from lookup_key if needed
        if lookup_key and not price_id:
            # First try MongoDB products collection
            product = await db.products.find_one({"lookup_key": lookup_key})
            if product and "price_id" in product:
                price_id = product["price_id"]
            else:
                # Fallback to Stripe API
                prices = stripe.Price.list(
                    lookup_keys=[lookup_key],
                    expand=["data.product"],
                )
                if not prices.data:
                    raise HTTPException(status_code=400, detail="Invalid price lookup key")
                price_id = prices.data[0].id

        if not price_id:
            raise HTTPException(status_code=400, detail="Missing price_id or lookup_key")

        # Create Checkout Session
        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=f"{settings.FRONTEND_URL}/?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/pricing",
            metadata={"user_id": str(user.id)},
        )
        return {"url": checkout_session.url}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe Checkout Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Checkout Session creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/create-portal-session")
async def customer_portal(user: UserInDB = Depends(get_current_user)):
    """Create a Stripe Customer Portal session"""
    db = await get_database()
    customer_id = await get_or_create_customer(user, db)

    try:
        portal_session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=settings.FRONTEND_URL,
        )
        return {"url": portal_session.url}
    except Exception as e:
        logger.error(f"Portal Session Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create portal session")


@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Handle Stripe webhook events"""
    payload = await request.body()
    sig_header = stripe_signature
    event = None

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Webhook Error: Invalid payload - {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Webhook Error: Invalid signature - {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        db = await get_database()

        if event["type"] in [
            "customer.subscription.created",
            "customer.subscription.updated",
            "customer.subscription.deleted",
        ]:
            subscription = event["data"]["object"]
            customer_id = subscription["customer"]
            status = subscription["status"]
            price_id = subscription["items"]["data"][0]["price"]["id"]
            subscription_id = subscription["id"]

            result = await db.users.update_one(
                {"stripe_customer_id": customer_id},
                {
                    "$set": {
                        "stripe_subscription_id": subscription_id,
                        "stripe_subscription_status": status,
                        "stripe_price_id": price_id,
                        "updated_at": datetime.utcnow(),
                    }
                },
            )
            logger.info(
                f"Subscription update for customer {customer_id}: {status} "
                f"(Modified: {result.modified_count})"
            )

        elif event["type"] == "invoice.payment_succeeded":
            # Optional: additional logic for successful payments
            pass

    except Exception as e:
        logger.error(f"Webhook Processing Error: {str(e)}")
        return {"status": "error", "detail": str(e)}

    return {"status": "success"}