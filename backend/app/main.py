from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.meeting_rooms import router as meeting_rooms_router
from app.routers.resources import router as resources_router
from app.routers.room_resources import router as room_resources_router
from app.routers.bookings import router as bookings_router
from app.routers.notifications import router as notifications_router
from app.routers.dashboard import router as dashboard_router
from app.routers.admin import router as admin_router
from app.routers.audit import router as audit_router


app = FastAPI(
    title="Smart Meeting Room & Resource Management System",
    description=(
        "API for managing meeting rooms, resources, "
        "bookings, notifications, and reports."
    ),
    version="1.0.0",
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(auth_router)
app.include_router(meeting_rooms_router)
app.include_router(resources_router)
app.include_router(room_resources_router)
app.include_router(bookings_router)
app.include_router(notifications_router)
app.include_router(dashboard_router)
app.include_router(admin_router)
app.include_router(audit_router)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": (
            "Smart Meeting Room & Resource "
            "Management System API"
        ),
        "status": "running",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }