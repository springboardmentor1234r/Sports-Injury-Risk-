import pytest
from api.auth.password_utils import hash_password, verify_password, validate_password

def test_password_hashing():
    password = "MySecurePassword123!"
    hashed = hash_password(password)
    
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_validate_password_strong():
    is_valid, msg = validate_password("StrongP@ssw0rd")
    assert is_valid is True
    assert msg == "Valid password"

def test_validate_password_too_short():
    is_valid, msg = validate_password("Short1!")
    assert is_valid is False
    assert "least 8 characters" in msg

def test_validate_password_no_number():
    is_valid, msg = validate_password("NoNumberPassword!")
    assert is_valid is False
    assert "one number" in msg

def test_validate_password_no_special():
    is_valid, msg = validate_password("NoSpecial123")
    assert is_valid is False
    assert "one special character" in msg
