from app.core.database import SessionLocal
from app.models.role import Role


def seed_roles():
    db = SessionLocal()

    try:
        roles = ["ADMIN", "EMPLOYEE"]

        for role_name in roles:
            existing_role = (
                db.query(Role)
                .filter(Role.name == role_name)
                .first()
            )

            if not existing_role:
                db.add(
                    Role(name=role_name)
                )

        db.commit()

        print("Roles seeded successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_roles()