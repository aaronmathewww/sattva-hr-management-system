"""Sattva extension entry point with lifecycle checklist."""

from app.extension_csv_main import app
from app.extensions.lifecycle_checklist import router as checklist_router

app.include_router(checklist_router, prefix="/api/v1")
