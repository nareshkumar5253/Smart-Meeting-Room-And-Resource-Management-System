from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class MeetingRoom(Base):
    __tablename__ = "meeting_rooms"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(100),
        unique=True,
        nullable=False,
    )

    room_code = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    location = Column(
        String(255),
        nullable=True,
    )

    capacity = Column(
        Integer,
        nullable=False,
    )

    facilities = Column(
        Text,
        nullable=True,
    )

    is_available = Column(
        Boolean,
        default=True,
        nullable=False,
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