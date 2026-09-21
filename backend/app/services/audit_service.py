from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    user_id: int | None,
    action: str,
    entity_type: str,
    entity_id: int | None,
    description: str,
    ip_address: str | None = None,
) -> AuditLog:

    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        ip_address=ip_address,
    )

    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)

    return audit_log


def get_audit_logs(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    action: str | None = None,
    entity_type: str | None = None,
    user_id: int | None = None,
):
    query = db.query(AuditLog)

    if action:
        query = query.filter(
            AuditLog.action == action.upper()
        )

    if entity_type:
        query = query.filter(
            AuditLog.entity_type
            == entity_type.upper()
        )

    if user_id is not None:
        query = query.filter(
            AuditLog.user_id == user_id
        )

    query = query.order_by(
        AuditLog.created_at.desc()
    )

    total = query.count()

    total_pages = (
        (total + page_size - 1) // page_size
        if total > 0
        else 0
    )

    items = (
        query
        .offset(
            (page - 1) * page_size
        )
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