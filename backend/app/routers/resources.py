from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_admin,
)
from app.schemas.resource import (
    ResourceCreate,
    ResourceResponse,
    ResourceUpdate,
)
from app.services.resource_service import (
    check_resource_availability,
    create_resource,
    delete_resource,
    get_all_resources,
    get_resource_by_id,
    update_resource,
)


router = APIRouter(
    prefix="/resources",
    tags=["Resources"],
)


@router.post(
    "",
    response_model=ResourceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_resource_api(
    resource_data: ResourceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    try:
        return create_resource(
            db,
            resource_data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get(
    "",
    response_model=list[ResourceResponse],
)
def get_resources(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_all_resources(db)


@router.get(
    "/{resource_id}",
    response_model=ResourceResponse,
)
def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    resource = get_resource_by_id(
        db,
        resource_id,
    )

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    return resource


@router.put(
    "/{resource_id}",
    response_model=ResourceResponse,
)
def update_resource_api(
    resource_id: int,
    resource_data: ResourceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    resource = get_resource_by_id(
        db,
        resource_id,
    )

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    try:
        return update_resource(
            db,
            resource,
            resource_data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.delete(
    "/{resource_id}",
)
def delete_resource_api(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    resource = get_resource_by_id(
        db,
        resource_id,
    )

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    delete_resource(
        db,
        resource,
    )

    return {
        "message": "Resource deleted successfully"
    }


@router.get(
    "/{resource_id}/availability",
)
def check_resource_availability_api(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    resource = check_resource_availability(
        db,
        resource_id,
    )

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    return {
        "resource_id": resource.id,
        "resource_name": resource.name,
        "resource_code": resource.resource_code,
        "quantity": resource.quantity,
        "is_available": resource.is_available,
        "message": (
            "Resource is available"
            if resource.is_available
            else "Resource is currently unavailable"
        ),
    }