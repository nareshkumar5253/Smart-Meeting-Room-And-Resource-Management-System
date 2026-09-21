from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_admin,
)
from app.schemas.meeting_room import (
    MeetingRoomCreate,
    MeetingRoomResponse,
    MeetingRoomUpdate,
)
from app.services.meeting_room_service import (
    check_meeting_room_availability,
    create_meeting_room,
    delete_meeting_room,
    get_all_meeting_rooms,
    get_meeting_room_by_id,
    update_meeting_room,
)


router = APIRouter(
    prefix="/meeting-rooms",
    tags=["Meeting Rooms"],
)


@router.post(
    "",
    response_model=MeetingRoomResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_room(
    room_data: MeetingRoomCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    try:
        return create_meeting_room(
            db,
            room_data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get(
    "",
    response_model=list[MeetingRoomResponse],
)
def get_rooms(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_all_meeting_rooms(db)


@router.get(
    "/{room_id}",
    response_model=MeetingRoomResponse,
)
def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    room = get_meeting_room_by_id(
        db,
        room_id,
    )

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting room not found",
        )

    return room

@router.get(
    "/{room_id}/availability",
)
def check_room_availability(
    room_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    room = check_meeting_room_availability(
        db,
        room_id,
    )

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting room not found",
        )

    return {
        "room_id": room.id,
        "room_name": room.name,
        "room_code": room.room_code,
        "is_available": room.is_available,
        "message": (
            "Meeting room is available"
            if room.is_available
            else "Meeting room is currently unavailable"
        ),
    }

@router.put(
    "/{room_id}",
    response_model=MeetingRoomResponse,
)
def update_room(
    room_id: int,
    room_data: MeetingRoomUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    room = get_meeting_room_by_id(
        db,
        room_id,
    )

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting room not found",
        )

    try:
        return update_meeting_room(
            db,
            room,
            room_data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.delete(
    "/{room_id}",
)
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    room = get_meeting_room_by_id(
        db,
        room_id,
    )

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting room not found",
        )

    delete_meeting_room(
        db,
        room,
    )

    return {
        "message": "Meeting room deleted successfully"
    }