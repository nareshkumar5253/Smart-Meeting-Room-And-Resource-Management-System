from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MeetingRoomCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    room_code: str = Field(
        ...,
        min_length=2,
        max_length=50,
    )

    location: str | None = Field(
        default=None,
        max_length=255,
    )

    capacity: int = Field(
        ...,
        ge=1,
    )

    facilities: str | None = None

    is_available: bool = True


class MeetingRoomUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    room_code: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    location: str | None = Field(
        default=None,
        max_length=255,
    )

    capacity: int | None = Field(
        default=None,
        ge=1,
    )

    facilities: str | None = None

    is_available: bool | None = None


class MeetingRoomResponse(BaseModel):
    id: int
    name: str
    room_code: str
    location: str | None
    capacity: int
    facilities: str | None
    is_available: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )