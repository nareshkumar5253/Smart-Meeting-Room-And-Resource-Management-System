from sqlalchemy.orm import Session

from app.models.resource import Resource
from app.schemas.resource import (
    ResourceCreate,
    ResourceUpdate,
)


def get_resource_by_id(
    db: Session,
    resource_id: int,
) -> Resource | None:
    return (
        db.query(Resource)
        .filter(Resource.id == resource_id)
        .first()
    )


def get_resource_by_code(
    db: Session,
    resource_code: str,
) -> Resource | None:
    return (
        db.query(Resource)
        .filter(
            Resource.resource_code == resource_code
        )
        .first()
    )


def get_resource_by_name(
    db: Session,
    name: str,
) -> Resource | None:
    return (
        db.query(Resource)
        .filter(Resource.name == name)
        .first()
    )


def get_all_resources(
    db: Session,
) -> list[Resource]:
    return (
        db.query(Resource)
        .order_by(Resource.id.desc())
        .all()
    )


def create_resource(
    db: Session,
    resource_data: ResourceCreate,
) -> Resource:

    existing_code = get_resource_by_code(
        db,
        resource_data.resource_code,
    )

    if existing_code:
        raise ValueError(
            "Resource code is already registered"
        )

    existing_name = get_resource_by_name(
        db,
        resource_data.name,
    )

    if existing_name:
        raise ValueError(
            "Resource name already exists"
        )

    resource = Resource(
        name=resource_data.name,
        resource_code=resource_data.resource_code,
        description=resource_data.description,
        quantity=resource_data.quantity,
        is_available=resource_data.is_available,
    )

    db.add(resource)
    db.commit()
    db.refresh(resource)

    return resource


def update_resource(
    db: Session,
    resource: Resource,
    resource_data: ResourceUpdate,
) -> Resource:

    update_data = resource_data.model_dump(
        exclude_unset=True
    )

    if "resource_code" in update_data:
        existing_code = (
            db.query(Resource)
            .filter(
                Resource.resource_code
                == update_data["resource_code"],
                Resource.id != resource.id,
            )
            .first()
        )

        if existing_code:
            raise ValueError(
                "Resource code is already registered"
            )

    if "name" in update_data:
        existing_name = (
            db.query(Resource)
            .filter(
                Resource.name
                == update_data["name"],
                Resource.id != resource.id,
            )
            .first()
        )

        if existing_name:
            raise ValueError(
                "Resource name already exists"
            )

    for field, value in update_data.items():
        setattr(resource, field, value)

    db.commit()
    db.refresh(resource)

    return resource


def delete_resource(
    db: Session,
    resource: Resource,
) -> None:

    db.delete(resource)
    db.commit()


def check_resource_availability(
    db: Session,
    resource_id: int,
) -> Resource | None:

    resource = get_resource_by_id(
        db,
        resource_id,
    )

    if not resource:
        return None

    return resource