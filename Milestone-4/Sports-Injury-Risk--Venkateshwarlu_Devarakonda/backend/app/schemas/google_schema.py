from pydantic import BaseModel


class GoogleUserResponse(BaseModel):
    google_id: str
    email: str
    name: str
    email_verified: bool