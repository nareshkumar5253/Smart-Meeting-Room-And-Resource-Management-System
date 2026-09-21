from sqlalchemy import Column, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func

from app.core.database import Base


class RoomResource(Base):
    __tablename__ = "room_resources"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    room_id = Column(
        Integer,
        ForeignKey("meeting_rooms.id"),
        nullable=False,
    )

    resource_id = Column(
        Integer,
        ForeignKey("resources.id"),
        nullable=False,
    )

    quantity = Column(
        Integer,
        nullable=False,
        default=1,
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )