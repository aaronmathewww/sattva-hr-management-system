"""Separate entry point with additive lifecycle reporting routes."""

from app.extension_main import app
from app.extensions.lifecycle_reports import router as reports_router

app.include_router(reports_router, prefix="/api/v1")
