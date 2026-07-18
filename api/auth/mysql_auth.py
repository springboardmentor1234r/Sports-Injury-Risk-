import mysql.connector
from mysql.connector import pooling
from api.config import settings
from typing import Optional, Dict, Any, List

# Initialize connection pool
try:
    dbconfig = {
        "host": settings.DB_HOST,
        "user": settings.DB_USER,
        "password": settings.DB_PASSWORD,
        "database": settings.DB_NAME,
    }
    pool = mysql.connector.pooling.MySQLConnectionPool(
        pool_name="mypool",
        pool_size=5,
        pool_reset_session=True,
        **dbconfig
    )
except Exception as e:
    print(f"Error initializing MySQL pool: {e}")
    pool = None

def get_connection():
    if pool:
        return pool.get_connection()
    return None

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
        """
        cursor.execute(query, (email, password_hash, full_name))
        conn.commit()
        user_id = cursor.lastrowid
        return user_id
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None
    finally:
        cursor.close()
        conn.close()

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Fetches a user by their email address."""
    conn = get_connection()
    if not conn:
        return None
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM users WHERE email = %s"
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        return user
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None
    finally:
        cursor.close()
        conn.close()

def assign_role(user_id: int, role_name: str) -> bool:
    """Assigns a role to a user."""
    conn = get_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor(dictionary=True)
        # First, get the role ID
        cursor.execute("SELECT id FROM roles WHERE role_name = %s", (role_name,))
        role = cursor.fetchone()
        if not role:
            return False
            
        role_id = role['id']
        
        # Then, insert into user_roles
        cursor.execute("INSERT INTO user_roles (user_id, role_id) VALUES (%s, %s)", (user_id, role_id))
        conn.commit()
        return True
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return False
    finally:
        cursor.close()
        conn.close()

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
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return []
    finally:
        cursor.close()
        conn.close()

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Fetches a user by their ID."""
    conn = get_connection()
    if not conn:
        return None
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM users WHERE id = %s"
        cursor.execute(query, (user_id,))
        user = cursor.fetchone()
        return user
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None
    finally:
        cursor.close()
        conn.close()

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
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return False
    finally:
        cursor.close()
        conn.close()

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
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return False
    finally:
        cursor.close()
        conn.close()
