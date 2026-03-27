from sqlalchemy.orm import Session
from app.models.accounting import JournalEntry, JournalLine
from app.schemas.accounting import JournalEntryCreate, JournalEntryUpdate, JournalEntryResponse
from app.repositories.journal_repository import JournalRepository
from typing import List, Optional
import uuid
from datetime import datetime


def get_journal_entry(db: Session, entry_id: uuid.UUID) -> Optional[JournalEntry]:
    repo = JournalRepository(db)
    return repo.get_by_id(str(entry_id))


def get_journal_entries(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    period_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None
) -> List[JournalEntry]:
    repo = JournalRepository(db)
    return repo.list(
        period_id=str(period_id) if period_id else None,
        status=status,
        skip=skip,
        limit=limit
    )


def create_journal_entry(
    db: Session, 
    entry: JournalEntryCreate, 
    current_user_id: uuid.UUID
) -> JournalEntry:
    repo = JournalRepository(db)
    return repo.create(entry, str(current_user_id))


def update_journal_entry(
    db: Session, 
    entry_id: uuid.UUID, 
    entry: JournalEntryUpdate, 
    current_user_id: uuid.UUID
) -> Optional[JournalEntry]:
    repo = JournalRepository(db)
    db_entry = repo.get_by_id(str(entry_id))
    if db_entry:
        return repo.update(db_entry, entry)
    return None


def delete_journal_entry(db: Session, entry_id: uuid.UUID, current_user_id: uuid.UUID) -> bool:
    repo = JournalRepository(db)
    db_entry = repo.get_by_id(str(entry_id))
    if db_entry:
        repo.soft_delete(db_entry)
        return True
    return False


def post_journal_entry(db: Session, entry_id: uuid.UUID, current_user_id: uuid.UUID) -> Optional[JournalEntry]:
    """Post a journal entry (change status from draft to posted)"""
    repo = JournalRepository(db)
    db_entry = repo.get_by_id(str(entry_id))
    if db_entry and db_entry.status == "draft":
        update_data = JournalEntryUpdate(status="posted", reference=db_entry.reference)
        return repo.update(db_entry, update_data)
    return None