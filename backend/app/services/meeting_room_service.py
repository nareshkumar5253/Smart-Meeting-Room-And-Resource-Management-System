from sqlalchemy.orm import Session

from app.models.meeting_room import MeetingRoom
from app.schemas.meeting_room import (
    MeetingRoomCreate,
    MeetingRoomUpdate,
)


def get_meeting_room_by_id(
    db: Session,
    room_id: int,
) -> MeetingRoom | None:
    return (
        db.query(MeetingRoom)
        .filter(MeetingRoom.id == room_id)
        .first()
    )


def get_meeting_room_by_code(
    db: Session,
    room_code: str,
) -> MeetingRoom | None:
    return (
        db.query(MeetingRoom)
        .filter(MeetingRoom.room_code == room_code)
        .first()
    )


def get_meeting_room_by_name(
    db: Session,
    name: str,
) -> MeetingRoom | None:
    return (
        db.query(MeetingRoom)
        .filter(MeetingRoom.name == name)
        .first()
    )


def get_all_meeting_rooms(
    db: Session,
) -> list[MeetingRoom]:
    return (
        db.query(MeetingRoom)
        .order_by(MeetingRoom.id.desc())
        .all()
    )


def create_meeting_room(
    db: Session,
    room_data: MeetingRoomCreate,
) -> MeetingRoom:

    existing_code = get_meeting_room_by_code(
        db,
        room_data.room_code,
    )

    if existing_code:
        raise ValueError(
            "Room code is already registered"
        )

    existing_name = get_meeting_room_by_name(
        db,
        room_data.name,
    )

    if existing_name:
        raise ValueError(
            "Meeting room name already exists"
        )

    room = MeetingRoom(
        name=room_data.name,
        room_code=room_data.room_code,
        location=room_data.location,
        capacity=room_data.capacity,
        facilities=room_data.facilities,
        is_available=room_data.is_available,
    )

    db.add(room)
    db.commit()
    db.refresh(room)

    return room


def update_meeting_room(
    db: Session,
    room: MeetingRoom,
    room_data: MeetingRoomUpdate,
) -> MeetingRoom:

    update_data = room_data.model_dump(
        exclude_unset=True
    )

    if "room_code" in update_data:
        existing_code = (
            db.query(MeetingRoom)
            .filter(
                MeetingRoom.room_code
                == update_data["room_code"],
                MeetingRoom.id != room.id,
            )
            .first()
        )

        if existing_code:
            raise ValueError(
                "Room code is already registered"
            )

    if "name" in update_data:
        existing_name = (
            db.query(MeetingRoom)
            .filter(
                MeetingRoom.name
                == update_data["name"],
                MeetingRoom.id != room.id,
            )
            .first()
        )

        if existing_name:
            raise ValueError(
                "Meeting room name already exists"
            )

    for field, value in update_data.items():
        setattr(room, field, value)

    db.commit()
    db.refresh(room)

    return room


def delete_meeting_room(
    db: Session,
    room: MeetingRoom,
) -> None:

    db.delete(room)
    db.commit()

def check_meeting_room_availability(
    db: Session,
    room_id: int,
) -> MeetingRoom | None:
    room = get_meeting_room_by_id(
        db,
        room_id,
    )

    if not room:
        return None

    return room