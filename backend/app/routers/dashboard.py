from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.dashboard import (
    AvailableRoomResponse,
    DashboardOverviewResponse,
    MonthlyBookingReportResponse,
    ResourceUsageResponse,
    RoomUtilizationResponse,
    UpcomingMeetingResponse,
)
from app.services.dashboard_service import (
    get_available_rooms,
    get_dashboard_overview,
    get_monthly_booking_report,
    get_resource_usage,
    get_room_utilization,
    get_upcoming_meetings,
)
from fastapi.responses import StreamingResponse

from app.services.report_export_service import (
    create_excel_report,
    create_pdf_report,
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard & Reports"],
)


@router.get(
    "/overview",
    response_model=DashboardOverviewResponse,
)
def dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_dashboard_overview(db)


@router.get(
    "/upcoming-meetings",
    response_model=list[UpcomingMeetingResponse],
)
def upcoming_meetings(
    limit: int = Query(
        default=10,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_upcoming_meetings(
        db,
        limit,
    )


@router.get(
    "/available-rooms",
    response_model=list[AvailableRoomResponse],
)
def available_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_available_rooms(db)


@router.get(
    "/room-utilization",
    response_model=list[RoomUtilizationResponse],
)
def room_utilization(
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
    current_user: User = Depends(get_current_user),
):
    return get_room_utilization(
        db,
        year,
        month,
    )


@router.get(
    "/resource-usage",
    response_model=list[ResourceUsageResponse],
)
def resource_usage(
    year: int | None = Query(
        default=None,
        ge=2000,
        le=2100,
    ),
    month: int | None = Query(
        default=None,
        ge=1,
        le=12,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if (year is None) != (month is None):
        raise HTTPException(
            status_code=400,
            detail=(
                "year and month must be provided together"
            ),
        )

    return get_resource_usage(
        db,
        year,
        month,
    )


@router.get(
    "/monthly-report",
    response_model=MonthlyBookingReportResponse,
)
def monthly_booking_report(
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
    current_user: User = Depends(get_current_user),
):
    return get_monthly_booking_report(
        db,
        year,
        month,
    )
@router.get(
    "/export/excel",
)
def export_excel(
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
    current_user: User = Depends(get_current_user),
):
    output = create_excel_report(
        db,
        year,
        month,
    )

    filename = (
        f"meeting_room_report_{year}_{month:02d}.xlsx"
    )

    return StreamingResponse(
        output,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )


@router.get(
    "/export/pdf",
)
def export_pdf(
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
    current_user: User = Depends(get_current_user),
):
    output = create_pdf_report(
        db,
        year,
        month,
    )

    filename = (
        f"meeting_room_report_{year}_{month:02d}.pdf"
    )

    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )