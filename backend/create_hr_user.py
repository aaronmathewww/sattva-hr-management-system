
from getpass import getpass

from sqlalchemy import select

from app.core.passwords import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.user import User


def main():
    Base.metadata.create_all(bind=engine)

    email = input("HR email: ").strip().lower()
    full_name = input("HR full name: ").strip()
    password = getpass("New password (minimum 12 characters): ")

    if not email or "@" not in email:
        raise SystemExit("Enter a valid email address.")
    if not full_name:
        raise SystemExit("Name cannot be empty.")
    if len(password) < 12:
        raise SystemExit("Use a password of at least 12 characters.")

    with SessionLocal() as db:
        existing = db.scalar(select(User).where(User.email == email))
        if existing:
            raise SystemExit("An account with this email already exists.")

        user = User(
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
            role="hr",
            is_active=True,
        )
        db.add(user)
        db.commit()
        print(f"HR account created for {email}.")


if __name__ == "__main__":
    main()
