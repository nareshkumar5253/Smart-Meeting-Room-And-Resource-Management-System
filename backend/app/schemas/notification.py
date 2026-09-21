from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    booking_id: int | None
    notification_type: str
    title: str
    message: str
    is_read: bool
    scheduled_for: datetime | None
    sent_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class NotificationMarkReadRequest(BaseModel):
    is_read: bool = Field(
        default=True,
    )