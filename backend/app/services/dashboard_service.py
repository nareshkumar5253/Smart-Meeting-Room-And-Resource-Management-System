from calendar import monthrange
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.booking_resource import BookingResource
from app.models.meeting_room import MeetingRoom
from app.models.resource import Resource


def get_upcoming_meetings(
    db: Session,
    limit: int = 10,
) -> list[dict]:

    now = datetime.now()

    bookings = (
        db.query(Booking)
        .filter(
            Booking.start_datetime >= now,
            Booking.status == "CONFIRMED",
        )
        .order_by(
            Booking.start_datetime.asc()
        )
        .limit(limit)
        .all()
    )

    return [
        {
            "booking_id": booking.id,
            "title": booking.title,
            "room_id": booking.room_id,
            "user_id": booking.user_id,
            "start_datetime": booking.start_datetime,
            "end_datetime": booking.end_datetime,
            "status": booking.status,
        }
        for booking in bookings
    ]


def get_available_rooms(
    db: Session,
) -> list[dict]:

    rooms = (
        db.query(MeetingRoom)
        .filter(
            MeetingRoom.is_available.is_(True)
        )
        .order_by(
            MeetingRoom.id.asc()
        )
        .all()
    )

    return [
        {
            "room_id": room.id,
            "room_name": room.name,
            "room_code": room.room_code,
            "location": room.location,
            "capacity": room.capacity,
            "facilities": room.facilities,
            "is_available": room.is_available,
        }
        for room in rooms
    ]


def get_room_utilization(
    db: Session,
    year: int,
    month: int,
) -> list[dict]:

    month_start = datetime(
        year,
        month,
        1,
    )

    if month == 12:
        next_month = datetime(
            year + 1,
            1,
            1,
        )
    else:
        next_month = datetime(
            year,
            month + 1,
            1,
        )

    rooms = (
        db.query(MeetingRoom)
        .order_by(MeetingRoom.id.asc())
        .all()
    )

    bookings = (
        db.query(Booking)
        .filter(
            Booking.start_datetime < next_month,
            Booking.end_datetime > month_start,
            Booking.status == "CONFIRMED",
        )
        .all()
    )

    days_in_month = monthrange(
        year,
        month,
    )[1]

    total_month_hours = days_in_month * 24

    results = []

    for room in rooms:
        room_bookings = [
            booking
            for booking in bookings
            if booking.room_id == room.id
        ]

        booked_hours = 0.0

        for booking in room_bookings:
            effective_start = max(
                booking.start_datetime,
                month_start,
            )

            effective_end = min(
                booking.end_datetime,
                next_month,
            )

            duration_seconds = (
                effective_end - effective_start
            ).total_seconds()

            if duration_seconds > 0:
                booked_hours += (
                    duration_seconds / 3600
                )

        utilization_percentage = 0.0

        if total_month_hours > 0:
            utilization_percentage = round(
                (
                    booked_hours
                    / total_month_hours
                ) * 100,
                2,
            )

        results.append(
            {
                "room_id": room.id,
                "room_name": room.name,
                "room_code": room.room_code,
                "total_bookings": len(
                    room_bookings
                ),
                "total_booked_hours": round(
                    booked_hours,
                    2,
                ),
                "utilization_percentage": utilization_percentage,
            }
        )

    return results


def get_resource_usage(
    db: Session,
    year: int | None = None,
    month: int | None = None,
) -> list[dict]:

    query = (
        db.query(BookingResource)
        .join(
            Booking,
            Booking.id == BookingResource.booking_id,
        )
        .filter(
            Booking.status == "CONFIRMED",
        )
    )

    if year is not None and month is not None:
        month_start = datetime(
            year,
            month,
            1,
        )

        if month == 12:
            next_month = datetime(
                year + 1,
                1,
                1,
            )
        else:
            next_month = datetime(
                year,
                month + 1,
                1,
            )

        query = query.filter(
            Booking.start_datetime < next_month,
            Booking.end_datetime > month_start,
        )

    usage_rows = query.all()

    resources = (
        db.query(Resource)
        .order_by(Resource.id.asc())
        .all()
    )

    results = []

    for resource in resources:
        matching_rows = [
            row
            for row in usage_rows
            if row.resource_id == resource.id
        ]

        total_quantity_booked = sum(
            row.quantity
            for row in matching_rows
        )

        results.append(
            {
                "resource_id": resource.id,
                "resource_name": resource.name,
                "resource_code": resource.resource_code,
                "total_quantity_booked": (
                    total_quantity_booked
                ),
                "booking_count": len(
                    matching_rows
                ),
            }
        )

    return results


def get_monthly_booking_report(
    db: Session,
    year: int,
    month: int,
) -> dict:

    month_start = datetime(
        year,
        month,
        1,
    )

    if month == 12:
        next_month = datetime(
            year + 1,
            1,
            1,
        )
    else:
        next_month = datetime(
            year,
            month + 1,
            1,
        )

    bookings = (
        db.query(Booking)
        .filter(
            Booking.start_datetime < next_month,
            Booking.end_datetime > month_start,
        )
        .all()
    )

    total_bookings = len(bookings)

    confirmed_bookings = sum(
        1
        for booking in bookings
        if booking.status == "CONFIRMED"
    )

    cancelled_bookings = sum(
        1
        for booking in bookings
        if booking.status == "CANCELLED"
    )

    recurring_bookings = sum(
        1
        for booking in bookings
        if booking.is_recurring
    )

    total_booked_hours = 0.0

    for booking in bookings:
        if booking.status != "CONFIRMED":
            continue

        effective_start = max(
            booking.start_datetime,
            month_start,
        )

        effective_end = min(
            booking.end_datetime,
            next_month,
        )

        duration_seconds = (
            effective_end - effective_start
        ).total_seconds()

        if duration_seconds > 0:
            total_booked_hours += (
                duration_seconds / 3600
            )

    return {
        "year": year,
        "month": month,
        "total_bookings": total_bookings,
        "confirmed_bookings": confirmed_bookings,
        "cancelled_bookings": cancelled_bookings,
        "recurring_bookings": recurring_bookings,
        "total_booked_hours": round(
            total_booked_hours,
            2,
        ),
    }


def get_dashboard_overview(
    db: Session,
) -> dict:

    now = datetime.now()

    upcoming_meetings = (
        db.query(Booking)
        .filter(
            Booking.start_datetime >= now,
            Booking.status == "CONFIRMED",
        )
        .count()
    )

    total_rooms = (
        db.query(MeetingRoom)
        .count()
    )

    available_rooms = (
        db.query(MeetingRoom)
        .filter(
            MeetingRoom.is_available.is_(True)
        )
        .count()
    )

    total_resources = (
        db.query(Resource)
        .count()
    )

    active_bookings = (
        db.query(Booking)
        .filter(
            Booking.status == "CONFIRMED",
            Booking.end_datetime >= now,
        )
        .count()
    )

    return {
        "upcoming_meetings": upcoming_meetings,
        "available_rooms": available_rooms,
        "total_rooms": total_rooms,
        "total_resources": total_resources,
        "active_bookings": active_bookings,
    }