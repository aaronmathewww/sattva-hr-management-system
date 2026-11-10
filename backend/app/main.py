
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.core.config import settings
from app.api.router import api_router
from app.db.base import Base
from app.db.session import engine


def migrate_workspace_table():
    """Add missing workspace columns without deleting existing data."""
    if not engine.dialect.name == "sqlite":
        return

    inspector = inspect(engine)
    if "workspace_records" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns("workspace_records")
    }

    migrations = {
        "start_date": "DATE",
        "end_date": "DATE",
    }

    with engine.begin() as connection:
        for column_name, column_type in migrations.items():
            if column_name not in existing_columns:
                connection.execute(
                    text(
                        f"ALTER TABLE workspace_records "
                        f"ADD COLUMN {column_name} {column_type}"
                    )
                )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Register models before creating any newly introduced tables.
    Base.metadata.create_all(bind=engine)

    # SQLite CREATE TABLE does not modify existing tables.
    migrate_workspace_table()

    yield


app = FastAPI(
    title=settings.app_name,
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "app": settings.app_name}
