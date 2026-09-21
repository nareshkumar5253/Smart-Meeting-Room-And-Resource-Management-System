from sqlalchemy.orm import Session

from app.models.meeting_room import MeetingRoom
from app.models.resource import Resource
from app.models.room_resource import RoomResource
from app.schemas.room_resource import (
    RoomResourceCreate,
)


def get_room_resource_by_id(
    db: Session,
    assignment_id: int,
) -> RoomResource | None:
    return (
        db.query(RoomResource)
        .filter(RoomResource.id == assignment_id)
        .first()
    )


def get_room_resource_assignment(
    db: Session,
    room_id: int,
    resource_id: int,
) -> RoomResource | None:
    return (
        db.query(RoomResource)
        .filter(
            RoomResource.room_id == room_id,
            RoomResource.resource_id == resource_id,
        )
        .first()
    )


def get_resources_for_room(
    db: Session,
    room_id: int,
) -> list[RoomResource]:
    return (
        db.query(RoomResource)
        .filter(RoomResource.room_id == room_id)
        .order_by(RoomResource.id.desc())
        .all()
    )


def create_room_resource_assignment(
    db: Session,
    assignment_data: RoomResourceCreate,
) -> RoomResource:

    room = (
        db.query(MeetingRoom)
        .filter(
            MeetingRoom.id == assignment_data.room_id
        )
        .first()
    )

    if not room:
        raise ValueError(
            "Meeting room not found"
        )

    resource = (
        db.query(Resource)
        .filter(
            Resource.id == assignment_data.resource_id
        )
        .first()
    )

    if not resource:
        raise ValueError(
            "Resource not found"
        )

    if not resource.is_available:
        raise ValueError(
            "Resource is currently unavailable"
        )

    existing_assignment = (
        get_room_resource_assignment(
            db,
            assignment_data.room_id,
            assignment_data.resource_id,
        )
    )

    if existing_assignment:
        raise ValueError(
            "Resource is already assigned to this room"
        )

    if assignment_data.quantity > resource.quantity:
        raise ValueError(
            "Assigned quantity cannot exceed "
            "available resource quantity"
        )

    assignment = RoomResource(
        room_id=assignment_data.room_id,
        resource_id=assignment_data.resource_id,
        quantity=assignment_data.quantity,
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return assignment


def update_room_resource_quantity(
    db: Session,
    assignment: RoomResource,
    quantity: int,
) -> RoomResource:

    resource = (
        db.query(Resource)
        .filter(
            Resource.id == assignment.resource_id
        )
        .first()
    )

    if not resource:
        raise ValueError(
            "Resource not found"
        )

    if not resource.is_available:
        raise ValueError(
            "Resource is currently unavailable"
        )

    if quantity > resource.quantity:
        raise ValueError(
            "Assigned quantity cannot exceed "
            "available resource quantity"
        )

    assignment.quantity = quantity

    db.commit()
    db.refresh(assignment)

    return assignment


def delete_room_resource_assignment(
    db: Session,
    assignment: RoomResource,
) -> None:

    db.delete(assignment)
    db.commit()