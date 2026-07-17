from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hashes a plaintext password. Truncates to 72 chars for bcrypt compatibility."""
    # bcrypt has a strict 72 byte limit
    return pwd_context.hash(password[:72])

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a hashed one."""
    return pwd_context.verify(plain_password[:72], hashed_password)
