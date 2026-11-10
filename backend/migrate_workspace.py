
from sqlalchemy import inspect, text

from app.db.base import Base
from app.db.session import engine
from app.models.workspace_acknowledgement import WorkspaceAcknowledgement


def migrate():
    # Create missing tables only; existing tables and rows are preserved.
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)

    if "workspace_records" not in inspector.get_table_names():
        raise RuntimeError("workspace_records table does not exist.")

    columns = {
        column["name"]
        for column in inspector.get_columns("workspace_records")
    }

    with engine.begin() as connection:
        if "start_date" not in columns:
            connection.execute(
                text("ALTER TABLE workspace_records ADD COLUMN start_date DATE")
            )
            print("Added start_date column.")

        if "end_date" not in columns:
            connection.execute(
                text("ALTER TABLE workspace_records ADD COLUMN end_date DATE")
            )
            print("Added end_date column.")

    inspector = inspect(engine)
    columns = {
        column["name"]
        for column in inspector.get_columns("workspace_records")
    }

    print("Database:", engine.url.database)
    print("Workspace columns:", sorted(columns))
    print(
        "Acknowledgement table exists:",
        inspector.has_table("workspace_acknowledgements"),
    )


if __name__ == "__main__":
    migrate()
