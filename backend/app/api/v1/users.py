
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth_dependencies import get_current_user
from app.core.passwords import hash_password
from app.db.session import get_db
from app.models.user import User
from app.models.intern import Intern

router = APIRouter(prefix="/users", tags=["users"])


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=150)
    password: str = Field(min_length=12, max_length=128)
    role: str = "intern"


class UserSummary(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool


@router.get("", response_model=list[UserSummary])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in {"hr", "manager"}:
        raise HTTPException(status_code=403, detail="Access denied.")

    statement = select(User).order_by(User.full_name.asc())

    if current_user.role == "manager":
        assigned_user_ids = select(Intern.user_id).where(Intern.mentor_id == current_user.id)
        statement = statement.where(User.id.in_(assigned_user_ids))

    users = db.scalars(statement).all()

    return [
        UserSummary(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=user.is_active,
        )
        for user in users
    ]


@router.post("", response_model=UserSummary, status_code=201)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "hr":
        raise HTTPException(
            status_code=403,
            detail="Only HR can create user accounts.",
        )

    if payload.role not in {"intern", "manager"}:
        raise HTTPException(
            status_code=400,
            detail="New accounts must have the intern or manager role.",
        )

    email = str(payload.email).strip().lower()

    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )

    user = User(
        email=email,
        full_name=payload.full_name.strip(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return UserSummary(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
    )


@router.patch("/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "hr":
        raise HTTPException(
            status_code=403,
            detail="Only HR can deactivate accounts.",
        )

    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account.",
        )

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")

    user.is_active = False
    db.commit()

    return {"message": "Account deactivated successfully."}
