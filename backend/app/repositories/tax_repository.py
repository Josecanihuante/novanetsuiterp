"""Repositorio CRUD para TaxConfig, PpmPayment y TaxResult."""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.taxes import PpmPayment, TaxConfig, TaxResult
from app.schemas.taxes import (
    PpmPaymentCreate,
    PpmPaymentUpdate,
    TaxConfigCreate,
    TaxConfigUpdate,
    TaxResultCreate,
)


class TaxRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ── TaxConfig ─────────────────────────────────────────────────────────────

    def get_config_by_id(self, config_id: str) -> Optional[TaxConfig]:
        return self.db.query(TaxConfig).filter(TaxConfig.id == config_id).first()

    def get_config_by_code(self, code: str) -> Optional[TaxConfig]:
        return self.db.query(TaxConfig).filter(
            TaxConfig.tax_code == code, TaxConfig.is_active.is_(True)
        ).first()

    def list_configs(self, applies_to: Optional[str] = None) -> list[TaxConfig]:
        q = self.db.query(TaxConfig).filter(TaxConfig.is_active.is_(True))
        if applies_to:
            q = q.filter(TaxConfig.applies_to == applies_to)
        return q.order_by(TaxConfig.tax_code).all()

    def create_config(self, data: TaxConfigCreate) -> TaxConfig:
        config = TaxConfig(**data.model_dump())
        self.db.add(config)
        self.db.commit()
        self.db.refresh(config)
        return config

    def update_config(self, config: TaxConfig, data: TaxConfigUpdate) -> TaxConfig:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(config, field, value)
        self.db.commit()
        self.db.refresh(config)
        return config

    # ── PpmPayment ────────────────────────────────────────────────────────────

    def get_ppm_by_id(self, ppm_id: str) -> Optional[PpmPayment]:
        return self.db.query(PpmPayment).filter(
            PpmPayment.id == ppm_id, PpmPayment.deleted_at.is_(None)
        ).first()

    def get_ppm_by_period(self, period_id: str) -> Optional[PpmPayment]:
        return self.db.query(PpmPayment).filter(
            PpmPayment.period_id == period_id, PpmPayment.deleted_at.is_(None)
        ).first()

    def list_ppms(self, status: Optional[str] = None, skip: int = 0, limit: int = 50) -> list[PpmPayment]:
        q = self.db.query(PpmPayment).filter(PpmPayment.deleted_at.is_(None))
        if status:
            q = q.filter(PpmPayment.status == status)
        return q.order_by(PpmPayment.created_at.desc()).offset(skip).limit(limit).all()

    def create_ppm(self, data: PpmPaymentCreate) -> PpmPayment:
        ppm = PpmPayment(**data.model_dump())
        self.db.add(ppm)
        self.db.commit()
        self.db.refresh(ppm)
        return ppm

    def update_ppm(self, ppm: PpmPayment, data: PpmPaymentUpdate) -> PpmPayment:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(ppm, field, value)
        self.db.commit()
        self.db.refresh(ppm)
        return ppm

    # ── TaxResult ─────────────────────────────────────────────────────────────

    def get_result_by_period(self, period_id: str) -> Optional[TaxResult]:
        return self.db.query(TaxResult).filter(TaxResult.period_id == period_id).first()

    def upsert_result(self, data: TaxResultCreate) -> TaxResult:
        existing = self.get_result_by_period(data.period_id)
        if existing:
            for field, value in data.model_dump().items():
                setattr(existing, field, value)
            self.db.commit()
            self.db.refresh(existing)
            return existing
        result = TaxResult(**data.model_dump())
        self.db.add(result)
        self.db.commit()
        self.db.refresh(result)
        return result
