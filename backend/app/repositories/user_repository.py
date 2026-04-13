"""Repositorio CRUD para User."""
from typing import Optional

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.users import User
from app.schemas.users import UserCreate, UserUpdate


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: str) -> Optional[User]:
        return self.db.query(User).filter(
            User.id == user_id, User.deleted_at.is_(None)
        ).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(
            User.email == email, User.deleted_at.is_(None)
        ).first()

    def list(self, skip: int = 0, limit: int = 50) -> list[User]:
        return (
            self.db.query(User)
            .filter(User.deleted_at.is_(None))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create(self, data: UserCreate) -> User:
        user = User(
            email=data.email,
            full_name=data.full_name,
            role=data.role,
            is_active=data.is_active,
            hashed_password=hash_password(data.password),
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User, data: UserUpdate) -> User:
        update_data = data.model_dump(exclude_unset=True)
        if "password" in update_data:
            update_data["hashed_password"] = hash_password(update_data.pop("password"))
        for field, value in update_data.items():
            setattr(user, field, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def soft_delete(self, user: User) -> User:
        from datetime import datetime, timezone
        user.deleted_at = datetime.now(timezone.utc)
        self.db.commit()
        return user

    def list_by_company(
        self,
        company_id: str,
        include_inactive: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> list[User]:
        """Lista usuarios de una empresa específica. Solo contador y viewer."""
        q = (
            self.db.query(User)
            .filter(
                User.company_id == company_id,
                User.role.in_(["contador", "viewer"]),
                User.deleted_at.is_(None),
            )
        )
        if not include_inactive:
            q = q.filter(User.is_active == True)  # noqa: E712
        return q.order_by(User.role, User.full_name).offset(skip).limit(limit).all()

    def create_with_company(
        self,
        data: 'UserCreate',
        company_id: str,
        created_by_id: str,
    ) -> User:
        """Crea un usuario asignándole empresa y auditoría de creación."""
        user = User(
            email=data.email,
            full_name=data.full_name,
            role=data.role,
            is_active=data.is_active,
            hashed_password=hash_password(data.password),
            company_id=company_id,
            created_by=created_by_id,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def toggle_active(self, user: User, activate: bool) -> User:
        """Activa o desactiva un usuario."""
        from datetime import datetime, timezone
        user.is_active  = activate
        user.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(user)
        return user

    def reset_password(self, user: User, new_password: str) -> User:
        """Resetea la contraseña de un usuario."""
        from datetime import datetime, timezone
        user.hashed_password = hash_password(new_password)
        user.updated_at      = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(user)
        return user
