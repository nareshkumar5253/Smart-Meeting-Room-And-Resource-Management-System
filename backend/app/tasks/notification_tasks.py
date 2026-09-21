from datetime import datetime, timezone

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.booking import Booking
from app.models.notification import Notification
from app.services.notification_service import (
    create_meeting_reminder,
)


@celery_app.task(
    bind=True,
    name="send_meeting_reminder",
)
def send_meeting_reminder(
    self,
    booking_id: int,
):
    db = SessionLocal()

    try:
        print(
            f"[REMINDER] Starting reminder task for booking {booking_id}"
        )

        booking = (
            db.query(Booking)
            .filter(Booking.id == booking_id)
            .first()
        )

        if not booking:
            print(
                f"[REMINDER] Booking {booking_id} not found"
            )
            return {
                "status": "error",
                "message": "Booking not found",
            }

        print(
            f"[REMINDER] Booking found: {booking.title}"
        )

        if booking.status == "CANCELLED":
            print(
                f"[REMINDER] Booking {booking_id} is cancelled"
            )
            return {
                "status": "skipped",
                "message": "Booking is cancelled",
            }

        existing_reminder = (
            db.query(Notification)
            .filter(
                Notification.booking_id == booking.id,
                Notification.notification_type
                == "MEETING_REMINDER",
            )
            .first()
        )

        if existing_reminder:
            print(
                f"[REMINDER] Reminder already exists "
                f"for booking {booking_id}"
            )
            return {
                "status": "skipped",
                "message": "Reminder already exists",
            }

        notification = create_meeting_reminder(
            db,
            booking,
        )

        notification.sent_at = datetime.now(
            timezone.utc
        )

        db.commit()

        print(
            f"[REMINDER] Notification created successfully: "
            f"{notification.id}"
        )

        return {
            "status": "success",
            "notification_id": notification.id,
            "booking_id": booking.id,
        }

    except Exception as exc:
        db.rollback()

        print(
            f"[REMINDER] Task failed: {exc}"
        )

        raise

    finally:
        db.close()