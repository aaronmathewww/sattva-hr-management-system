
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth_dependencies import get_current_user
from app.db.session import get_db
from app.models.intern import Intern
from app.models.user import User
from app.schemas.intern import InternCreate, InternResponse, InternUpdate

router = APIRouter(prefix="/interns", tags=["interns"])


def require_hr(user: User):
    if user.role != "hr":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HR can perform this action.",
        )


def validate_intern_user(db: Session, user_id: int):
    account = db.get(User, user_id)
    if account is None or account.role != "intern":
        raise HTTPException(
            status_code=400,
            detail="The selected user must be an existing intern account.",
        )


def validate_mentor(db: Session, mentor_id: int | None):
    if mentor_id is None:
        return

    mentor = db.get(User, mentor_id)
    if mentor is None or mentor.role != "manager":
        raise HTTPException(
            status_code=400,
            detail="The selected mentor must be an existing manager account.",
        )


def serialize_intern(intern: Intern, account: User) -> dict:
    return {
        "id": intern.id,
        "user_id": intern.user_id,
        "full_name": account.full_name,
        "email": account.email,
        "intern_code": intern.intern_code,
        "department": intern.department,
        "college": intern.college,
        "mentor_id": intern.mentor_id,
        "start_date": intern.start_date,
        "end_date": intern.end_date,
        "status": intern.status,
        "bio": intern.bio,
    }


@router.get("", response_model=list[InternResponse])
def list_interns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = (
        select(Intern, User)
        .join(User, User.id == Intern.user_id)
        .order_by(Intern.id.desc())
    )

    if current_user.role == "intern":
        statement = statement.where(Intern.user_id == current_user.id)
    elif current_user.role == "manager":
        statement = statement.where(Intern.mentor_id == current_user.id)
    elif current_user.role != "hr":
        raise HTTPException(
            status_code=403,
            detail="Access denied.",
        )

    rows = db.execute(statement).all()

    return [
        serialize_intern(intern, account)
        for intern, account in rows
    ]


@router.post("", response_model=InternResponse, status_code=201)
def create_intern(
    payload: InternCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_hr(current_user)
    validate_intern_user(db, payload.user_id)
    validate_mentor(db, payload.mentor_id)

    if payload.end_date and payload.end_date < payload.start_date:
        raise HTTPException(
            status_code=400,
            detail="End date cannot be before start date.",
        )

    if db.scalar(
        select(Intern).where(Intern.user_id == payload.user_id)
    ):
        raise HTTPException(
            status_code=409,
            detail="This user already has an intern profile.",
        )

    if db.scalar(
        select(Intern).where(Intern.intern_code == payload.intern_code)
    ):
        raise HTTPException(
            status_code=409,
            detail="This intern code is already in use.",
        )

    intern = Intern(**payload.model_dump())
    db.add(intern)
    db.commit()
    db.refresh(intern)

    account = db.get(User, intern.user_id)
    return serialize_intern(intern, account)


@router.get("/{intern_id}", response_model=InternResponse)
def get_intern(
    intern_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    intern = db.get(Intern, intern_id)

    if intern is None:
        raise HTTPException(
            status_code=404,
            detail="Intern profile not found.",
        )

    allowed = (
        current_user.role == "hr"
        or (
            current_user.role == "intern"
            and intern.user_id == current_user.id
        )
        or (
            current_user.role == "manager"
            and intern.mentor_id == current_user.id
        )
    )

    if not allowed:
        raise HTTPException(
            status_code=403,
            detail="Access denied.",
        )

    account = db.get(User, intern.user_id)
    if account is None:
        raise HTTPException(
            status_code=500,
            detail="The intern's user account could not be found.",
        )

    return serialize_intern(intern, account)


@router.patch("/{intern_id}", response_model=InternResponse)
def update_intern(
    intern_id: int,
    payload: InternUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_hr(current_user)

    intern = db.get(Intern, intern_id)
    if intern is None:
        raise HTTPException(
            status_code=404,
            detail="Intern profile not found.",
        )

    changes = payload.model_dump(exclude_unset=True)

    if "user_id" in changes:
        raise HTTPException(
            status_code=400,
            detail="User assignment cannot be changed here.",
        )

    new_mentor_id = changes.get("mentor_id", intern.mentor_id)
    validate_mentor(db, new_mentor_id)

    new_start = changes.get("start_date", intern.start_date)
    new_end = changes.get("end_date", intern.end_date)

    if new_end and new_start and new_end < new_start:
        raise HTTPException(
            status_code=400,
            detail="End date cannot be before start date.",
        )

    new_code = changes.get("intern_code")
    if new_code and new_code != intern.intern_code:
        duplicate = db.scalar(
            select(Intern).where(Intern.intern_code == new_code)
        )
        if duplicate:
            raise HTTPException(
                status_code=409,
                detail="This intern code is already in use.",
            )

    allowed_statuses = {"active", "completed", "paused"}
    if "status" in changes and changes["status"] not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Status must be active, completed, or paused.",
        )

    for field, value in changes.items():
        setattr(intern, field, value)

    db.commit()
    db.refresh(intern)

    account = db.get(User, intern.user_id)
    if account is None:
        raise HTTPException(
            status_code=500,
            detail="The intern's user account could not be found.",
        )

    return serialize_intern(intern, account)
