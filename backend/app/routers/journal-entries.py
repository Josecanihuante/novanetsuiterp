from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.schemas.accounting import JournalEntryCreate, JournalEntryUpdate, JournalEntryResponse
from app.services.journal_entry_service import (
    get_journal_entry,
    get_journal_entries,
    create_journal_entry,
    update_journal_entry,
    delete_journal_entry,
    post_journal_entry,
)

router = APIRouter(prefix="/journal-entries", tags=["journal-entries"])


@router.get("/", response_model=List[JournalEntryResponse])
def list_journal_entries(
    skip: int = 0,
    limit: int = 100,
    period_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve journal entries with optional filtering.
    """
    entries = get_journal_entries(db, skip=skip, limit=limit, period_id=period_id, status=status)
    return entries


@router.post("/", response_model=JournalEntryResponse, status_code=status.HTTP_201_CREATED)
def create_journal_entry_endpoint(
    entry: JournalEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create new journal entry.
    """
    return create_journal_entry(db, entry, current_user.id)


@router.get("/{entry_id}", response_model=JournalEntryResponse)
def read_journal_entry(
    entry_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get journal entry by ID.
    """
    db_entry = get_journal_entry(db, entry_id)
    if not db_entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return db_entry


@router.put("/{entry_id}", response_model=JournalEntryResponse)
def update_journal_entry_endpoint(
    entry_id: uuid.UUID,
    entry: JournalEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update journal entry.
    """
    db_entry = update_journal_entry(db, entry_id, entry, current_user.id)
    if not db_entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return db_entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_journal_entry_endpoint(
    entry_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete journal entry.
    """
    success = delete_journal_entry(db, entry_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return None


@router.post("/{entry_id}/post", response_model=JournalEntryResponse)
def post_journal_entry_endpoint(
    entry_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Post journal entry (change status from draft to posted).
    Only admin can post journal entries.
    """
    # Check if user has permission to post (admin only)
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can post journal entries")
    
    db_entry = post_journal_entry(db, entry_id, current_user.id)
    if not db_entry:
        raise HTTPException(status_code=400, detail="Cannot post journal entry. Entry not found or already posted.")
    return db_entry