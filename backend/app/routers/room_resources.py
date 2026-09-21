from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_admin,
)
from app.schemas.room_resource import (
    RoomResourceCreate,
    RoomResourceResponse,
    RoomResourceUpdate,
)
from app.services.room_resource_service import (
    create_room_resource_assignment,
    delete_room_resource_assignment,
    get_resources_for_room,
    get_room_resource_by_id,
    update_room_resource_quantity,
)


router = APIRouter(
    prefix="/room-resources",
    tags=["Room Resources"],
)


@router.post(
    "",
    response_model=RoomResourceResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_resource_to_room(
    assignment_data: RoomResourceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    try:
        return create_room_resource_assignment(
            db,
            assignment_data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get(
    "/room/{room_id}",
    response_model=list[RoomResourceResponse],
)
def get_room_resources(
    room_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_resources_for_room(
        db,
        room_id,
    )


@router.put(
    "/{assignment_id}",
    response_model=RoomResourceResponse,
)
def update_room_resource(
    assignment_id: int,
    assignment_data: RoomResourceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    assignment = get_room_resource_by_id(
        db,
        assignment_id,
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room resource assignment not found",
        )

    try:
        return update_room_resource_quantity(
            db,
            assignment,
            assignment_data.quantity,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.delete(
    "/{assignment_id}",
)
def remove_resource_from_room(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    assignment = get_room_resource_by_id(
        db,
        assignment_id,
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room resource assignment not found",
        )

    delete_room_resource_assignment(
        db,
        assignment,
    )

    return {
        "message": (
            "Resource removed from meeting room successfully"
        )
    }