
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

is_sqlite = settings.database_url.startswith("sqlite")
engine_options = {"pool_pre_ping": True}

if is_sqlite:
    engine_options["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.database_url, **engine_options)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Register models with SQLAlchemy.
from app.models.user import User  # noqa: E402, F401
from app.models.intern import Intern  # noqa: E402, F401

from app.models.workspace_record import WorkspaceRecord  # noqa: E402, F401
