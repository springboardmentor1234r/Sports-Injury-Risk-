from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hashes a plaintext password. Truncates to 72 chars for bcrypt compatibility."""
    # bcrypt has a strict 72 byte limit
    return pwd_context.hash(password[:72])

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a hashed one."""
    return pwd_context.verify(plain_password[:72], hashed_password)

import re

def validate_password(password: str) -> tuple[bool, str]:
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if len(password) > 64:
        return False, "Password must be at most 64 characters"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least 1 uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least 1 lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least 1 number"
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', password):
        return False, "Password must contain at least 1 special character"
    if password.startswith(' ') or password.endswith(' '):
        return False, "Password cannot have leading or trailing spaces"
    return True, ""
