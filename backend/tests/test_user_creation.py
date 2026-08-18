from app.schemas.user import UserCreate


def test_user_create_allows_email_and_password_only():
    user = UserCreate(email="trainer@example.com", password="secret123")

    assert user.email == "trainer@example.com"
    assert user.password == "secret123"
    assert user.full_name == "trainer"
    assert user.role.value == "ATHLETE"
