from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo.errors import DuplicateKeyError

from ..core.auth import get_password_hash, verify_password, create_token_response
from ..core.dependencies import get_current_user
from ..database.connection import get_database
from ..models.user import UserCreate, UserLogin, UserResponse, UserInDB, Token

# HTTP Bearer token scheme
security = HTTPBearer()


router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate):
    """
    Register a new user account
    """
    # Get database
    db = await get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    password_hash = get_password_hash(user_data.password)
    
    # Create user document
    now = datetime.utcnow()
    user_doc = {
        "email": user_data.email,
        "password_hash": password_hash,
        "created_at": now,
        "updated_at": now
    }
    
    try:
        # Insert user into database
        result = await db.users.insert_one(user_doc)
        
        # Create index on email field for uniqueness (if not exists)
        await db.users.create_index("email", unique=True)
        
        return {"message": "User created successfully"}
        
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )


@router.post("/login", response_model=Token)
async def login_user(user_credentials: UserLogin):
    """
    Authenticate user and return JWT token
    """
    # Get database
    db = await get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Find user by email
    user_doc = await db.users.find_one({"email": user_credentials.email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(user_credentials.password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create and return token
    token_response = create_token_response(user_credentials.email)
    return token_response


@router.get("/me")
async def get_current_user_info(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get current authenticated user information
    """
    from ..core.auth import verify_token
    from fastapi.security import HTTPBearer
    
    # Verify the token
    email = verify_token(credentials.credentials)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Return user info
    return {
        "id": str(user_doc["_id"]),
        "email": user_doc["email"],
        "created_at": user_doc["created_at"].isoformat(),
        "updated_at": user_doc["updated_at"].isoformat()
    }