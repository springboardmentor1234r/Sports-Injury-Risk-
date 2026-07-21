import os
import psycopg2
from psycopg2 import pool
from psycopg2.extras import DictCursor
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Initialize connection pool
try:
    if DATABASE_URL:
        # Use SimpleConnectionPool (minconn=1, maxconn=5)
        pg_pool = psycopg2.pool.SimpleConnectionPool(1, 5, DATABASE_URL)
    else:
        print("DATABASE_URL is missing in .env")
        pg_pool = None
except Exception as e:
    print(f"Error initializing PostgreSQL pool: {e}")
    pg_pool = None


def get_connection():
    if pg_pool:
        try:
            return pg_pool.getconn()
        except Exception as e:
            print(f"Error getting PostgreSQL connection: {e}")
            return None
    return None

def release_connection(conn):
    if pg_pool and conn:
        pg_pool.putconn(conn)


def create_user(email: str, password_hash: str, full_name: str) -> Optional[int]:
    """Inserts a new user into the database and returns their ID."""
    conn = get_connection()
    if not conn:
        return None
    try:
        cursor = conn.cursor()
        query = """
            INSERT INTO users (email, password_hash, full_name, is_active, created_at, updated_at) 
            VALUES (%s, %s, %s, True, NOW(), NOW())
            RETURNING id
        """
        cursor.execute(query, (email, password_hash, full_name))
        conn.commit()
        user_id = cursor.fetchone()[0]
        return user_id
    except psycopg2.Error as err:
        print(f"Error: {err}")
        return None
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Fetches a user by their email address."""
    conn = get_connection()
    if not conn:
        return None
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)
        query = "SELECT * FROM users WHERE email = %s"
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        return dict(user) if user else None
    except psycopg2.Error as err:
        print(f"Error: {err}")
        return None
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)


def assign_role(user_id: int, role_name: str) -> bool:
    """Assigns a role to a user."""
    conn = get_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)
        # First, get the role ID
        cursor.execute("SELECT id FROM roles WHERE role_name = %s", (role_name,))
        role = cursor.fetchone()
        if not role:
            return False
            
        role_id = role['id']
        
        # ON CONFLICT DO NOTHING silently skips if the role is already assigned
        query = """
            INSERT INTO user_roles (user_id, role_id) 
            VALUES (%s, %s) 
            ON CONFLICT DO NOTHING
        """
        cursor.execute(query, (user_id, role_id))
        conn.commit()
        return True
    except psycopg2.Error as err:
        print(f"Error: {err}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)


def get_user_roles(user_id: int) -> List[str]:
    """Fetches all roles for a given user."""
    conn = get_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor()
        query = """
            SELECT r.role_name 
            FROM roles r
            JOIN user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = %s
        """
        cursor.execute(query, (user_id,))
        roles = [row[0] for row in cursor.fetchall()]
        return roles
    except psycopg2.Error as err:
        print(f"Error: {err}")
        return []
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Fetches a user by their ID."""
    conn = get_connection()
    if not conn:
        return None
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)
        query = "SELECT * FROM users WHERE id = %s"
        cursor.execute(query, (user_id,))
        user = cursor.fetchone()
        return dict(user) if user else None
    except psycopg2.Error as err:
        print(f"Error: {err}")
        return None
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)


def update_user_account(user_id: int, full_name: str, email: str) -> bool:
    """Updates user's name and email."""
    conn = get_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor()
        query = "UPDATE users SET full_name = %s, email = %s, updated_at = NOW() WHERE id = %s"
        cursor.execute(query, (full_name, email, user_id))
        conn.commit()
        return True
    except psycopg2.Error as err:
        print(f"Error: {err}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)


def update_user_password(user_id: int, new_password_hash: str) -> bool:
    """Updates user's password."""
    conn = get_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor()
        query = "UPDATE users SET password_hash = %s, updated_at = NOW() WHERE id = %s"
        cursor.execute(query, (new_password_hash, user_id))
        conn.commit()
        return True
    except psycopg2.Error as err:
        print(f"Error: {err}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)
