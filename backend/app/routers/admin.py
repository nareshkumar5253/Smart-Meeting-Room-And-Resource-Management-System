from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.schemas.admin import (
    AdminBookingHistoryResponse,
    AdminBookingStatisticsResponse,
    AdminReportResponse,
    AdminUserResponse,
    AdminUserUpdate,
)
from app.schemas.common import PaginatedResponse
from app.services.admin_service import (
    get_admin_booking_statistics,
    get_admin_monthly_report,
    get_all_users,
    get_booking_history,
    get_user_by_id,
    update_user,
)


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


# ============================================================
# USER MANAGEMENT
# ============================================================

@router.get(
    "/users",
    response_model=PaginatedResponse[AdminUserResponse],
)
def admin_get_users(
    page: int = Query(
        default=1,
        ge=1,
    ),
    page_size: int = Query(
        default=10,
        ge=1,
        le=100,
    ),
    search: str | None = Query(
        default=None,
        min_length=1,
    ),
    role_id: int | None = Query(
        default=None,
        ge=1,
    ),
    is_active: bool | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return get_all_users(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        role_id=role_id,
        is_active=is_active,
    )


@router.get(
    "/users/{user_id}",
    response_model=AdminUserResponse,
)
def admin_get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = get_user_by_id(
        db,
        user_id,
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user


@router.put(
    "/users/{user_id}",
    response_model=AdminUserResponse,
)
def admin_update_user(
    user_id: int,
    user_data: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = get_user_by_id(
        db,
        user_id,
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    try:
        return update_user(
            db=db,
            user=user,
            role_id=user_data.role_id,
            department_id=user_data.department_id,
            is_active=user_data.is_active,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


# ============================================================
# BOOKING HISTORY
# ============================================================

@router.get(
    "/bookings",
    response_model=list[AdminBookingHistoryResponse],
)
def admin_booking_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return get_booking_history(db)


# ============================================================
# BOOKING STATISTICS
# ============================================================

@router.get(
    "/booking-statistics",
    response_model=AdminBookingStatisticsResponse,
)
def admin_booking_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return get_admin_booking_statistics(db)


# ============================================================
# MONTHLY ADMINISTRATIVE REPORT
# ============================================================

@router.get(
    "/reports/monthly",
    response_model=AdminReportResponse,
)
def admin_monthly_report(
    year: int = Query(
        ...,
        ge=2000,
        le=2100,
    ),
    month: int = Query(
        ...,
        ge=1,
        le=12,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return get_admin_monthly_report(
        db,
        year,
        month,
    )