from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Annotated
from pydantic.functional_validators import BeforeValidator
import enum
from app.models.user import UserRole

# This helper converts MongoDB ObjectId to a string so FastAPI can return it as JSON
PyObjectId = Annotated[str, BeforeValidator(str)]

class UserOut(BaseModel):
    # Use PyObjectId here. We use alias="_id" because MongoDB uses "_id" internally
    id: PyObjectId = Field(alias="_id") 
    email: EmailStr
    full_name: str
    role: UserRole

    # This allows Pydantic to read the data even if it's a MongoDB object
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.ATHLETE

class Token(BaseModel):
    access_token: str
    token_type: str