from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.models.user import RoleEnum

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(default="")
    role: RoleEnum = RoleEnum.ATHLETE

    @property
    def display_name(self) -> str:
        if self.full_name and self.full_name.strip():
            return self.full_name.strip()
        return self.email.split("@")[0].replace(".", " ").title()

class UserCreate(UserBase):
    password: str

    @property
    def resolved_full_name(self) -> str:
        return self.display_name

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None

class UserInDBBase(UserBase):
    id: int
    is_active: bool
    is_verified: bool

    class Config:
        from_attributes = True

class UserResponse(UserInDBBase):
    pass
