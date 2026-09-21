import math


def paginate_query(
    query,
    page: int = 1,
    page_size: int = 10,
):
    total = query.count()

    total_pages = (
        math.ceil(total / page_size)
        if total > 0
        else 0
    )

    offset = (
        page - 1
    ) * page_size

    items = (
        query
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return {
        "items": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
        },
    }