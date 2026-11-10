"""Additive HR lifecycle reporting endpoints."""

from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth_dependencies import get_current_user
from app.db.session import get_db
from app.extensions.lifecycle import TRACKED_KINDS
from app.models.intern import Intern
from app.models.user import User
from app.models.workspace_record import WorkspaceRecord

router = APIRouter(prefix="/lifecycle/reports", tags=["lifecycle-reports"])


@router.get("/summary")
def lifecycle_summary(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return an HR-only aggregate summary of intern lifecycle records."""

    if user.role != "hr":
        raise HTTPException(
            status_code=403,
            detail="Only HR can access the lifecycle summary report.",
        )

    intern_profiles = db.scalars(select(Intern)).all()
    intern_accounts = db.scalars(
        select(User).where(User.role == "intern")
    ).all()

    status_counts = Counter(
        (intern.status or "unknown").lower()
        for intern in intern_profiles
    )

    records = db.scalars(
        select(WorkspaceRecord).where(
            WorkspaceRecord.kind.in_(TRACKED_KINDS)
        )
    ).all()

    module_counts = {}
    for kind in sorted(TRACKED_KINDS):
        matching = [record for record in records if record.kind == kind]
        completed = sum(
            record.status in {"completed", "verified", "reviewed", "approved"}
            for record in matching
        )
        module_counts[kind] = {
            "total": len(matching),
            "completed": completed,
            "pending": len(matching) - completed,
        }

    total_records = len(records)
    completed_records = sum(
        record.status in {"completed", "verified", "reviewed", "approved"}
        for record in records
    )

    return {
        "intern_accounts": len(intern_accounts),
        "intern_profiles": len(intern_profiles),
        "interns_without_profile": max(
            len(intern_accounts) - len(
                {intern.user_id for intern in intern_profiles}
            ),
            0,
        ),
        "interns_by_status": dict(sorted(status_counts.items())),
        "lifecycle_records": {
            "total": total_records,
            "completed": completed_records,
            "pending": total_records - completed_records,
            "completion_percent": round(
                completed_records * 100 / total_records
            ) if total_records else 0,
        },
        "modules": module_counts,
    }
