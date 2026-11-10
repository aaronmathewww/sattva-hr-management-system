from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.core.tokens import create_access_token
from app.core.passwords import hash_password
from app.models.user import User
from app.models.intern import Intern
from app.models.workspace_record import WorkspaceRecord

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def setup_records():
    db = TestingSession()
    db.query(WorkspaceRecord).delete()
    db.query(Intern).delete()
    db.query(User).delete()
    hr = User(email="hr-test@example.com", full_name="HR Test", password_hash=hash_password("SafeTestPassword123!"), role="hr", is_active=True)
    manager = User(email="manager-test@example.com", full_name="Manager Test", password_hash=hash_password("SafeTestPassword123!"), role="manager", is_active=True)
    intern1 = User(email="intern1-test@example.com", full_name="Intern One", password_hash=hash_password("SafeTestPassword123!"), role="intern", is_active=True)
    intern2 = User(email="intern2-test@example.com", full_name="Intern Two", password_hash=hash_password("SafeTestPassword123!"), role="intern", is_active=True)
    db.add_all([hr, manager, intern1, intern2]); db.commit()
    db.add_all([
        Intern(user_id=intern1.id, intern_code="TST001", department="Analytics", mentor_id=manager.id, start_date=date(2026, 1, 1), status="active"),
        Intern(user_id=intern2.id, intern_code="TST002", department="Analytics", mentor_id=None, start_date=date(2026, 1, 1), status="active"),
    ])
    db.commit()
    own_goal = WorkspaceRecord(kind="goals", title="Own goal", status="open", owner_user_id=intern1.id, created_by_id=hr.id)
    other_goal = WorkspaceRecord(kind="goals", title="Other goal", status="open", owner_user_id=intern2.id, created_by_id=hr.id)
    submission = WorkspaceRecord(kind="submissions", title="My submission", status="submitted", owner_user_id=intern1.id, created_by_id=intern1.id)
    onboarding = WorkspaceRecord(kind="onboarding", title="Identity documents", status="open", owner_user_id=intern1.id, created_by_id=hr.id)
    db.add_all([own_goal, other_goal, submission, onboarding]); db.commit()
    result = {"hr": hr.id, "manager": manager.id, "intern1": intern1.id, "intern2": intern2.id, "own_goal": own_goal.id, "submission": submission.id, "onboarding": onboarding.id}
    db.close()
    return result

def auth(user_id):
    return {"Authorization": f"Bearer {create_access_token(user_id)}"}

def test_intern_only_sees_own_goal_records():
    ids = setup_records()
    response = client.get("/api/v1/workspace/goals", headers=auth(ids["intern1"]))
    assert response.status_code == 200
    assert [item["title"] for item in response.json()] == ["Own goal"]

def test_manager_only_sees_assigned_intern_records():
    ids = setup_records()
    response = client.get("/api/v1/workspace/goals", headers=auth(ids["manager"]))
    assert response.status_code == 200
    assert [item["title"] for item in response.json()] == ["Own goal"]

def test_intern_cannot_change_submission_review_status():
    ids = setup_records()
    response = client.patch(
        f"/api/v1/workspace/submissions/{ids['submission']}",
        headers=auth(ids["intern1"]),
        json={"status": "reviewed"},
    )
    assert response.status_code == 403

def teardown_module():
    app.dependency_overrides.pop(get_db, None)


def test_manager_cannot_change_hr_only_onboarding_record():
    ids = setup_records()
    response = client.patch(
        f"/api/v1/workspace/onboarding/{ids['onboarding']}",
        headers=auth(ids["manager"]),
        json={"title": "Changed by manager"},
    )
    assert response.status_code == 403


def test_manager_can_review_assigned_intern_submission():
    ids = setup_records()
    response = client.patch(
        f"/api/v1/workspace/submissions/{ids['submission']}",
        headers=auth(ids["manager"]),
        json={"status": "reviewed"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "reviewed"


def test_manager_cannot_review_unassigned_intern_submission():
    ids = setup_records()
    db = TestingSession()
    other_submission = WorkspaceRecord(
        kind="submissions", title="Unassigned submission", status="submitted",
        owner_user_id=ids["intern2"], created_by_id=ids["intern2"]
    )
    db.add(other_submission); db.commit(); record_id = other_submission.id; db.close()
    response = client.patch(
        f"/api/v1/workspace/submissions/{record_id}",
        headers=auth(ids["manager"]),
        json={"status": "reviewed"},
    )
    assert response.status_code == 403


def test_invalid_status_transition_is_rejected():
    ids = setup_records()
    db = TestingSession()
    evaluation = WorkspaceRecord(
        kind="evaluations", title="Quarterly review", status="open",
        owner_user_id=ids["intern1"], created_by_id=ids["hr"],
    )
    db.add(evaluation)
    db.commit()
    evaluation_id = evaluation.id
    db.close()

    response = client.patch(
        f"/api/v1/workspace/evaluations/{evaluation_id}",
        headers=auth(ids["manager"]),
        json={"status": "approved"},
    )
    assert response.status_code == 400
