from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.notification import Notification


def create_notification(
    db: Session,
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
    booking_id: int | None = None,
    scheduled_for: datetime | None = None,
) -> Notification:

    notification = Notification(
        user_id=user_id,
        booking_id=booking_id,
        notification_type=notification_type,
        title=title,
        message=message,
        is_read=False,
        scheduled_for=scheduled_for,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


def create_booking_confirmation(
    db: Session,
    booking: Booking,
) -> Notification:

    return create_notification(
        db=db,
        user_id=booking.user_id,
        booking_id=booking.id,
        notification_type="BOOKING_CONFIRMATION",
        title="Booking Confirmed",
        message=(
            f"Your meeting '{booking.title}' has been confirmed. "
            f"Scheduled from "
            f"{booking.start_datetime.strftime('%Y-%m-%d %H:%M')} "
            f"to "
            f"{booking.end_datetime.strftime('%Y-%m-%d %H:%M')}."
        ),
    )


def create_booking_cancellation(
    db: Session,
    booking: Booking,
) -> Notification:

    return create_notification(
        db=db,
        user_id=booking.user_id,
        booking_id=booking.id,
        notification_type="BOOKING_CANCELLATION",
        title="Booking Cancelled",
        message=(
            f"Your meeting '{booking.title}' has been cancelled. "
            f"The scheduled booking from "
            f"{booking.start_datetime.strftime('%Y-%m-%d %H:%M')} "
            f"to "
            f"{booking.end_datetime.strftime('%Y-%m-%d %H:%M')} "
            f"is no longer active."
        ),
    )


def create_meeting_reminder(
    db: Session,
    booking: Booking,
) -> Notification:

    reminder_time = (
        booking.start_datetime
        - timedelta(minutes=15)
    )

    return create_notification(
        db=db,
        user_id=booking.user_id,
        booking_id=booking.id,
        notification_type="MEETING_REMINDER",
        title="Meeting Reminder",
        message=(
            f"Reminder: your meeting '{booking.title}' "
            f"starts at "
            f"{booking.start_datetime.strftime('%Y-%m-%d %H:%M')}."
        ),
        scheduled_for=reminder_time,
    )


def schedule_meeting_reminder(
    booking: Booking,
) -> None:

    # Import here to avoid circular imports.
    from app.tasks.notification_tasks import (
        send_meeting_reminder,
    )

    reminder_time = (
        booking.start_datetime
        - timedelta(minutes=15)
    )

    send_meeting_reminder.apply_async(
        args=[booking.id],
        eta=reminder_time,
    )


def get_user_notifications(
    db: Session,
    user_id: int,
) -> list[Notification]:

    return (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id
        )
        .order_by(
            Notification.created_at.desc()
        )
        .all()
    )


def get_notification_by_id(
    db: Session,
    notification_id: int,
) -> Notification | None:

    return (
        db.query(Notification)
        .filter(
            Notification.id == notification_id
        )
        .first()
    )


def mark_notification_as_read(
    db: Session,
    notification: Notification,
) -> Notification:

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification