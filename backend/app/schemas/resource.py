from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ResourceCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    resource_code: str = Field(
        ...,
        min_length=2,
        max_length=50,
    )

    description: str | None = None

    quantity: int = Field(
        ...,
        ge=1,
    )

    is_available: bool = True


class ResourceUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    resource_code: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    description: str | None = None

    quantity: int | None = Field(
        default=None,
        ge=1,
    )

    is_available: bool | None = None


class ResourceResponse(BaseModel):
    id: int
    name: str
    resource_code: str
    description: str | None
    quantity: int
    is_available: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )