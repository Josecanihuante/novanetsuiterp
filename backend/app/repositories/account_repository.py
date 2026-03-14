"""Repositorio CRUD para Account y Period."""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.account import Account, Period
from app.schemas.account import AccountCreate, AccountUpdate, PeriodCreate, PeriodUpdate


class AccountRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, account_id: str) -> Optional[Account]:
        return self.db.query(Account).filter(
            Account.id == account_id, Account.deleted_at.is_(None)
        ).first()

    def get_by_code(self, code: str) -> Optional[Account]:
        return self.db.query(Account).filter(
            Account.code == code, Account.deleted_at.is_(None)
        ).first()

    def list(
        self,
        account_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 200,
    ) -> list[Account]:
        q = self.db.query(Account).filter(Account.deleted_at.is_(None))
        if account_type:
            q = q.filter(Account.account_type == account_type)
        return q.order_by(Account.code).offset(skip).limit(limit).all()

    def create(self, data: AccountCreate) -> Account:
        account = Account(**data.model_dump())
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        return account

    def update(self, account: Account, data: AccountUpdate) -> Account:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(account, field, value)
        self.db.commit()
        self.db.refresh(account)
        return account

    def soft_delete(self, account: Account) -> Account:
        account.deleted_at = datetime.now(timezone.utc)
        self.db.commit()
        return account


class PeriodRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, period_id: str) -> Optional[Period]:
        return self.db.query(Period).filter(
            Period.id == period_id, Period.deleted_at.is_(None)
        ).first()

    def list(self, fiscal_year: Optional[int] = None, skip: int = 0, limit: int = 50) -> list[Period]:
        q = self.db.query(Period).filter(Period.deleted_at.is_(None))
        if fiscal_year:
            q = q.filter(Period.fiscal_year == fiscal_year)
        return q.order_by(Period.start_date).offset(skip).limit(limit).all()

    def create(self, data: PeriodCreate) -> Period:
        period = Period(**data.model_dump())
        self.db.add(period)
        self.db.commit()
        self.db.refresh(period)
        return period

    def update(self, period: Period, data: PeriodUpdate) -> Period:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(period, field, value)
        self.db.commit()
        self.db.refresh(period)
        return period
