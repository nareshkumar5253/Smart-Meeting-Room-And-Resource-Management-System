from typing import Generic, TypeVar

from pydantic import BaseModel, Field


T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int = Field(
        ...,
        ge=1,
    )

    page_size: int = Field(
        ...,
        ge=1,
        le=100,
    )

    total: int = Field(
        ...,
        ge=0,
    )

    total_pages: int = Field(
        ...,
        ge=0,
    )


class PaginatedResponse(
    BaseModel,
    Generic[T],
):
    items: list[T]
    pagination: PaginationMeta


class PaginationParams(BaseModel):
    page: int = Field(
        default=1,
        ge=1,
    )

    page_size: int = Field(
        default=10,
        ge=1,
        le=100,
    )