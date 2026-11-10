
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth_dependencies import get_current_user
from app.db.session import get_db
from app.models.intern import Intern
from app.models.user import User
from app.models.workspace_record import WorkspaceRecord
from app.models.workspace_acknowledgement import WorkspaceAcknowledgement

router = APIRouter(prefix="/workspace", tags=["workspace"])

KINDS = {
    "goals", "leave", "feedback", "submissions", "learning",
    "certifications", "onboarding", "evaluations",
}

CREATE_ROLES = {
    "goals": {"hr", "manager"},
    "leave": {"intern"},
    "feedback": {"hr", "manager"},
    "submissions": {"intern"},
    "learning": {"hr", "manager"},
    "certifications": {"intern", "hr", "manager"},
    "onboarding": {"hr"},
    "evaluations": {"hr", "manager"},
}

STAFF_STATUSES = {
    "goals": {"open"},
    "leave": {"pending", "approved", "rejected"},
    "feedback": {"open", "reviewed", "completed"},
    "submissions": {"submitted", "reviewed"},
    "learning": {"open"},
    "certifications": {"open", "verified", "completed"},
    "onboarding": {"open", "in_progress", "completed", "verified"},
    "evaluations": {"open", "reviewed", "completed"},
}

INTERN_ACK_STATUSES = {
    "goals": {"completed", "pending", "in_progress"},
    "feedback": {"reviewed", "in_progress", "completed"},
    "learning": {"acknowledged", "in_progress", "completed"},
}

class RecordCreate(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    description: str | None = Field(default=None, max_length=5000)
    owner_user_id: int | None = Field(default=None, gt=0)
    due_date: date | None = None
    start_date: date | None = None
    end_date: date | None = None
    value: str | None = Field(default=None, max_length=500)

class RecordUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=180)
    description: str | None = Field(default=None, max_length=5000)
    status: str | None = Field(default=None, max_length=30)
    due_date: date | None = None
    start_date: date | None = None
    end_date: date | None = None
    value: str | None = Field(default=None, max_length=500)

class AcknowledgementUpdate(BaseModel):
    status: str = Field(min_length=2, max_length=30)

def assigned_to_manager(db: Session, manager_id: int, owner_id: int | None) -> bool:
    if owner_id is None:
        return False
    return db.scalar(
        select(Intern.id).where(
            Intern.user_id == owner_id,
            Intern.mentor_id == manager_id,
        )
    ) is not None

def can_view(db: Session, user: User, record: WorkspaceRecord) -> bool:
    if record.kind == "feedback":
        # Staff may see their own feedback records, not each other's.
        if user.role == "hr":
            return record.created_by_id == user.id or (
                record.owner_user_id == user.id
            )
        if user.role == "manager":
            return (
                record.created_by_id == user.id
                or record.owner_user_id == user.id
                or assigned_to_manager(db, user.id, record.owner_user_id)
            )
        if user.role == "intern":
            return record.owner_user_id == user.id
        return False

    if user.role == "hr":
        # HR cannot access intern work submissions.
        return record.kind != "submissions"

    if user.role == "intern":
        return (
            record.owner_user_id == user.id
            or (record.kind == "learning" and record.owner_user_id is None)
        )

    if user.role == "manager":
        return (
            assigned_to_manager(db, user.id, record.owner_user_id)
            or (
                record.kind == "learning"
                and record.owner_user_id is None
            )
        )

    return False

def serialize(db: Session, record: WorkspaceRecord, user: User) -> dict:
    acknowledgement = None

    if user.role == "intern":
        acknowledgement = db.scalar(
            select(WorkspaceAcknowledgement).where(
                WorkspaceAcknowledgement.record_id == record.id,
                WorkspaceAcknowledgement.intern_user_id == user.id,
            )
        )

    return {
        "id": record.id,
        "kind": record.kind,
        "title": record.title,
        "description": record.description,
        "status": record.status,
        "owner_user_id": record.owner_user_id,
        "created_by_id": record.created_by_id,
        "due_date": record.due_date,
        "start_date": record.start_date,
        "end_date": record.end_date,
        "value": record.value,
        "created_at": record.created_at,
        "acknowledgement_status": (
            acknowledgement.status if acknowledgement else "pending"
        ),
    }

@router.get("/{kind}")
def list_records(
    kind: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if kind not in KINDS:
        raise HTTPException(404, "Workspace module not found.")

    rows = db.scalars(
        select(WorkspaceRecord)
        .where(WorkspaceRecord.kind == kind)
        .order_by(WorkspaceRecord.created_at.desc())
    ).all()

    return [
        serialize(db, record, user)
        for record in rows
        if can_view(db, user, record)
    ]

@router.post("/{kind}", status_code=201)
def create_record(
    kind: str,
    payload: RecordCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if kind not in KINDS:
        raise HTTPException(404, "Workspace module not found.")

    if user.role not in CREATE_ROLES[kind]:
        raise HTTPException(403, "You do not have permission to create this record.")

    owner_id = payload.owner_user_id

    if kind in {"leave", "submissions"}:
        owner_id = user.id

    if kind in {
        "goals", "feedback", "evaluations", "onboarding"
    }:
        if owner_id is None:
            raise HTTPException(400, "Select an intern for this record.")

    if kind == "certifications" and user.role == "intern":
        owner_id = user.id
    elif kind == "certifications" and owner_id is None:
        raise HTTPException(400, "Select an intern for this record.")

    if owner_id is not None:
        owner = db.get(User, owner_id)
        if owner is None or owner.role != "intern":
            raise HTTPException(400, "Owner must be an intern account.")

    if user.role == "manager" and owner_id is not None:
        if kind != "learning" and not assigned_to_manager(db, user.id, owner_id):
            raise HTTPException(403, "You can only create records for assigned interns.")

    if kind == "leave":
        if payload.start_date is None or payload.end_date is None:
            raise HTTPException(400, "Leave start and end dates are required.")
        if payload.end_date < payload.start_date:
            raise HTTPException(400, "Leave end date cannot precede start date.")
        if payload.start_date < date.today():
            raise HTTPException(400, "Leave start date cannot be in the past.")

    status = (
        "pending" if kind == "leave"
        else "submitted" if kind == "submissions"
        else "open"
    )

    record = WorkspaceRecord(
        kind=kind,
        title=payload.title.strip(),
        description=payload.description,
        owner_user_id=owner_id,
        created_by_id=user.id,
        due_date=payload.due_date,
        start_date=payload.start_date,
        end_date=payload.end_date,
        value=payload.value,
        status=status,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return serialize(db, record, user)

@router.patch("/{kind}/{record_id}/acknowledgement")
def acknowledge_record(
    kind: str,
    record_id: int,
    payload: AcknowledgementUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != "intern":
        raise HTTPException(403, "Only interns can acknowledge records.")

    if kind not in INTERN_ACK_STATUSES:
        raise HTTPException(400, "Acknowledgements are not supported for this module.")

    if payload.status not in INTERN_ACK_STATUSES[kind]:
        raise HTTPException(400, "Invalid acknowledgement status.")

    record = db.get(WorkspaceRecord, record_id)

    if record is None or record.kind != kind:
        raise HTTPException(404, "Record not found.")

    if not can_view(db, user, record):
        raise HTTPException(403, "You cannot acknowledge this record.")

    acknowledgement = db.scalar(
        select(WorkspaceAcknowledgement).where(
            WorkspaceAcknowledgement.record_id == record.id,
            WorkspaceAcknowledgement.intern_user_id == user.id,
        )
    )

    if acknowledgement is None:
        acknowledgement = WorkspaceAcknowledgement(
            record_id=record.id,
            intern_user_id=user.id,
            status=payload.status,
        )
        db.add(acknowledgement)
    else:
        acknowledgement.status = payload.status

    db.commit()
    db.refresh(acknowledgement)

    return {
        "record_id": record.id,
        "acknowledgement_status": acknowledgement.status,
    }

@router.patch("/{kind}/{record_id}")
def update_record(
    kind: str,
    record_id: int,
    payload: RecordUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if kind not in KINDS:
        raise HTTPException(404, "Workspace module not found.")

    record = db.get(WorkspaceRecord, record_id)

    if record is None or record.kind != kind:
        raise HTTPException(404, "Record not found.")

    if not can_view(db, user, record):
        raise HTTPException(403, "Access denied.")

    changes = payload.model_dump(exclude_unset=True)

    if not changes:
        raise HTTPException(400, "Provide at least one field to update.")

    if user.role == "intern":
        # Interns may update only their own submitted work.
        if kind != "submissions" or record.owner_user_id != user.id:
            raise HTTPException(403, "Use the acknowledgement endpoint for responses.")
        if "status" in changes:
            raise HTTPException(403, "Interns cannot change submission review status.")
        allowed_fields = {"title", "description", "due_date", "value"}

    elif user.role == "manager":
        if kind == "leave":
            if record.owner_user_id != user.id:
                raise HTTPException(403, "You cannot update this leave request.")
            allowed_fields = {"status"}
        elif kind == "submissions":
            if not assigned_to_manager(db, user.id, record.owner_user_id):
                raise HTTPException(403, "You can only review assigned interns.")
            allowed_fields = {"status"}
        elif kind == "feedback":
            if record.created_by_id != user.id:
                raise HTTPException(403, "You can only update your own feedback.")
            allowed_fields = {"title", "description", "status", "due_date", "value"}
        elif kind in {"goals", "evaluations"}:
            if not assigned_to_manager(db, user.id, record.owner_user_id):
                raise HTTPException(403, "You can only update assigned interns.")
            allowed_fields = {"title", "description", "due_date", "value"}
            if kind == "evaluations":
                allowed_fields.add("status")
        elif kind == "learning":
            allowed_fields = {"title", "description", "due_date", "value"}
        else:
            raise HTTPException(403, "You cannot update this module.")

    elif user.role == "hr":
        if kind == "feedback" and record.created_by_id != user.id:
            raise HTTPException(403, "You can only update your own feedback.")
        allowed_fields = {
            "title", "description", "status", "due_date",
            "start_date", "end_date", "value",
        }
        if kind == "goals":
            allowed_fields = {"title", "description", "due_date", "value"}
        if kind == "learning":
            allowed_fields = {"title", "description", "due_date", "value"}
    else:
        raise HTTPException(403, "Access denied.")

    forbidden = set(changes) - allowed_fields
    if forbidden:
        raise HTTPException(403, "You do not have permission to change these fields.")

    if "status" in changes:
        if changes["status"] not in STAFF_STATUSES[kind]:
            raise HTTPException(400, f"Invalid staff status for {kind}.")

    new_start = changes.get("start_date", record.start_date)
    new_end = changes.get("end_date", record.end_date)

    if kind == "leave":
        if new_start is None or new_end is None or new_end < new_start:
            raise HTTPException(400, "A valid leave date range is required.")

    for field, value in changes.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)

    return serialize(db, record, user)
