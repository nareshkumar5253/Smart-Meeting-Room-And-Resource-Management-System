from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import UserRegister


def get_user_by_email(
    db: Session,
    email: str,
) -> User | None:
    return (
        db.query(User)
        .filter(User.email == email)
        .first()
    )


def get_role_by_name(
    db: Session,
    role_name: str,
) -> Role | None:
    return (
        db.query(Role)
        .filter(Role.name == role_name)
        .first()
    )


def create_user(
    db: Session,
    user_data: UserRegister,
) -> User:

    existing_user = get_user_by_email(
        db,
        user_data.email,
    )

    if existing_user:
        raise ValueError("Email is already registered")

    employee_role = get_role_by_name(
        db,
        "EMPLOYEE",
    )

    if not employee_role:
        raise ValueError(
            "EMPLOYEE role does not exist"
        )

    user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hash_password(
            user_data.password
        ),
        role_id=employee_role.id,
        department_id=user_data.department_id,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:

    user = get_user_by_email(
        db,
        email,
    )

    if not user:
        return None

    if not user.is_active:
        return None

    if not verify_password(
        password,
        user.hashed_password,
    ):
        return None

    return user