from datetime import datetime, timedelta

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.booking_resource import BookingResource
from app.models.meeting_room import MeetingRoom
from app.models.resource import Resource
from app.models.room_resource import RoomResource
from app.schemas.booking import BookingCreate, BookingUpdate
from app.services.audit_service import create_audit_log
from app.services.notification_service import (
    create_booking_cancellation,
    create_booking_confirmation,
    schedule_meeting_reminder,
)


# ============================================================
# BOOKING LOOKUP
# ============================================================

def get_booking_by_id(
    db: Session,
    booking_id: int,
) -> Booking | None:
    return (
        db.query(Booking)
        .filter(Booking.id == booking_id)
        .first()
    )


# ============================================================
# BOOKING LIST WITH PAGINATION / SEARCH / FILTERING
# ============================================================

def get_all_bookings(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    status: str | None = None,
    room_id: int | None = None,
    start_from: datetime | None = None,
    start_to: datetime | None = None,
):
    query = db.query(Booking)

    if search:
        search_value = f"%{search.strip()}%"

        query = query.filter(
            or_(
                Booking.title.ilike(search_value),
                Booking.description.ilike(search_value),
            )
        )

    if status:
        query = query.filter(
            Booking.status == status.upper()
        )

    if room_id is not None:
        query = query.filter(
            Booking.room_id == room_id
        )

    if start_from is not None:
        query = query.filter(
            Booking.start_datetime >= start_from
        )

    if start_to is not None:
        query = query.filter(
            Booking.start_datetime <= start_to
        )

    query = query.order_by(
        Booking.start_datetime.asc()
    )

    total = query.count()

    total_pages = (
        (total + page_size - 1) // page_size
        if total > 0
        else 0
    )

    items = (
        query
        .offset((page - 1) * page_size)
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


def get_bookings_for_user(
    db: Session,
    user_id: int,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    status: str | None = None,
    room_id: int | None = None,
):
    query = (
        db.query(Booking)
        .filter(
            Booking.user_id == user_id
        )
    )

    if search:
        search_value = f"%{search.strip()}%"

        query = query.filter(
            or_(
                Booking.title.ilike(search_value),
                Booking.description.ilike(search_value),
            )
        )

    if status:
        query = query.filter(
            Booking.status == status.upper()
        )

    if room_id is not None:
        query = query.filter(
            Booking.room_id == room_id
        )

    query = query.order_by(
        Booking.start_datetime.asc()
    )

    total = query.count()

    total_pages = (
        (total + page_size - 1) // page_size
        if total > 0
        else 0
    )

    items = (
        query
        .offset((page - 1) * page_size)
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


# ============================================================
# CONFLICT DETECTION
# ============================================================

def check_room_conflict(
    db: Session,
    room_id: int,
    start_datetime,
    end_datetime,
    exclude_booking_id: int | None = None,
) -> bool:

    query = (
        db.query(Booking)
        .filter(
            Booking.room_id == room_id,
            Booking.status != "CANCELLED",
            Booking.start_datetime < end_datetime,
            Booking.end_datetime > start_datetime,
        )
    )

    if exclude_booking_id is not None:
        query = query.filter(
            Booking.id != exclude_booking_id
        )

    return query.first() is not None


def check_resource_conflict(
    db: Session,
    resource_id: int,
    start_datetime,
    end_datetime,
    quantity: int,
    exclude_booking_id: int | None = None,
) -> bool:

    resource = (
        db.query(Resource)
        .filter(
            Resource.id == resource_id
        )
        .first()
    )

    if not resource:
        return True

    if not resource.is_available:
        return True

    query = (
        db.query(BookingResource)
        .join(
            Booking,
            Booking.id == BookingResource.booking_id,
        )
        .filter(
            BookingResource.resource_id == resource_id,
            Booking.status != "CANCELLED",
            Booking.start_datetime < end_datetime,
            Booking.end_datetime > start_datetime,
        )
    )

    if exclude_booking_id is not None:
        query = query.filter(
            Booking.id != exclude_booking_id
        )

    conflicting_assignments = query.all()

    booked_quantity = sum(
        assignment.quantity
        for assignment in conflicting_assignments
    )

    return (
        booked_quantity + quantity
        > resource.quantity
    )


# ============================================================
# ROOM / RESOURCE VALIDATION
# ============================================================

def validate_room(
    db: Session,
    room_id: int,
) -> MeetingRoom:

    room = (
        db.query(MeetingRoom)
        .filter(
            MeetingRoom.id == room_id
        )
        .first()
    )

    if not room:
        raise ValueError(
            "Meeting room not found"
        )

    if not room.is_available:
        raise ValueError(
            "Meeting room is currently unavailable"
        )

    return room


def validate_booking_resources(
    db: Session,
    room_id: int,
    booking_resources: list[dict],
):
    for item in booking_resources:
        resource_id = item["resource_id"]
        quantity = item["quantity"]

        resource = (
            db.query(Resource)
            .filter(
                Resource.id == resource_id
            )
            .first()
        )

        if not resource:
            raise ValueError(
                f"Resource {resource_id} not found"
            )

        if not resource.is_available:
            raise ValueError(
                f"Resource {resource_id} is currently unavailable"
            )

        room_assignment = (
            db.query(RoomResource)
            .filter(
                RoomResource.room_id == room_id,
                RoomResource.resource_id == resource_id,
            )
            .first()
        )

        if not room_assignment:
            raise ValueError(
                f"Resource {resource_id} is not assigned to this room"
            )

        if quantity > room_assignment.quantity:
            raise ValueError(
                f"Requested quantity for resource "
                f"{resource_id} exceeds room-assigned quantity"
            )

        if quantity > resource.quantity:
            raise ValueError(
                f"Requested quantity for resource "
                f"{resource_id} exceeds total resource quantity"
            )


# ============================================================
# RECURRING BOOKINGS
# ============================================================

def get_recurrence_step(
    recurrence_rule: str,
) -> timedelta:

    rule = recurrence_rule.strip().upper()

    if rule == "DAILY":
        return timedelta(days=1)

    if rule == "WEEKLY":
        return timedelta(days=7)

    if rule == "BIWEEKLY":
        return timedelta(days=14)

    raise ValueError(
        "Unsupported recurrence rule. "
        "Use DAILY, WEEKLY, or BIWEEKLY"
    )


def build_recurrence_dates(
    start_datetime: datetime,
    recurrence_end_date: datetime,
    recurrence_rule: str,
) -> list[datetime]:

    step = get_recurrence_step(
        recurrence_rule
    )

    occurrence_starts = []
    current_start = start_datetime

    while current_start <= recurrence_end_date:
        occurrence_starts.append(
            current_start
        )

        current_start = (
            current_start + step
        )

    return occurrence_starts


def validate_occurrence(
    db: Session,
    room_id: int,
    start_datetime,
    end_datetime,
    booking_resources: list[dict],
):
    if check_room_conflict(
        db,
        room_id,
        start_datetime,
        end_datetime,
    ):
        raise ValueError(
            "Meeting room is already booked for the selected time slot"
        )

    for item in booking_resources:
        if check_resource_conflict(
            db,
            item["resource_id"],
            start_datetime,
            end_datetime,
            item["quantity"],
        ):
            raise ValueError(
                f"Resource {item['resource_id']} is not available "
                "for the selected time slot"
            )


def create_single_booking(
    db: Session,
    user_id: int,
    booking_data: BookingCreate,
    booking_resources: list[dict],
    start_datetime,
    end_datetime,
    is_recurring: bool,
    parent_booking_id: int | None = None,
) -> Booking:

    booking = Booking(
        user_id=user_id,
        room_id=booking_data.room_id,
        title=booking_data.title,
        description=booking_data.description,
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        status="CONFIRMED",
        is_recurring=is_recurring,
        recurrence_rule=(
            booking_data.recurrence_rule
            if is_recurring
            else None
        ),
        recurrence_end_date=(
            booking_data.recurrence_end_date
            if is_recurring
            else None
        ),
        parent_booking_id=parent_booking_id,
    )

    db.add(booking)
    db.flush()

    for item in booking_resources:
        db.add(
            BookingResource(
                booking_id=booking.id,
                resource_id=item["resource_id"],
                quantity=item["quantity"],
            )
        )

    return booking


# ============================================================
# CREATE BOOKING
# ============================================================

def create_booking(
    db: Session,
    user_id: int,
    booking_data: BookingCreate,
    booking_resources: list[dict],
) -> Booking:

    validate_room(
        db,
        booking_data.room_id,
    )

    validate_booking_resources(
        db,
        booking_data.room_id,
        booking_resources,
    )

    duration = (
        booking_data.end_datetime
        - booking_data.start_datetime
    )

    if duration.total_seconds() <= 0:
        raise ValueError(
            "End datetime must be after start datetime"
        )

    # --------------------------------------------------------
    # NORMAL BOOKING
    # --------------------------------------------------------

    if not booking_data.is_recurring:

        validate_occurrence(
            db,
            booking_data.room_id,
            booking_data.start_datetime,
            booking_data.end_datetime,
            booking_resources,
        )

        booking = create_single_booking(
            db,
            user_id,
            booking_data,
            booking_resources,
            booking_data.start_datetime,
            booking_data.end_datetime,
            False,
        )

        db.commit()
        db.refresh(booking)

        create_booking_confirmation(
            db,
            booking,
        )

        schedule_meeting_reminder(
            booking,
        )

        create_audit_log(
            db=db,
            user_id=user_id,
            action="CREATE_BOOKING",
            entity_type="BOOKING",
            entity_id=booking.id,
            description=(
                f"Booking '{booking.title}' "
                "created successfully"
            ),
        )

        return booking

    # --------------------------------------------------------
    # RECURRING BOOKING
    # --------------------------------------------------------

    if not booking_data.recurrence_rule:
        raise ValueError(
            "Recurrence rule is required for recurring bookings"
        )

    if not booking_data.recurrence_end_date:
        raise ValueError(
            "Recurrence end date is required for recurring bookings"
        )

    occurrence_starts = build_recurrence_dates(
        booking_data.start_datetime,
        booking_data.recurrence_end_date,
        booking_data.recurrence_rule,
    )

    if not occurrence_starts:
        raise ValueError(
            "No recurring occurrences could be generated"
        )

    occurrence_datetimes = []

    for occurrence_start in occurrence_starts:

        occurrence_end = (
            occurrence_start + duration
        )

        occurrence_datetimes.append(
            (
                occurrence_start,
                occurrence_end,
            )
        )

    # --------------------------------------------------------
    # VALIDATE ALL OCCURRENCES BEFORE INSERTING
    # --------------------------------------------------------

    for occurrence_start, occurrence_end in occurrence_datetimes:

        validate_occurrence(
            db,
            booking_data.room_id,
            occurrence_start,
            occurrence_end,
            booking_resources,
        )

    # --------------------------------------------------------
    # CREATE PARENT BOOKING
    # --------------------------------------------------------

    parent_booking = create_single_booking(
        db,
        user_id,
        booking_data,
        booking_resources,
        occurrence_datetimes[0][0],
        occurrence_datetimes[0][1],
        True,
    )

    # --------------------------------------------------------
    # CREATE CHILD OCCURRENCES
    # --------------------------------------------------------

    for occurrence_start, occurrence_end in occurrence_datetimes[1:]:

        create_single_booking(
            db,
            user_id,
            booking_data,
            booking_resources,
            occurrence_start,
            occurrence_end,
            True,
            parent_booking.id,
        )

    db.commit()
    db.refresh(parent_booking)

    create_booking_confirmation(
        db,
        parent_booking,
    )

    schedule_meeting_reminder(
        parent_booking,
    )

    create_audit_log(
        db=db,
        user_id=user_id,
        action="CREATE_BOOKING",
        entity_type="BOOKING",
        entity_id=parent_booking.id,
        description=(
            f"Recurring booking '{parent_booking.title}' "
            "created successfully"
        ),
    )

    return parent_booking


# ============================================================
# UPDATE BOOKING
# ============================================================

def update_booking(
    db: Session,
    booking: Booking,
    booking_data: BookingUpdate,
    booking_resources: list[dict] | None = None,
) -> Booking:

    if booking.status == "CANCELLED":
        raise ValueError(
            "Cancelled booking cannot be modified"
        )

    update_data = booking_data.model_dump(
        exclude_unset=True
    )

    room_id = update_data.get(
        "room_id",
        booking.room_id,
    )

    start_datetime = update_data.get(
        "start_datetime",
        booking.start_datetime,
    )

    end_datetime = update_data.get(
        "end_datetime",
        booking.end_datetime,
    )

    validate_room(
        db,
        room_id,
    )

    if end_datetime <= start_datetime:
        raise ValueError(
            "End datetime must be after start datetime"
        )

    if check_room_conflict(
        db,
        room_id,
        start_datetime,
        end_datetime,
        exclude_booking_id=booking.id,
    ):
        raise ValueError(
            "Meeting room is already booked for the selected time slot"
        )

    if booking_resources is not None:

        validate_booking_resources(
            db,
            room_id,
            booking_resources,
        )

        for item in booking_resources:

            if check_resource_conflict(
                db,
                item["resource_id"],
                start_datetime,
                end_datetime,
                item["quantity"],
                exclude_booking_id=booking.id,
            ):
                raise ValueError(
                    f"Resource {item['resource_id']} is not available "
                    "for the selected time slot"
                )

        db.query(
            BookingResource
        ).filter(
            BookingResource.booking_id == booking.id
        ).delete(
            synchronize_session=False
        )

        for item in booking_resources:

            db.add(
                BookingResource(
                    booking_id=booking.id,
                    resource_id=item["resource_id"],
                    quantity=item["quantity"],
                )
            )

    for field, value in update_data.items():
        setattr(
            booking,
            field,
            value,
        )

    db.commit()
    db.refresh(booking)

    create_audit_log(
        db=db,
        user_id=booking.user_id,
        action="UPDATE_BOOKING",
        entity_type="BOOKING",
        entity_id=booking.id,
        description=(
            f"Booking '{booking.title}' "
            "updated successfully"
        ),
    )

    return booking


# ============================================================
# CANCEL BOOKING
# ============================================================

def cancel_booking(
    db: Session,
    booking: Booking,
) -> Booking:

    if booking.status == "CANCELLED":
        raise ValueError(
            "Booking is already cancelled"
        )

    booking.status = "CANCELLED"

    db.commit()
    db.refresh(booking)

    create_booking_cancellation(
        db,
        booking,
    )

    create_audit_log(
        db=db,
        user_id=booking.user_id,
        action="CANCEL_BOOKING",
        entity_type="BOOKING",
        entity_id=booking.id,
        description=(
            f"Booking '{booking.title}' "
            "cancelled successfully"
        ),
    )

    return booking


# ============================================================
# BOOKING RESOURCES
# ============================================================

def get_booking_resources(
    db: Session,
    booking_id: int,
) -> list[BookingResource]:

    return (
        db.query(BookingResource)
        .filter(
            BookingResource.booking_id == booking_id
        )
        .order_by(
            BookingResource.id.asc()
        )
        .all()
    )