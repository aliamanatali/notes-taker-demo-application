from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from bson import ObjectId
from pymongo.errors import PyMongoError

from ..core.dependencies import get_current_user
from ..database.connection import get_database
from ..models.user import UserInDB
from ..models.note import NoteCreate, NoteUpdate, NoteResponse, NoteInDB


router = APIRouter(prefix="/api/v1/notes", tags=["notes"])


@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: NoteCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Create a new note for the authenticated user
    """
    # Get database
    db = await get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Create note document
    now = datetime.utcnow()
    note_doc = {
        "user_id": current_user.id,
        "title": note_data.title,
        "content": note_data.content,
        "created_at": now,
        "updated_at": now
    }
    
    try:
        # Insert note into database
        result = await db.notes.insert_one(note_doc)
        
        # Retrieve the created note
        created_note = await db.notes.find_one({"_id": result.inserted_id})
        if not created_note:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve created note"
            )
        
        # Return note response
        return NoteResponse(
            _id=created_note["_id"],
            title=created_note["title"],
            content=created_note["content"],
            created_at=created_note["created_at"],
            updated_at=created_note["updated_at"]
        )
        
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create note"
        )


@router.get("/", response_model=List[NoteResponse])
async def get_notes(
    search: Optional[str] = Query(None, description="Search term for title and content"),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all notes for the authenticated user, with optional search
    """
    # Get database
    db = await get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    try:
        # Build query filter
        query_filter = {"user_id": current_user.id}
        
        # Add search filter if provided
        if search:
            search_regex = {"$regex": search, "$options": "i"}  # Case-insensitive search
            query_filter["$or"] = [
                {"title": search_regex},
                {"content": search_regex}
            ]
        
        # Find notes for the user
        cursor = db.notes.find(query_filter).sort("updated_at", -1)  # Sort by most recently updated
        notes = await cursor.to_list(length=None)
        
        # Convert to response models
        note_responses = []
        for note in notes:
            note_responses.append(NoteResponse(
                _id=note["_id"],
                title=note["title"],
                content=note["content"],
                created_at=note["created_at"],
                updated_at=note["updated_at"]
            ))
        
        return note_responses
        
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notes"
        )


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get a specific note by ID for the authenticated user
    """
    # Validate ObjectId format
    if not ObjectId.is_valid(note_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid note ID format"
        )
    
    # Get database
    db = await get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    try:
        # Find note by ID and user_id to ensure ownership
        note = await db.notes.find_one({
            "_id": ObjectId(note_id),
            "user_id": current_user.id
        })
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        # Return note response
        return NoteResponse(
            _id=note["_id"],
            title=note["title"],
            content=note["content"],
            created_at=note["created_at"],
            updated_at=note["updated_at"]
        )
        
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve note"
        )


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    note_update: NoteUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Update a specific note by ID for the authenticated user
    """
    # Validate ObjectId format
    if not ObjectId.is_valid(note_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid note ID format"
        )
    
    # Check if at least one field is provided for update
    update_data = note_update.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be provided for update"
        )
    
    # Get database
    db = await get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    try:
        # First, verify the note exists and belongs to the user
        existing_note = await db.notes.find_one({
            "_id": ObjectId(note_id),
            "user_id": current_user.id
        })
        
        if not existing_note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        # Add updated_at timestamp
        update_data["updated_at"] = datetime.utcnow()
        
        # Update the note
        result = await db.notes.update_one(
            {"_id": ObjectId(note_id), "user_id": current_user.id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update note"
            )
        
        # Retrieve the updated note
        updated_note = await db.notes.find_one({"_id": ObjectId(note_id)})
        if not updated_note:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve updated note"
            )
        
        # Return updated note response
        return NoteResponse(
            _id=updated_note["_id"],
            title=updated_note["title"],
            content=updated_note["content"],
            created_at=updated_note["created_at"],
            updated_at=updated_note["updated_at"]
        )
        
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update note"
        )


@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Delete a specific note by ID for the authenticated user
    """
    # Validate ObjectId format
    if not ObjectId.is_valid(note_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid note ID format"
        )
    
    # Get database
    db = await get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    try:
        # Delete the note (only if it belongs to the user)
        result = await db.notes.delete_one({
            "_id": ObjectId(note_id),
            "user_id": current_user.id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        return {"message": "Note deleted successfully"}
        
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete note"
        )