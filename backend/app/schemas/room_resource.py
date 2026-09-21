from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RoomResourceCreate(BaseModel):
    room_id: int = Field(
        ...,
        ge=1,
    )

    resource_id: int = Field(
        ...,
        ge=1,
    )

    quantity: int = Field(
        ...,
        ge=1,
    )


class RoomResourceUpdate(BaseModel):
    quantity: int = Field(
        ...,
        ge=1,
    )


class RoomResourceResponse(BaseModel):
    id: int
    room_id: int
    resource_id: int
    quantity: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )