from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles

from . import crud
from .auth import create_access_token, decode_access_token, hash_password, verify_password
from .database import init_db
from .schemas import ContactCreate, ContactPublic, ContactUpdate, Token, UserCreate, UserPublic


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Contact Manager API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_current_user(payload: dict = Depends(decode_access_token)) -> dict:
    user_id = int(payload["sub"])
    user = crud.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate) -> dict:
    user = crud.create_user(user_in.username, hash_password(user_in.password))
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    return user


@app.post("/api/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()) -> dict[str, str]:
    username = form_data.username.strip().lower()
    user = crud.get_user_by_username(username)
    if user is None or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": str(user["id"]), "username": user["username"]})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=UserPublic)
def read_me(current_user: dict = Depends(get_current_user)) -> dict:
    return current_user


@app.get("/api/contacts", response_model=list[ContactPublic])
def read_contacts(current_user: dict = Depends(get_current_user)) -> list[dict]:
    return crud.list_contacts(current_user["id"])


@app.get("/api/contacts/{contact_id}", response_model=ContactPublic)
def read_contact(contact_id: int, current_user: dict = Depends(get_current_user)) -> dict:
    contact = crud.get_contact(current_user["id"], contact_id)
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return contact


@app.post("/api/contacts", response_model=ContactPublic, status_code=status.HTTP_201_CREATED)
def add_contact(contact_in: ContactCreate, current_user: dict = Depends(get_current_user)) -> dict:
    return crud.create_contact(
        current_user["id"],
        contact_in.name,
        contact_in.phone,
        contact_in.email,
        contact_in.notes,
    )


@app.put("/api/contacts/{contact_id}", response_model=ContactPublic)
def edit_contact(
    contact_id: int,
    contact_in: ContactUpdate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    contact = crud.update_contact(
        current_user["id"],
        contact_id,
        contact_in.name,
        contact_in.phone,
        contact_in.email,
        contact_in.notes,
    )
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return contact


@app.delete("/api/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_contact(contact_id: int, current_user: dict = Depends(get_current_user)) -> None:
    deleted = crud.delete_contact(current_user["id"], contact_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")


static_dir = Path(__file__).parent / "static"
index_file = static_dir / "index.html"

if static_dir.exists():
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")


@app.get("/{full_path:path}")
def serve_react_app(full_path: str):
    if index_file.exists():
        return FileResponse(index_file)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Frontend build not found")
