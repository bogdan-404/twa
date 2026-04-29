from __future__ import annotations

from datetime import datetime, timezone
from sqlite3 import IntegrityError, Row

from .database import get_connection


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def row_to_dict(row: Row | None) -> dict | None:
    return dict(row) if row is not None else None


def create_user(username: str, password_hash: str) -> dict | None:
    try:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO users (username, password_hash, created_at)
                VALUES (?, ?, ?)
                """,
                (username, password_hash, utc_now()),
            )
            connection.commit()
            return get_user_by_id(cursor.lastrowid)
    except IntegrityError:
        return None


def get_user_by_username(username: str) -> dict | None:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id, username, password_hash, created_at FROM users WHERE username = ?",
            (username,),
        ).fetchone()
        return row_to_dict(row)


def get_user_by_id(user_id: int) -> dict | None:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id, username, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        return row_to_dict(row)


def list_contacts(user_id: int) -> list[dict]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, user_id, name, phone, email, notes, created_at, updated_at
            FROM contacts
            WHERE user_id = ?
            ORDER BY updated_at DESC, id DESC
            """,
            (user_id,),
        ).fetchall()
        return [dict(row) for row in rows]


def get_contact(user_id: int, contact_id: int) -> dict | None:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT id, user_id, name, phone, email, notes, created_at, updated_at
            FROM contacts
            WHERE id = ? AND user_id = ?
            """,
            (contact_id, user_id),
        ).fetchone()
        return row_to_dict(row)


def create_contact(
    user_id: int,
    name: str,
    phone: str | None,
    email: str | None,
    notes: str | None,
) -> dict:
    now = utc_now()
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO contacts (user_id, name, phone, email, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, name, phone, email, notes, now, now),
        )
        connection.commit()
        contact = get_contact(user_id, cursor.lastrowid)
        if contact is None:
            raise RuntimeError("Created contact could not be loaded")
        return contact


def update_contact(
    user_id: int,
    contact_id: int,
    name: str,
    phone: str | None,
    email: str | None,
    notes: str | None,
) -> dict | None:
    with get_connection() as connection:
        connection.execute(
            """
            UPDATE contacts
            SET name = ?, phone = ?, email = ?, notes = ?, updated_at = ?
            WHERE id = ? AND user_id = ?
            """,
            (name, phone, email, notes, utc_now(), contact_id, user_id),
        )
        connection.commit()
        return get_contact(user_id, contact_id)


def delete_contact(user_id: int, contact_id: int) -> bool:
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM contacts WHERE id = ? AND user_id = ?",
            (contact_id, user_id),
        )
        connection.commit()
        return cursor.rowcount > 0
