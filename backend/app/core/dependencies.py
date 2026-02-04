from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId

from .auth import verify_token
from ..database.connection import get_database
from ..models.user import UserInDB


# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserInDB:
    """
    Dependency to get the current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Verify the token
    email = verify_token(credentials.credentials)
    if email is None:
        raise credentials_exception
    
    # Get database
    db = await get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Find user in database
    user_doc = await db.users.find_one({"email": email})
    if user_doc is None:
        raise credentials_exception
    
    # Convert to UserInDB model with proper ObjectId handling
    user = UserInDB(
        _id=user_doc["_id"],
        email=user_doc["email"],
        password_hash=user_doc["password_hash"],
        created_at=user_doc["created_at"],
        updated_at=user_doc["updated_at"]
    )
    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[UserInDB]:
    """
    Optional dependency to get the current user if token is provided
    Returns None if no token or invalid token
    """
    if credentials is None:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None