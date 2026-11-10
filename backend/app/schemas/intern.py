
from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class InternCreate(BaseModel):
    user_id: int = Field(gt=0)
    intern_code: str = Field(min_length=2, max_length=30)
    department: str = Field(min_length=2, max_length=120)
    college: str | None = Field(default=None, max_length=200)
    mentor_id: int | None = Field(default=None, gt=0)
    start_date: date
    end_date: date | None = None
    status: str = "active"
    bio: str | None = Field(default=None, max_length=2000)


class InternUpdate(BaseModel):
    intern_code: str | None = Field(default=None, min_length=2, max_length=30)
    department: str | None = Field(default=None, min_length=2, max_length=120)
    college: str | None = Field(default=None, max_length=200)
    mentor_id: int | None = Field(default=None, gt=0)
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None
    bio: str | None = Field(default=None, max_length=2000)


class InternResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    full_name: str | None = None
    email: str | None = None
    intern_code: str
    department: str
    college: str | None
    mentor_id: int | None
    start_date: date
    end_date: date | None
    status: str
    bio: str | None
