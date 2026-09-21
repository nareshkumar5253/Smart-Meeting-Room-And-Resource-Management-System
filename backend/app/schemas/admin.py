from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AdminUserResponse(BaseModel):
    id: int
    name: str
    email: str
    role_id: int | None
    department_id: int | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class AdminUserUpdate(BaseModel):
    role_id: int | None = Field(
        default=None,
        ge=1,
    )

    department_id: int | None = Field(
        default=None,
        ge=1,
    )

    is_active: bool | None = None


class AdminBookingHistoryResponse(BaseModel):
    id: int
    user_id: int
    room_id: int
    title: str
    start_datetime: datetime
    end_datetime: datetime
    status: str
    is_recurring: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class AdminBookingStatisticsResponse(BaseModel):
    total_bookings: int
    confirmed_bookings: int
    cancelled_bookings: int
    recurring_bookings: int
    total_booked_hours: float
    total_rooms: int
    available_rooms: int
    total_resources: int


class AdminReportResponse(BaseModel):
    year: int
    month: int
    total_bookings: int
    confirmed_bookings: int
    cancelled_bookings: int
    recurring_bookings: int
    total_booked_hours: float
    room_utilization: list[dict]
    resource_usage: list[dict]