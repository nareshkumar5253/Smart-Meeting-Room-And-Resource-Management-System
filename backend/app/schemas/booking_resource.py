from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BookingResourceCreate(BaseModel):
    resource_id: int = Field(
        ...,
        ge=1,
    )

    quantity: int = Field(
        ...,
        ge=1,
    )


class BookingResourceResponse(BaseModel):
    id: int
    booking_id: int
    resource_id: int
    quantity: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )