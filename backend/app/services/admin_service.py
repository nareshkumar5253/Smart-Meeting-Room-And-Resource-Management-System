from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.department import Department
from app.models.role import Role
from app.models.user import User
from app.services.dashboard_service import (
    get_monthly_booking_report,
    get_resource_usage,
    get_room_utilization,
)


# ============================================================
# ADMIN USER MANAGEMENT
# ============================================================

def get_all_users(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    role_id: int | None = None,
    is_active: bool | None = None,
):
    query = db.query(User)

    # Search by user name or email
    if search:
        search_value = f"%{search.strip()}%"

        query = query.filter(
            or_(
                User.name.ilike(search_value),
                User.email.ilike(search_value),
            )
        )

    # Filter by role
    if role_id is not None:
        query = query.filter(
            User.role_id == role_id
        )

    # Filter by active/inactive status
    if is_active is not None:
        query = query.filter(
            User.is_active == is_active
        )

    # Sorting
    query = query.order_by(
        User.id.asc()
    )

    # Total records
    total = query.count()

    # Total pages
    total_pages = (
        (total + page_size - 1) // page_size
        if total > 0
        else 0
    )

    # Pagination
    offset = (page - 1) * page_size

    items = (
        query
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return {
        "items": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
        },
    }


def get_user_by_id(
    db: Session,
    user_id: int,
) -> User | None:

    return (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )


def update_user(
    db: Session,
    user: User,
    role_id: int | None = None,
    department_id: int | None = None,
    is_active: bool | None = None,
) -> User:

    # Update role
    if role_id is not None:

        role = (
            db.query(Role)
            .filter(
                Role.id == role_id
            )
            .first()
        )

        if not role:
            raise ValueError(
                "Role not found"
            )

        user.role_id = role_id

    # Update department
    if department_id is not None:

        department = (
            db.query(Department)
            .filter(
                Department.id == department_id
            )
            .first()
        )

        if not department:
            raise ValueError(
                "Department not found"
            )

        user.department_id = department_id

    # Update active status
    if is_active is not None:
        user.is_active = is_active

    db.commit()
    db.refresh(user)

    return user


# ============================================================
# ADMIN BOOKING HISTORY
# ============================================================

def get_booking_history(
    db: Session,
) -> list[Booking]:

    return (
        db.query(Booking)
        .order_by(
            Booking.created_at.desc()
        )
        .all()
    )


# ============================================================
# ADMIN BOOKING STATISTICS
# ============================================================

def get_admin_booking_statistics(
    db: Session,
) -> dict:

    from app.models.meeting_room import MeetingRoom
    from app.models.resource import Resource

    # Total bookings
    total_bookings = (
        db.query(Booking)
        .count()
    )

    # Confirmed bookings
    confirmed_bookings = (
        db.query(Booking)
        .filter(
            Booking.status == "CONFIRMED"
        )
        .count()
    )

    # Cancelled bookings
    cancelled_bookings = (
        db.query(Booking)
        .filter(
            Booking.status == "CANCELLED"
        )
        .count()
    )

    # Recurring bookings
    recurring_bookings = (
        db.query(Booking)
        .filter(
            Booking.is_recurring.is_(True)
        )
        .count()
    )

    # Confirmed bookings for total hours
    bookings = (
        db.query(Booking)
        .filter(
            Booking.status == "CONFIRMED"
        )
        .all()
    )

    total_booked_hours = 0.0

    for booking in bookings:

        duration_seconds = (
            booking.end_datetime
            - booking.start_datetime
        ).total_seconds()

        total_booked_hours += (
            duration_seconds / 3600
        )

    # Total rooms
    total_rooms = (
        db.query(MeetingRoom)
        .count()
    )

    # Available rooms
    available_rooms = (
        db.query(MeetingRoom)
        .filter(
            MeetingRoom.is_available.is_(True)
        )
        .count()
    )

    # Total resources
    total_resources = (
        db.query(Resource)
        .count()
    )

    return {
        "total_bookings": total_bookings,
        "confirmed_bookings": confirmed_bookings,
        "cancelled_bookings": cancelled_bookings,
        "recurring_bookings": recurring_bookings,
        "total_booked_hours": round(
            total_booked_hours,
            2,
        ),
        "total_rooms": total_rooms,
        "available_rooms": available_rooms,
        "total_resources": total_resources,
    }


# ============================================================
# ADMIN MONTHLY REPORT
# ============================================================

def get_admin_monthly_report(
    db: Session,
    year: int,
    month: int,
) -> dict:

    monthly_report = get_monthly_booking_report(
        db,
        year,
        month,
    )

    room_utilization = get_room_utilization(
        db,
        year,
        month,
    )

    resource_usage = get_resource_usage(
        db,
        year,
        month,
    )

    return {
        "year": monthly_report["year"],
        "month": monthly_report["month"],
        "total_bookings": monthly_report[
            "total_bookings"
        ],
        "confirmed_bookings": monthly_report[
            "confirmed_bookings"
        ],
        "cancelled_bookings": monthly_report[
            "cancelled_bookings"
        ],
        "recurring_bookings": monthly_report[
            "recurring_bookings"
        ],
        "total_booked_hours": monthly_report[
            "total_booked_hours"
        ],
        "room_utilization": room_utilization,
        "resource_usage": resource_usage,
    }