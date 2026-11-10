
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth_dependencies import get_current_user
from app.db.session import get_db
from app.models.intern import Intern
from app.models.user import User
from app.models.workspace_record import WorkspaceRecord

router = APIRouter(prefix="/lifecycle", tags=["lifecycle"])

TRACKED_KINDS = {
    "onboarding",
    "goals",
    "submissions",
    "feedback",
    "evaluations",
    "learning",
    "certifications",
    "leave",
}


def get_visible_interns(db: Session, user: User):
    query = select(Intern, User).join(User, User.id == Intern.user_id)

    if user.role == "intern":
        query = query.where(Intern.user_id == user.id)
    elif user.role == "manager":
        query = query.where(Intern.mentor_id == user.id)
    elif user.role != "hr":
        raise HTTPException(status_code=403, detail="Access denied.")

    return db.execute(query.order_by(User.full_name)).all()


def build_progress(db: Session, intern: Intern, account: User):
    records = db.scalars(
        select(WorkspaceRecord).where(
            WorkspaceRecord.owner_user_id == intern.user_id,
            WorkspaceRecord.kind.in_(TRACKED_KINDS),
        )
    ).all()

    by_kind = {}
    for kind in TRACKED_KINDS:
        matching = [record for record in records if record.kind == kind]
        by_kind[kind] = {
            "total": len(matching),
            "completed": sum(
                record.status in {"completed", "verified", "reviewed", "approved"}
                for record in matching
            ),
            "items": [
                {
                    "id": record.id,
                    "title": record.title,
                    "description": record.description,
                    "status": record.status,
                    "due_date": (
                        record.due_date.isoformat()
                        if record.due_date
                        else None
                    ),
                    "value": record.value,
                }
                for record in matching
            ],
        }

    total = sum(section["total"] for section in by_kind.values())
    completed = sum(section["completed"] for section in by_kind.values())

    return {
        "intern": {
            "user_id": account.id,
            "full_name": account.full_name,
            "email": account.email,
            "intern_code": intern.intern_code,
            "department": intern.department,
            "mentor_id": intern.mentor_id,
            "start_date": intern.start_date.isoformat(),
            "end_date": (
                intern.end_date.isoformat() if intern.end_date else None
            ),
            "status": intern.status,
        },
        "progress": {
            "total_records": total,
            "completed_records": completed,
            "completion_percent": round(completed * 100 / total)
            if total
            else 0,
        },
        "modules": by_kind,
    }


@router.get("/overview")
def lifecycle_overview(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    visible = get_visible_interns(db, user)

    summaries = [
        build_progress(db, intern, account)
        for intern, account in visible
    ]

    if user.role == "intern":
        if not summaries:
            raise HTTPException(
                status_code=404,
                detail="No intern profile is linked to this account.",
            )
        return summaries[0]

    return {
        "total_interns": len(summaries),
        "interns": summaries,
    }


@router.get("/interns/{intern_user_id}")
def intern_lifecycle_detail(
    intern_user_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    intern = db.scalar(
        select(Intern).where(Intern.user_id == intern_user_id)
    )
    if intern is None:
        raise HTTPException(status_code=404, detail="Intern profile not found.")

    if user.role == "intern" and user.id != intern_user_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    if user.role == "manager" and intern.mentor_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    if user.role not in {"intern", "manager", "hr"}:
        raise HTTPException(status_code=403, detail="Access denied.")

    account = db.get(User, intern_user_id)
    if account is None:
        raise HTTPException(status_code=404, detail="Intern account not found.")

    return build_progress(db, intern, account)
