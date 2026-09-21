from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.sql import func

from app.core.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    room_id = Column(
        Integer,
        ForeignKey("meeting_rooms.id"),
        nullable=False,
        index=True,
    )

    title = Column(
        String(200),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    start_datetime = Column(
        DateTime,
        nullable=False,
        index=True,
    )

    end_datetime = Column(
        DateTime,
        nullable=False,
        index=True,
    )

    status = Column(
        String(30),
        nullable=False,
        default="CONFIRMED",
        index=True,
    )

    is_recurring = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    recurrence_rule = Column(
        String(255),
        nullable=True,
    )

    recurrence_end_date = Column(
        DateTime,
        nullable=True,
    )

    parent_booking_id = Column(
        Integer,
        ForeignKey("bookings.id"),
        nullable=True,
        index=True,
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )