from sqlalchemy.orm import Session
from app.repositories.user_repository import UserRepository
from app.schemas.users import UserCreate, UserUpdate

class UsersService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)
    def list(self, skip=0, limit=50): return self.repo.list_users(skip=skip, limit=limit)
    def create(self, data: UserCreate): return self.repo.create_user(data)
    def get(self, user_id: str): return self.repo.get_by_id(user_id)
    def update(self, user_id: str, data: UserUpdate): return self.repo.update_user(self.get(user_id), data)
    def delete(self, user_id: str): return self.repo.soft_delete(self.get(user_id))
