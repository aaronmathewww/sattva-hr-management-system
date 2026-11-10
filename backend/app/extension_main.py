"""Separate entry point for Sattva's additive lifecycle API."""

from app.main import app
from app.extensions.lifecycle import router as lifecycle_router

app.include_router(lifecycle_router, prefix="/api/v1")
