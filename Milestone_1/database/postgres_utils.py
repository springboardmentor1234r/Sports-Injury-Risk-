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
        # Use ThreadedConnectionPool (minconn=1, maxconn=10) for FastAPI concurrency.
        # Maxconn lowered to 10 to prevent connection exhaustion when scaling multiple workers.
        # TIP: If using Supabase, ensure DATABASE_URL uses the Transaction pooler port (6543).
        pg_pool = psycopg2.pool.ThreadedConnectionPool(1, 10, DATABASE_URL)
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
        import urllib.parse
        safe_name = urllib.parse.quote(full_name or email.split('@')[0])
        profile_pic = f"https://ui-avatars.com/api/?name={safe_name}&background=004ccd&color=fff"

        cursor = conn.cursor()
        query = """
            INSERT INTO users (email, password_hash, full_name, profile_picture_url, is_active, created_at, updated_at) 
            VALUES (%s, %s, %s, %s, True, NOW(), NOW())
            RETURNING id
        """
        cursor.execute(query, (email, password_hash, full_name, profile_pic))
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
            cursor.execute("INSERT INTO roles (role_name) VALUES (%s) RETURNING id", (role_name,))
            conn.commit()
            role_id = cursor.fetchone()['id']
        else:
            role_id = role['id']
            
        # ON CONFLICT DO NOTHING silently skips if the role is already assigned
        query = """
            INSERT INTO user_roles (user_id, role_id) 
            VALUES (%s, %s) 
            ON CONFLICT DO NOTHING
        """
        cursor.execute(query, (user_id, role_id))
        conn.commit()
        
        # Trigger ES syncs
        try:
            from src.worker.search_tasks import sync_user_global_to_es, sync_coach_to_es
            sync_user_global_to_es.apply_async(args=[user_id], queue='default')
            if role_name == 'coach':
                sync_coach_to_es.apply_async(args=[user_id], queue='default')
        except Exception as e:
            print(f"ES Sync failed for role assignment: {e}")
            
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
        if not user:
            return None
        user_dict = dict(user)
        
        # Ensure coach has a unique invite code
        cursor.execute("""
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = %s AND r.role_name = 'coach'
        """, (user_id,))
        is_coach = cursor.fetchone()
        if is_coach and not user_dict.get("coach_code"):
            import random
            import string
            while True:
                code = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
                cursor.execute("SELECT 1 FROM users WHERE coach_code = %s", (code,))
                if not cursor.fetchone():
                    break
            cursor.execute("UPDATE users SET coach_code = %s WHERE id = %s", (code, user_id))
            conn.commit()
            user_dict["coach_code"] = code
            
        return user_dict
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
        
        # Trigger ES syncs
        try:
            from src.worker.search_tasks import sync_user_global_to_es, sync_coach_to_es
            sync_user_global_to_es.apply_async(args=[user_id], queue='default')
            sync_coach_to_es.apply_async(args=[user_id], queue='default')
        except Exception as e:
            print(f"ES Sync failed for account update: {e}")
            
        return True
    except psycopg2.Error as err:
        print(f"Error: {err}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)


def update_user_profile_picture(user_id: int, profile_picture_url: str) -> bool:
    """Updates user's profile picture URL in PostgreSQL database."""
    conn = get_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor()
        query = "UPDATE users SET profile_picture_url = %s, updated_at = NOW() WHERE id = %s"
        cursor.execute(query, (profile_picture_url, user_id))
        conn.commit()
        return True
    except psycopg2.Error as err:
        print(f"Error update_user_profile_picture: {err}")
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

def search_coaches_by_name(query_str: str) -> List[Dict[str, Any]]:
    """Search for coaches using Elasticsearch fuzzy matching, fallback to SQL."""
    try:
        from database.elastic_utils import get_es_client
        es = get_es_client()
        if es:
            query_body = {
                "query": {
                    "multi_match": {
                        "query": query_str,
                        "fields": ["full_name^3", "email", "coach_code"],
                        "fuzziness": "AUTO"
                    }
                }
            }
            res = es.search(index="coaches", body=query_body, size=20)
            results = []
            for hit in res["hits"]["hits"]:
                source = hit["_source"]
                results.append(source)
            if results:
                return results
    except Exception as e:
        print(f"Elasticsearch search_coaches_by_name failed, falling back to SQL: {e}")

    # Fallback to SQL
    conn = get_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)
        query = """
            SELECT u.id, u.full_name, u.email, u.coach_code 
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE r.role_name = 'coach' AND (u.full_name ILIKE %s OR u.email ILIKE %s OR u.coach_code ILIKE %s)
        """
        like_pattern = f"%{query_str}%"
        cursor.execute(query, (like_pattern, like_pattern, like_pattern))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    except psycopg2.Error as err:
        print(f"Error search_coaches_by_name: {err}")
        return []
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)

def get_assigned_athletes(coach_id: int) -> List[Dict[str, Any]]:
    """Get all approved athletes assigned to a coach."""
    conn = get_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)
        query = """
            SELECT u.id, u.full_name, u.email, u.profile_picture_url
            FROM users u
            JOIN coach_athlete_assignments caa ON u.id = caa.athlete_id
            WHERE caa.coach_id = %s AND caa.status = 'accepted'
        """
        cursor.execute(query, (coach_id,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    except psycopg2.Error as err:
        print(f"Error get_assigned_athletes: {err}")
        return []
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)

def create_athlete_by_coach(email: str, password_hash: str, full_name: str, coach_id: int) -> Optional[int]:
    """Manually registers an athlete and automatically assigns them to the coach's roster."""
    conn = get_connection()
    if not conn:
        return None
    try:
        cursor = conn.cursor()
        # Create user
        query_user = """
            INSERT INTO users (email, password_hash, full_name, is_active, created_at, updated_at) 
            VALUES (%s, %s, %s, True, NOW(), NOW()) RETURNING id
        """
        cursor.execute(query_user, (email, password_hash, full_name))
        athlete_id = cursor.fetchone()[0]
        
        # Assign role
        cursor.execute("SELECT id FROM roles WHERE role_name = 'athlete'")
        role_record = cursor.fetchone()
        
        if not role_record:
            cursor.execute("INSERT INTO roles (role_name) VALUES ('athlete') RETURNING id")
            role_id = cursor.fetchone()[0]
        else:
            role_id = role_record[0]
            
        query_role = "INSERT INTO user_roles (user_id, role_id) VALUES (%s, %s) ON CONFLICT DO NOTHING"
        cursor.execute(query_role, (athlete_id, role_id))
        
        # Assign to coach (automatically approved)
        query_assign = """
            INSERT INTO coach_athlete_assignments (coach_id, athlete_id, status, created_at, updated_at)
            VALUES (%s, %s, 'accepted', NOW(), NOW())
        """
        cursor.execute(query_assign, (coach_id, athlete_id))
        
        conn.commit()
        return athlete_id
    except psycopg2.Error as err:
        print(f"Error create_athlete_by_coach: {err}")
        conn.rollback()
        return None
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)

def remove_athlete_from_coach(coach_id: int, athlete_id: int) -> bool:
    """Remove athlete connection from coach's roster."""
    conn = get_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor()
        query = "DELETE FROM coach_athlete_assignments WHERE coach_id = %s AND athlete_id = %s"
        cursor.execute(query, (coach_id, athlete_id))
        # Also remove them from teams
        query_team = """
            DELETE FROM team_athletes WHERE id IN (
                SELECT ta.id FROM team_athletes ta
                JOIN teams t ON ta.team_id = t.id
                WHERE t.coach_id = %s AND ta.athlete_id = %s
            )
        """
        cursor.execute(query_team, (coach_id, athlete_id))
        conn.commit()
        return True
    except psycopg2.Error as err:
        print(f"Error remove_athlete_from_coach: {err}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)

def request_coach(athlete_id: int, coach_id: int) -> bool:
    """Send connection invite request from athlete to coach."""
    conn = get_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor()
        # Verify if pairing already exists
        query_check = "SELECT id FROM coach_athlete_assignments WHERE athlete_id = %s AND coach_id = %s"
        cursor.execute(query_check, (athlete_id, coach_id))
        if cursor.fetchone():
            return False
            
        query = """
            INSERT INTO coach_athlete_assignments (coach_id, athlete_id, status, created_at, updated_at)
            VALUES (%s, %s, 'pending', NOW(), NOW())
        """
        cursor.execute(query, (coach_id, athlete_id))
        conn.commit()
        return True
    except psycopg2.Error as err:
        print(f"Error request_coach: {err}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)

def get_athlete_coach(athlete_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve coach details and pairing connection status for an athlete."""
    conn = get_connection()
    if not conn:
        return None
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)
        query = """
            SELECT caa.status, u.id, u.full_name as coach_name, u.email as coach_email,
                   u.profile_picture_url as coach_picture_url
            FROM coach_athlete_assignments caa
            JOIN users u ON caa.coach_id = u.id
            WHERE caa.athlete_id = %s
        """
        cursor.execute(query, (athlete_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    except psycopg2.Error as err:
        print(f"Error get_athlete_coach: {err}")
        return None
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)

def get_coach_requests(coach_id: int) -> List[Dict[str, Any]]:
    """Retrieve all pending request invites for this coach."""
    conn = get_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)
        query = """
            SELECT caa.id, caa.athlete_id, u.full_name as athlete_name, u.email as athlete_email, u.profile_picture_url as athlete_picture_url
            FROM coach_athlete_assignments caa
            JOIN users u ON caa.athlete_id = u.id
            WHERE caa.coach_id = %s AND caa.status = 'pending'
        """
        cursor.execute(query, (coach_id,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    except psycopg2.Error as err:
        print(f"Error get_coach_requests: {err}")
        return []
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)

def respond_coach_request(request_id: int, status: str) -> bool:
    """Approve ('accepted') or reject ('rejected') a pending connection invitation."""
    conn = get_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor()
        if status.lower() == 'accepted':
            query = "UPDATE coach_athlete_assignments SET status = 'accepted' WHERE id = %s"
            cursor.execute(query, (request_id,))
        else:
            query = "DELETE FROM coach_athlete_assignments WHERE id = %s"
            cursor.execute(query, (request_id,))
        conn.commit()
        return True
    except psycopg2.Error as err:
        print(f"Error respond_coach_request: {err}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)

def get_notifications(user_id: int) -> List[Dict[str, Any]]:
    """Retrieve all notification warnings and alerts for a user."""
    conn = get_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)
        query = "SELECT id, message, type, is_read, created_at FROM notifications WHERE user_id = %s ORDER BY created_at DESC"
        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    except psycopg2.Error as err:
        print(f"Error get_notifications: {err}")
        return []
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)

def create_notification(user_id: int, message: str, type_str: str = "info") -> bool:
    """Log an alert message notification to a specific user's feed."""
    conn = get_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor()
        query = "INSERT INTO notifications (user_id, message, type, is_read, created_at) VALUES (%s, %s, %s, False, NOW())"
        cursor.execute(query, (user_id, message, type_str))
        conn.commit()
        return True
    except psycopg2.Error as err:
        print(f"Error create_notification: {err}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)

def create_team(coach_id: int, team_name: str) -> Optional[int]:
    """Create a new custom team group under this coach."""
    conn = get_connection()
    if not conn:
        return None
    try:
        cursor = conn.cursor()
        query = "INSERT INTO teams (coach_id, name, created_at) VALUES (%s, %s, NOW()) RETURNING id"
        cursor.execute(query, (coach_id, team_name))
        team_id = cursor.fetchone()[0]
        conn.commit()
        return team_id
    except psycopg2.Error as err:
        print(f"Error create_team: {err}")
        return None
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)

def add_athlete_to_team(team_id: int, athlete_id: int) -> bool:
    """Assign an athlete to a custom team group."""
    conn = get_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor()
        # Verify if already in team
        cursor.execute("SELECT id FROM team_athletes WHERE team_id = %s AND athlete_id = %s", (team_id, athlete_id))
        if cursor.fetchone():
            return True
        query = "INSERT INTO team_athletes (team_id, athlete_id, created_at) VALUES (%s, %s, NOW())"
        cursor.execute(query, (team_id, athlete_id))
        conn.commit()
        return True
    except psycopg2.Error as err:
        print(f"Error add_athlete_to_team: {err}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)

def get_teams_with_athletes(coach_id: int) -> List[Dict[str, Any]]:
    """Retrieve all teams owned by the coach, listing all grouped athletes."""
    conn = get_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)
        # Fetch all teams
        cursor.execute("SELECT id, name FROM teams WHERE coach_id = %s", (coach_id,))
        teams_rows = cursor.fetchall()
        teams_list = [dict(r) for r in teams_rows]
        
        for t in teams_list:
            # Fetch all athletes assigned to this team
            query_ath = """
                SELECT u.id, u.full_name, u.email
                FROM users u
                JOIN team_athletes ta ON u.id = ta.athlete_id
                WHERE ta.team_id = %s
            """
            cursor.execute(query_ath, (t["id"],))
            ath_rows = cursor.fetchall()
            t["athletes"] = [dict(r) for r in ath_rows]
            
        return teams_list
    except psycopg2.Error as err:
        print(f"Error get_teams_with_athletes: {err}")
        return []
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)

def delete_team_by_id(coach_id: int, team_id: int) -> bool:
    """Deletes a custom team group in Postgres."""
    conn = get_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM teams WHERE id = %s AND coach_id = %s", (team_id, coach_id))
        if not cursor.fetchone():
            return False
            
        cursor.execute("DELETE FROM team_athletes WHERE team_id = %s", (team_id,))
        cursor.execute("DELETE FROM teams WHERE id = %s", (team_id,))
        conn.commit()
        return True
    except psycopg2.Error as err:
        print(f"Error delete_team_by_id: {err}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)


# ── Internal Platform Governance Functions ────────────────────────────────────

def get_all_users_paginated(page: int = 1, size: int = 20, search: str = "") -> Dict[str, Any]:
    """Paginated list of all non-admin users with their roles, using Elasticsearch."""
    try:
        from database.elastic_utils import get_es_client
        es = get_es_client()
        if es:
            query_body = {
                "query": {
                    "bool": {
                        "must_not": [
                            {"match": {"roles": "admin"}}
                        ]
                    }
                },
                "from": (page - 1) * size,
                "size": size,
                "sort": [{"created_at": {"order": "desc"}}]
            }
            if search:
                query_body["query"]["bool"]["should"] = [
                    {
                        "multi_match": {
                            "query": search,
                            "fields": ["full_name^3", "email"],
                            "fuzziness": "AUTO"
                        }
                    }
                ]
                query_body["query"]["bool"]["minimum_should_match"] = 1
                
            res = es.search(index="users_global", body=query_body)
            users = []
            for hit in res["hits"]["hits"]:
                source = hit["_source"]
                users.append({
                    "id": source.get("id"),
                    "email": source.get("email"),
                    "full_name": source.get("full_name"),
                    "is_active": source.get("is_active"),
                    "roles": source.get("roles", []),
                    "created_at": source.get("created_at")
                })
            
            return {
                "total": res["hits"]["total"]["value"],
                "users": users
            }
    except Exception as e:
        print(f"Elasticsearch get_all_users_paginated failed: {e}")

    # Fallback to SQL
    conn = get_connection()
    if not conn:
        return {"total": 0, "users": []}
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)
        offset = (page - 1) * size
        like_pattern = f"%{search}%"
        
        # Exclude accounts that carry the admin role
        count_sql = """
            SELECT COUNT(*) as cnt FROM users u
            WHERE (u.full_name ILIKE %s OR u.email ILIKE %s)
            AND NOT EXISTS (
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = u.id AND r.role_name = 'admin'
            )
        """
        cursor.execute(count_sql, (like_pattern, like_pattern))
        total = cursor.fetchone()["cnt"]

        query = """
            SELECT u.id, u.email, u.full_name, u.is_active, u.created_at
            FROM users u
            WHERE (u.full_name ILIKE %s OR u.email ILIKE %s)
            AND NOT EXISTS (
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = u.id AND r.role_name = 'admin'
            )
            ORDER BY u.created_at DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, (like_pattern, like_pattern, size, offset))
        users_raw = cursor.fetchall()
        users = []
        for u in users_raw:
            user_dict = dict(u)
            cursor.execute("""
                SELECT r.role_name FROM roles r
                JOIN user_roles ur ON r.id = ur.role_id
                WHERE ur.user_id = %s
            """, (u["id"],))
            user_dict["roles"] = [row["role_name"] for row in cursor.fetchall()]
            if user_dict.get("created_at"):
                user_dict["created_at"] = str(user_dict["created_at"])
            users.append(user_dict)
        return {"total": total, "users": users}
    except Exception as err:
        print(f"Error get_all_users_paginated: {err}")
        return {"total": 0, "users": []}
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)


def update_user_roles(user_id: int, roles: List[str]) -> bool:
    """Replace the complete role set for a user."""
    conn = get_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)
        # Remove all existing roles
        cursor.execute("DELETE FROM user_roles WHERE user_id = %s", (user_id,))
        for role_name in roles:
            cursor.execute("SELECT id FROM roles WHERE role_name = %s", (role_name,))
            row = cursor.fetchone()
            if not row:
                cursor.execute("INSERT INTO roles (role_name) VALUES (%s) RETURNING id", (role_name,))
                role_id = cursor.fetchone()['id']
            else:
                role_id = row['id']
            cursor.execute(
                "INSERT INTO user_roles (user_id, role_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (user_id, role_id)
            )
        conn.commit()
        return True
    except psycopg2.Error as err:
        print(f"Error update_user_roles: {err}")
        conn.rollback()
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)


def toggle_user_status(user_id: int, is_active: bool) -> bool:
    """Enable or disable a user account."""
    conn = get_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET is_active = %s, updated_at = NOW() WHERE id = %s", (is_active, user_id))
        conn.commit()
        return True
    except psycopg2.Error as err:
        print(f"Error toggle_user_status: {err}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)


def get_platform_analytics() -> Dict[str, Any]:
    """Return high-level operational stats: user counts, role distribution, daily volumes."""
    conn = get_connection()
    if not conn:
        return {}
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)

        # Total users
        cursor.execute("SELECT COUNT(*) FROM users")
        total_users = cursor.fetchone()[0]

        # Active users
        cursor.execute("SELECT COUNT(*) FROM users WHERE is_active = TRUE")
        active_users = cursor.fetchone()[0]

        # Role breakdown
        cursor.execute("""
            SELECT r.role_name, COUNT(ur.user_id) as cnt
            FROM roles r LEFT JOIN user_roles ur ON r.id = ur.role_id
            GROUP BY r.role_name
        """)
        roles_breakdown = {row['role_name']: row['cnt'] for row in cursor.fetchall()}

        # Daily registrations (last 30 days)
        cursor.execute("""
            SELECT DATE(created_at) as day, COUNT(*) as count
            FROM users
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY day ASC
        """)
        daily_registrations = [{"date": str(r['day']), "count": r['count']} for r in cursor.fetchall()]

        # Total sessions processed & status breakdown
        try:
            from database.mongo_utils import get_db_connection as get_mongo
            mongo_db = get_mongo()
            
            pipeline = [
                {"$group": {"_id": "$status", "count": {"$sum": 1}}}
            ]
            status_counts = list(mongo_db["sessions"].aggregate(pipeline))
            
            total_sessions = 0
            session_breakdown = {"completed": 0, "processing": 0, "failed": 0, "pending": 0}
            
            for status in status_counts:
                st = status["_id"]
                count = status["count"]
                total_sessions += count
                if st in session_breakdown:
                    session_breakdown[st] = count
                else:
                    session_breakdown[st] = count
        except Exception:
            total_sessions = 0
            session_breakdown = {}

        return {
            "total_users": total_users,
            "active_users": active_users,
            "roles_breakdown": roles_breakdown,
            "daily_registrations": daily_registrations,
            "total_sessions": total_sessions,
            "session_breakdown": session_breakdown,
        }
    except psycopg2.Error as err:
        print(f"Error get_platform_analytics: {err}")
        return {}
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)

def get_postgres_stats() -> dict:
    """Returns basic monitoring stats from PostgreSQL."""
    conn = get_connection()
    if not conn:
        return {"status": "error", "message": "No connection"}
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)
        cursor.execute("SELECT count(*) FROM pg_stat_activity")
        active_connections = cursor.fetchone()[0]
        
        cursor.execute("SELECT pg_database_size(current_database())")
        db_size_bytes = cursor.fetchone()[0]
        
        return {
            "status": "ok",
            "active_connections": active_connections,
            "database_size_mb": round(db_size_bytes / (1024 * 1024), 2)
        }
    except psycopg2.Error as err:
        return {"status": "error", "message": str(err)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        release_connection(conn)


def get_session_audit_log(page: int = 1, size: int = 20, status_filter: str = "") -> Dict[str, Any]:
    """Return global session audit log with operational metadata only (no health/biomechanical scores)."""
    try:
        from database.mongo_utils import get_db_connection as get_mongo
        mongo_db = get_mongo()
        query: dict = {}
        if status_filter:
            query["status"] = status_filter

        total = mongo_db["sessions"].count_documents(query)
        skip = (page - 1) * size
        cursor_m = mongo_db["sessions"].find(
            query,
            {"session_id": 1, "athlete_id": 1, "video_name": 1, "created_at": 1, "status": 1, "error_message": 1}
        ).sort("created_at", -1).skip(skip).limit(size)

        sessions = []
        conn = get_connection()
        for doc in cursor_m:
            entry: Dict[str, Any] = {
                "session_id": str(doc.get("session_id", "")),
                "athlete_id": str(doc.get("athlete_id", "")),
                "video_name": doc.get("video_name", ""),
                "created_at": str(doc.get("created_at", "")),
                "status": doc.get("status", "completed"),
                "error_message": doc.get("error_message", ""),
                "user_email": ""
            }
            if conn:
                try:
                    c = conn.cursor(cursor_factory=DictCursor)
                    c.execute("SELECT email FROM users WHERE id = %s", (entry["athlete_id"],))
                    row = c.fetchone()
                    if row:
                        entry["user_email"] = row["email"]
                    c.close()
                except Exception:
                    pass
            sessions.append(entry)
        return {"total": total, "sessions": sessions}
    except Exception as err:
        print(f"Error get_session_audit_log: {err}")
        return {"total": 0, "sessions": []}
    finally:
        if 'conn' in locals() and conn:
            release_connection(conn)

# ==========================================
# WEBHOOKS
# ==========================================

import json
from psycopg2.extras import DictCursor, Json

def create_webhook(user_id: int, url: str, events: list) -> Optional[Dict[str, Any]]:
    """Register a new webhook for a user."""
    conn = get_connection()
    if not conn:
        return None
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        query = """
            INSERT INTO webhooks (user_id, url, events)
            VALUES (%s, %s, %s)
            RETURNING *
        """
        # Json() adapts python list to jsonb for postgres
        cursor.execute(query, (user_id, url, Json(events)))
        webhook = cursor.fetchone()
        conn.commit()
        
        if webhook:
            res = dict(webhook)
            if isinstance(res.get("events"), str):
                res["events"] = json.loads(res["events"])
            return res
        return None
    except Exception as e:
        print(f"Error creating webhook: {e}")
        if conn:
            conn.rollback()
        return None
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            release_connection(conn)

def get_webhooks_by_user(user_id: int) -> List[Dict[str, Any]]:
    """Get all webhooks registered by a specific user."""
    conn = get_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)
        query = "SELECT * FROM webhooks WHERE user_id = %s"
        cursor.execute(query, (user_id,))
        webhooks = cursor.fetchall()
        
        results = []
        for wh in webhooks:
            res = dict(wh)
            if isinstance(res.get("events"), str):
                res["events"] = json.loads(res["events"])
            results.append(res)
        return results
    except Exception as e:
        print(f"Error fetching webhooks: {e}")
        return []
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            release_connection(conn)

def delete_webhook(webhook_id: int, user_id: int) -> bool:
    """Delete a webhook by ID (must belong to user)."""
    conn = get_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor()
        query = "DELETE FROM webhooks WHERE id = %s AND user_id = %s"
        cursor.execute(query, (webhook_id, user_id))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error deleting webhook: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            release_connection(conn)

def get_webhooks_by_event(event_name: str, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Get all active webhooks subscribed to a specific event.
    Optionally filter by user_id.
    """
    conn = get_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        # In Postgres JSONB, we check if events array contains the event string
        # using the @> operator: events @> '["event_name"]'::jsonb
        search_json = json.dumps([event_name])
        
        if user_id:
            query = """
                SELECT * FROM webhooks 
                WHERE is_active = TRUE 
                AND user_id = %s 
                AND events @> %s::jsonb
            """
            cursor.execute(query, (user_id, search_json))
        else:
            query = """
                SELECT * FROM webhooks 
                WHERE is_active = TRUE 
                AND events @> %s::jsonb
            """
            cursor.execute(query, (search_json,))
            
        webhooks = cursor.fetchall()
        results = []
        for wh in webhooks:
            res = dict(wh)
            if isinstance(res.get("events"), str):
                res["events"] = json.loads(res["events"])
            results.append(res)
        return results
    except Exception as e:
        print(f"Error fetching webhooks by event: {e}")
        return []
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            release_connection(conn)
