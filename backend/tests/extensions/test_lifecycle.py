"""Tests for the additive Sattva lifecycle extension."""

from datetime import date
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.extensions.lifecycle import get_visible_interns, build_progress


class FakeResult:
    def __init__(self, rows=None, records=None):
        self.rows = rows or []
        self.records = records or []

    def all(self):
        return self.rows


class FakeDB:
    def __init__(self, rows=None, records=None):
        self.rows = rows or []
        self.records = records or []

    def execute(self, query):
        return FakeResult(rows=self.rows)

    def scalars(self, query):
        return FakeResult(records=self.records)


def make_user(user_id, role, full_name="Test User"):
    return SimpleNamespace(
        id=user_id,
        role=role,
        full_name=full_name,
        email=f"user{user_id}@example.test",
    )


def make_intern(user_id, mentor_id=10):
    return SimpleNamespace(
        user_id=user_id,
        intern_code=f"INT-{user_id}",
        department="Engineering",
        mentor_id=mentor_id,
        start_date=date(2026, 1, 1),
        end_date=None,
        status="active",
    )


def test_hr_can_view_intern_list():
    hr = make_user(1, "hr")
    intern_user = make_user(2, "intern", "Intern One")
    intern = make_intern(2)

    db = FakeDB(rows=[(intern, intern_user)])

    result = get_visible_interns(db, hr)

    assert len(result) == 1
    assert result[0][1].id == 2


def test_manager_can_query_visible_interns():
    manager = make_user(10, "manager")
    db = FakeDB()

    result = get_visible_interns(db, manager)

    assert result == []


def test_intern_can_query_own_profile_list():
    intern_user = make_user(2, "intern")
    db = FakeDB()

    result = get_visible_interns(db, intern_user)

    assert result == []


def test_unknown_role_is_rejected():
    unknown_user = make_user(99, "unknown")
    db = FakeDB()

    with pytest.raises(HTTPException) as error:
        get_visible_interns(db, unknown_user)

    assert error.value.status_code == 403


def test_progress_is_zero_when_no_records():
    account = make_user(2, "intern", "Intern One")
    intern = make_intern(2)

    result = build_progress(FakeDB(records=[]), intern, account)

    assert result["progress"]["total_records"] == 0
    assert result["progress"]["completed_records"] == 0
    assert result["progress"]["completion_percent"] == 0
    assert "onboarding" in result["modules"]
    assert "goals" in result["modules"]
