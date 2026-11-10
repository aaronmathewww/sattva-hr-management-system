
from fastapi import APIRouter, Depends

from app.core.auth_dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(
    current_user: User = Depends(get_current_user),
):
    summaries = {
        "intern": {
            "workspace": "Intern Workspace",
            "description": "Your internship journey and personal progress.",
            "modules": [
                "Goals & Progress",
                "Feedback & Reviews",
                "Leave Management",
                "Learning & Webinars",
                "Certifications",
            ],
        },
        "manager": {
            "workspace": "Mentor Workspace",
            "description": "Support interns and review their progress.",
            "modules": [
                "Assigned Interns",
                "Goals & Progress",
                "Feedback & Reviews",
                "Leave Management",
                "Learning & Webinars",
            ],
        },
        "hr": {
            "workspace": "HR Workspace",
            "description": "Manage internship operations and intern records.",
            "modules": [
                "Intern Management",
                "Goals & Progress",
                "Feedback & Reviews",
                "Leave Management",
                "Learning & Webinars",
                "Certifications",
            ],
        },
    }

    summary = summaries.get(current_user.role, summaries["intern"])

    return {
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role,
        },
        "workspace": summary["workspace"],
        "description": summary["description"],
        "modules": summary["modules"],
    }
