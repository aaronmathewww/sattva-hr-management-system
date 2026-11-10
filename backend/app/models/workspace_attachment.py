from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class WorkspaceAttachment(Base):
    __tablename__ = "workspace_attachments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    record_id: Mapped[int] = mapped_column(
        ForeignKey("workspace_records.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    uploaded_by_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    original_filename: Mapped[str] = mapped_column(
        String(255), nullable=False
    )

    stored_filename: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True
    )

    file_path: Mapped[str] = mapped_column(
        String(1000), nullable=False
    )

    content_type: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )

    document_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="work_document"
    )

    file_size: Mapped[int] = mapped_column(
        Integer, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )