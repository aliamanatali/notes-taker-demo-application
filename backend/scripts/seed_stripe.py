import stripe
import os
import sys
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import certifi

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY


async def seed_products():
    """Seed Stripe products and prices, and store them in MongoDB"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URI, tlsCAFile=certifi.where())
    db = client.galactic_archives

    products = [
        {
            "name": "Pro",
            "description": "Perfect for power users who need more",
            "prices": [
                {
                    "unit_amount": 900,  # $9.00
                    "currency": "usd",
                    "interval": "month",
                    "lookup_key": "pro_monthly",
                }
            ],
        },
        {
            "name": "Pro+",
            "description": "Ultimate productivity for teams",
            "prices": [
                {
                    "unit_amount": 1900,  # $19.00
                    "currency": "usd",
                    "interval": "month",
                    "lookup_key": "pro_plus_monthly",
                }
            ],
        },
    ]

    print("Starting Stripe product seeding...")

    for p_data in products:
        product_name = p_data["name"]
        print(f"\nProcessing product: {product_name}")

        # Search for existing product in Stripe
        existing_products = stripe.Product.search(
            query=f"name:'{product_name}' AND active:'true'"
        )

        if existing_products.data:
            product = existing_products.data[0]
            print(f"  ✓ Found existing product: {product.id}")
        else:
            # Create new product
            product = stripe.Product.create(
                name=product_name,
                description=p_data["description"],
            )
            print(f"  ✓ Created new product: {product.id}")

        # Process prices
        for price_data in p_data["prices"]:
            lookup_key = price_data["lookup_key"]
            print(f"  Processing price with lookup_key: {lookup_key}")

            # Search for existing price with this lookup_key
            existing_prices = stripe.Price.list(
                lookup_keys=[lookup_key],
                limit=1,
            )

            if existing_prices.data:
                price = existing_prices.data[0]
                print(f"    ✓ Found existing price: {price.id}")
            else:
                # Create new price
                price = stripe.Price.create(
                    product=product.id,
                    unit_amount=price_data["unit_amount"],
                    currency=price_data["currency"],
                    recurring={"interval": price_data["interval"]},
                    lookup_key=lookup_key,
                )
                print(f"    ✓ Created new price: {price.id}")

            # Upsert into MongoDB products collection
            product_doc = {
                "name": product_name,
                "description": p_data["description"],
                "price_id": price.id,
                "lookup_key": lookup_key,
                "amount": price_data["unit_amount"],
                "currency": price_data["currency"],
                "interval": price_data["interval"],
            }

            result = await db.products.update_one(
                {"lookup_key": lookup_key},
                {"$set": product_doc},
                upsert=True,
            )

            if result.upserted_id:
                print(f"    ✓ Inserted into MongoDB: {result.upserted_id}")
            else:
                print(f"    ✓ Updated in MongoDB")

    print("\n✅ Stripe product seeding completed successfully!")
    client.close()


if __name__ == "__main__":
    if not stripe.api_key:
        print("❌ Error: STRIPE_SECRET_KEY not configured")
        print("Please set STRIPE_SECRET_KEY in your .env file")
        sys.exit(1)
    
    if not settings.MONGODB_URI:
        print("❌ Error: MONGODB_URI not configured")
        print("Please set MONGODB_URI in your .env file")
        sys.exit(1)

    asyncio.run(seed_products())