"""Additive CSV export for the Sattva lifecycle summary."""

import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth_dependencies import get_current_user
from app.db.session import get_db
from app.extensions.lifecycle import TRACKED_KINDS
from app.models.intern import Intern
from app.models.user import User
from app.models.workspace_record import WorkspaceRecord

router = APIRouter(prefix="/lifecycle/reports", tags=["lifecycle-reports"])


@router.get("/export.csv")
def export_lifecycle_csv(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Export one lifecycle summary row per intern. HR access only."""

    if user.role != "hr":
        raise HTTPException(
            status_code=403,
            detail="Only HR can export lifecycle reports.",
        )

    profiles = db.scalars(
        select(Intern).order_by(Intern.user_id)
    ).all()

    output = io.StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow([
        "Intern ID",
        "Intern Code",
        "Full Name",
        "Email",
        "Department",
        "Mentor ID",
        "Start Date",
        "End Date",
        "Status",
        "Lifecycle Records",
        "Completed Records",
        "Completion Percent",
    ])

    for intern in profiles:
        account = db.get(User, intern.user_id)
        if account is None:
            continue

        records = db.scalars(
            select(WorkspaceRecord).where(
                WorkspaceRecord.owner_user_id == intern.user_id,
                WorkspaceRecord.kind.in_(TRACKED_KINDS),
            )
        ).all()

        total = len(records)
        completed = sum(
            record.status in {"completed", "verified", "reviewed", "approved"}
            for record in records
        )
        percent = round(completed * 100 / total) if total else 0

        writer.writerow([
            intern.user_id,
            intern.intern_code or "",
            account.full_name or "",
            account.email or "",
            intern.department or "",
            intern.mentor_id or "",
            intern.start_date.isoformat() if intern.start_date else "",
            intern.end_date.isoformat() if intern.end_date else "",
            intern.status or "",
            total,
            completed,
            percent,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="sattva_lifecycle_report.csv"'
        },
    )
