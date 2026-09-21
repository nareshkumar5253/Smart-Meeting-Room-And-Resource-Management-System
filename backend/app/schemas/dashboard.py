from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UpcomingMeetingResponse(BaseModel):
    booking_id: int
    title: str
    room_id: int
    user_id: int
    start_datetime: datetime
    end_datetime: datetime
    status: str

    model_config = ConfigDict(
        from_attributes=True,
    )


class RoomUtilizationResponse(BaseModel):
    room_id: int
    room_name: str
    room_code: str
    total_bookings: int
    total_booked_hours: float
    utilization_percentage: float


class ResourceUsageResponse(BaseModel):
    resource_id: int
    resource_name: str
    resource_code: str
    total_quantity_booked: int
    booking_count: int


class MonthlyBookingReportResponse(BaseModel):
    year: int
    month: int
    total_bookings: int
    confirmed_bookings: int
    cancelled_bookings: int
    recurring_bookings: int
    total_booked_hours: float


class AvailableRoomResponse(BaseModel):
    room_id: int
    room_name: str
    room_code: str
    location: str | None
    capacity: int
    facilities: str | None
    is_available: bool


class DashboardOverviewResponse(BaseModel):
    upcoming_meetings: int
    available_rooms: int
    total_rooms: int
    total_resources: int
    active_bookings: int