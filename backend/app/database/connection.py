import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database = None

db = Database()

async def get_database():
    return db.database

async def connect_to_mongo():
    """Create database connection"""
    mongodb_uri = os.getenv("MONGODB_URI")
    if not mongodb_uri:
        print("Warning: MONGODB_URI environment variable not set")
        return
    
    try:
        # Configure MongoDB client with proper SSL certificate bundle
        db.client = AsyncIOMotorClient(
            mongodb_uri,
            serverSelectionTimeoutMS=5000,
            tlsCAFile=certifi.where()
        )
        db.database = db.client.galactic_archives
        
        # Test the connection with a shorter timeout
        await db.client.admin.command('ping')
        print("Successfully connected to MongoDB Atlas")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        print("Server will start without database connectivity")
        # Don't raise the exception, allow server to start

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB")

async def ping_database() -> bool:
    """Test database connectivity"""
    try:
        if db.client:
            await db.client.admin.command('ping')
            return True
        return False
    except Exception:
        return False