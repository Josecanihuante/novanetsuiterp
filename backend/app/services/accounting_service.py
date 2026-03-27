from sqlalchemy.orm import Session
from app.repositories.account_repository import AccountRepository
from app.repositories.journal_repository import JournalRepository
from app.schemas.accountinging import AccountCreate, AccountUpdate, JournalEntryCreate, JournalEntryUpdate

class AccountingService:
    def __init__(self, db: Session):
        self.account_repo = AccountRepository(db)
        self.journal_repo = JournalRepository(db)
