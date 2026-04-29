from typing import Optional

from pydantic import BaseModel, Field, field_validator


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=100)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        username = value.strip().lower()
        if len(username) < 3:
            raise ValueError("Username must contain at least 3 characters")
        return username


class UserPublic(BaseModel):
    id: int
    username: str


class Token(BaseModel):
    access_token: str
    token_type: str


class ContactBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        name = value.strip()
        if not name:
            raise ValueError("Name is required")
        return name

    @field_validator("phone", "email", "notes", mode="before")
    @classmethod
    def empty_strings_to_none(cls, value: Optional[str]) -> Optional[str]:
        if isinstance(value, str):
            stripped = value.strip()
            return stripped or None
        return value


class ContactCreate(ContactBase):
    pass


class ContactUpdate(ContactBase):
    pass


class ContactPublic(ContactBase):
    id: int
    user_id: int
    created_at: str
    updated_at: str
