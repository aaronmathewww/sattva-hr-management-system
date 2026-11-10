"""Separate entry point with lifecycle reports and CSV export."""

from app.extension_reports_main import app
from app.extensions.lifecycle_csv import router as csv_router

app.include_router(csv_router, prefix="/api/v1")
