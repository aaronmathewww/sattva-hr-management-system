
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.interns import router as interns_router
from app.api.v1.users import router as users_router
from app.api.v1.workspace import router as workspace_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(interns_router)
api_router.include_router(users_router)
api_router.include_router(workspace_router)


@api_router.get("/status", tags=["system"])
def api_status():
    return {
        "status": "ok",
        "message": "API is running.",
    }

