"""Repositorio CRUD para JournalEntry y JournalLine."""
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.accounting import JournalEntry, JournalLine
from app.schemas.accounting import JournalEntryCreate, JournalEntryUpdate


class JournalRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, entry_id: str) -> Optional[JournalEntry]:
        return (
            self.db.query(JournalEntry)
            .options(joinedload(JournalEntry.lines))
            .filter(JournalEntry.id == entry_id, JournalEntry.deleted_at.is_(None))
            .first()
        )

    def list(
        self,
        period_id: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[JournalEntry]:
        q = self.db.query(JournalEntry).filter(JournalEntry.deleted_at.is_(None))
        if period_id:
            q = q.filter(JournalEntry.period_id == period_id)
        if status:
            q = q.filter(JournalEntry.status == status)
        return q.order_by(JournalEntry.entry_date.desc()).offset(skip).limit(limit).all()

    def create(self, data: JournalEntryCreate, created_by: str) -> JournalEntry:
        entry = JournalEntry(
            period_id=data.period_id,
            entry_number=data.entry_number,
            entry_date=data.entry_date,
            description=data.description,
            reference=data.reference,
            status=data.status,
            created_by=created_by,
        )
        self.db.add(entry)
        self.db.flush()  # obtener ID sin commit

        for line_data in data.lines:
            line = JournalLine(
                journal_entry_id=entry.id,
                account_id=line_data.account_id,
                debit=line_data.debit,
                credit=line_data.credit,
                description=line_data.description,
                line_order=line_data.line_order,
            )
            self.db.add(line)

        self.db.commit()
        self.db.refresh(entry)
        return entry

    def update(self, entry: JournalEntry, data: JournalEntryUpdate) -> JournalEntry:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(entry, field, value)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def soft_delete(self, entry: JournalEntry) -> JournalEntry:
        entry.deleted_at = datetime.now(timezone.utc)
        self.db.commit()
        return entry
