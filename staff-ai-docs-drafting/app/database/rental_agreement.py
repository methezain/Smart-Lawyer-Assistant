"""Database initialization & session dependency using SQLModel for rental agreements."""

from __future__ import annotations

import os
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import StaticPool
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("RENTAL_DB_URL", "sqlite:///./lease_agreements.db")

engine = create_engine(
	DATABASE_URL,
	echo=False,
	connect_args={"check_same_thread": False},
	poolclass=StaticPool,
)


def create_db_and_tables():
	from app.models.rental_agreement import RentalAgreement  # ensure model imported

	SQLModel.metadata.create_all(engine)


def get_session():
	with Session(engine) as session:
		yield session


def init_db():  # align naming with other services
	create_db_and_tables()
