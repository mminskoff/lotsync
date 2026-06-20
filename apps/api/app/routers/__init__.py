from fastapi import APIRouter

from app.routers import (
    assignments,
    audit_logs,
    dealerships,
    esl_devices,
    inventory_sources,
    mobile,
    pairings,
    sync_events,
    vehicles,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(dealerships.router)
api_router.include_router(vehicles.router)
api_router.include_router(esl_devices.router)
api_router.include_router(assignments.router)
api_router.include_router(pairings.router)
api_router.include_router(mobile.router)
api_router.include_router(inventory_sources.router)
api_router.include_router(sync_events.router)
api_router.include_router(audit_logs.router)
