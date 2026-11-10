"""Read-only checklist view for an intern's lifecycle."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth_dependencies import get_current_user
from app.db.session import get_db
from app.models.intern import Intern
from app.models.user import User
from app.models.workspace_record import WorkspaceRecord

router = APIRouter(prefix="/lifecycle", tags=["lifecycle-checklist"])

CHECKLIST_KINDS = (
    "onboarding",
    "goals",
    "submissions",
    "feedback",
    "evaluations",
    "learning",
    "certifications",
    "leave",
)

DONE_STATUSES = {"completed", "verified", "reviewed", "approved"}


@router.get("/interns/{intern_user_id}/checklist")
def intern_checklist(
    intern_user_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Show lifecycle items for an intern, enforcing record-level access."""

    intern = db.scalar(
        select(Intern).where(Intern.user_id == intern_user_id)
    )
    if intern is None:
        raise HTTPException(status_code=404, detail="Intern profile not found.")

    if user.role == "intern" and user.id != intern_user_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    if user.role == "manager" and intern.mentor_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    if user.role not in {"hr", "manager", "intern"}:
        raise HTTPException(status_code=403, detail="Access denied.")

    records = db.scalars(
        select(WorkspaceRecord)
        .where(
            WorkspaceRecord.owner_user_id == intern_user_id,
            WorkspaceRecord.kind.in_(CHECKLIST_KINDS),
        )
        .order_by(WorkspaceRecord.kind, WorkspaceRecord.id)
    ).all()

    grouped = {kind: [] for kind in CHECKLIST_KINDS}

    for record in records:
        grouped[record.kind].append({
            "id": record.id,
            "title": record.title,
            "description": record.description,
            "status": record.status,
            "completed": record.status in DONE_STATUSES,
            "due_date": (
                record.due_date.isoformat() if record.due_date else None
            ),
        })

    items = []
    for kind, entries in grouped.items():
        items.append({
            "section": kind,
            "total": len(entries),
            "completed": sum(item["completed"] for item in entries),
            "items": entries,
        })

    total = sum(section["total"] for section in items)
    completed = sum(section["completed"] for section in items)

    return {
        "intern_user_id": intern_user_id,
        "checklist": items,
        "summary": {
            "total_items": total,
            "completed_items": completed,
            "pending_items": total - completed,
            "completion_percent": round(completed * 100 / total)
            if total else 0,
        },
    }
