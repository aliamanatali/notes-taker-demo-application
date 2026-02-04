from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId

from .user import PyObjectId


class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Note title")
    content: str = Field(..., min_length=1, description="Note content")


class NoteCreate(NoteBase):
    """Model for creating a new note"""
    pass


class NoteUpdate(BaseModel):
    """Model for updating an existing note"""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Note title")
    content: Optional[str] = Field(None, min_length=1, description="Note content")


class NoteResponse(NoteBase):
    """Model for note responses to the client"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class NoteInDB(NoteBase):
    """Model for notes stored in the database"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., description="ID of the user who owns this note")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}