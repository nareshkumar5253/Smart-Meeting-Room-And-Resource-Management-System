from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.booking_resource import BookingResourceCreate


class BookingCreate(BaseModel):
    room_id: int = Field(
        ...,
        ge=1,
    )

    title: str = Field(
        ...,
        min_length=2,
        max_length=200,
    )

    description: str | None = None

    start_datetime: datetime

    end_datetime: datetime

    resources: list[BookingResourceCreate] = Field(
        default_factory=list,
    )

    is_recurring: bool = False

    recurrence_rule: str | None = Field(
        default=None,
        max_length=255,
    )

    recurrence_end_date: datetime | None = None

    @model_validator(mode="after")
    def validate_booking_data(self):
        if self.end_datetime <= self.start_datetime:
            raise ValueError(
                "End datetime must be after start datetime"
            )

        if self.is_recurring:
            if not self.recurrence_rule:
                raise ValueError(
                    "Recurrence rule is required for recurring bookings"
                )

            if not self.recurrence_end_date:
                raise ValueError(
                    "Recurrence end date is required for recurring bookings"
                )

            if self.recurrence_end_date <= self.start_datetime:
                raise ValueError(
                    "Recurrence end date must be after start datetime"
                )

        else:
            if self.recurrence_rule:
                raise ValueError(
                    "Recurrence rule is only allowed for recurring bookings"
                )

            if self.recurrence_end_date:
                raise ValueError(
                    "Recurrence end date is only allowed for recurring bookings"
                )

        return self


class BookingUpdate(BaseModel):
    room_id: int | None = Field(
        default=None,
        ge=1,
    )

    title: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    description: str | None = None

    start_datetime: datetime | None = None

    end_datetime: datetime | None = None

    resources: list[BookingResourceCreate] | None = None

    is_recurring: bool | None = None

    recurrence_rule: str | None = Field(
        default=None,
        max_length=255,
    )

    recurrence_end_date: datetime | None = None

    @model_validator(mode="after")
    def validate_update_dates(self):
        if (
            self.start_datetime is not None
            and self.end_datetime is not None
            and self.end_datetime <= self.start_datetime
        ):
            raise ValueError(
                "End datetime must be after start datetime"
            )

        return self


class BookingResponse(BaseModel):
    id: int
    user_id: int
    room_id: int
    title: str
    description: str | None
    start_datetime: datetime
    end_datetime: datetime
    status: str
    is_recurring: bool
    recurrence_rule: str | None
    recurrence_end_date: datetime | None
    parent_booking_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )