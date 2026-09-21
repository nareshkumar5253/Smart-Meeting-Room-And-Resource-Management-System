from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.booking import (
    BookingCreate,
    BookingResponse,
    BookingUpdate,
)
from app.schemas.booking_resource import BookingResourceResponse
from app.schemas.common import PaginatedResponse
from app.services.booking_service import (
    cancel_booking,
    create_booking,
    get_all_bookings,
    get_booking_by_id,
    get_booking_resources,
    get_bookings_for_user,
    update_booking,
)


router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"],
)


@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_booking_api(
    booking_data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        booking_resources = [
            resource.model_dump()
            for resource in booking_data.resources
        ]

        return create_booking(
            db,
            current_user.id,
            booking_data,
            booking_resources,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get(
    "",
    response_model=PaginatedResponse[BookingResponse],
)
def get_bookings(
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
    status_filter: str | None = Query(
        default=None,
        alias="status",
    ),
    room_id: int | None = Query(
        default=None,
        ge=1,
    ),
    start_from: datetime | None = None,
    start_to: datetime | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.name == "ADMIN":
        return get_all_bookings(
            db=db,
            page=page,
            page_size=page_size,
            search=search,
            status=status_filter,
            room_id=room_id,
            start_from=start_from,
            start_to=start_to,
        )

    return get_bookings_for_user(
        db=db,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        search=search,
        status=status_filter,
        room_id=room_id,
    )


@router.get(
    "/my",
    response_model=PaginatedResponse[BookingResponse],
)
def get_my_bookings(
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
    status_filter: str | None = Query(
        default=None,
        alias="status",
    ),
    room_id: int | None = Query(
        default=None,
        ge=1,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_bookings_for_user(
        db=db,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        search=search,
        status=status_filter,
        room_id=room_id,
    )


@router.get(
    "/{booking_id}/resources",
    response_model=list[BookingResourceResponse],
)
def get_booking_resource_list(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = get_booking_by_id(
        db,
        booking_id,
    )

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    if (
        current_user.role.name != "ADMIN"
        and booking.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own bookings",
        )

    return get_booking_resources(
        db,
        booking_id,
    )


@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = get_booking_by_id(
        db,
        booking_id,
    )

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    if (
        current_user.role.name != "ADMIN"
        and booking.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own bookings",
        )

    return booking


@router.put(
    "/{booking_id}",
    response_model=BookingResponse,
)
def update_booking_api(
    booking_id: int,
    booking_data: BookingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = get_booking_by_id(
        db,
        booking_id,
    )

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    if (
        current_user.role.name != "ADMIN"
        and booking.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only modify your own bookings",
        )

    if booking.status == "CANCELLED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled booking cannot be modified",
        )

    try:
        booking_resources = None

        if booking_data.resources is not None:
            booking_resources = [
                resource.model_dump()
                for resource in booking_data.resources
            ]

        return update_booking(
            db,
            booking,
            booking_data,
            booking_resources,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.patch(
    "/{booking_id}/cancel",
    response_model=BookingResponse,
)
def cancel_booking_api(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = get_booking_by_id(
        db,
        booking_id,
    )

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    if (
        current_user.role.name != "ADMIN"
        and booking.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own bookings",
        )

    try:
        return cancel_booking(
            db,
            booking,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )