import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    # App settings
    APP_ENV: str = os.getenv("APP_ENV", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Database
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    
    # JWT settings
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
    JWT_EXPIRES_IN: int = int(os.getenv("JWT_EXPIRES_IN", "86400"))  # 24 hours
    
    # Stripe Settings
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # CORS settings
    @property
    def CORS_ORIGINS(self) -> List[str]:
        """
        Get CORS origins from environment or use defaults
        In production, this should be set to specific domains
        """
        cors_env = os.getenv("CORS_ORIGINS", "")
        
        if cors_env == "*":
            return ["*"]
        elif cors_env:
            # Split comma-separated origins
            return [origin.strip() for origin in cors_env.split(",")]
        else:
            # Default allowed origins
            return [
                "http://localhost:5173",
                "http://localhost:5137",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5137",
                "https://notes-taker-demo-application.onrender.com",
            ]

settings = Settings()