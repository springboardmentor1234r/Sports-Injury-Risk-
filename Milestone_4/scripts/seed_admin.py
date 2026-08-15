import os
import sys
from getpass import getpass
from passlib.context import CryptContext

# Ensure we can import from the main app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.sql_utils import create_user, assign_role, get_user_by_email

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_admin():
    print("--- 🚀 Seed Admin Account ---")
    email = input("Enter admin email: ").strip()
    
    # Check if user already exists
    existing_user = get_user_by_email(email)
    if existing_user:
        print(f"❌ User with email '{email}' already exists!")
        return

    full_name = input("Enter admin full name: ").strip()
    password = getpass("Enter admin password (typing will be hidden): ")
    
    print("\nCreating admin account...")
    
    try:
        # 1. Hash the password
        hashed_password = pwd_context.hash(password)
        
        # 2. Insert into the users table
        user_id = create_user(email, hashed_password, full_name)
        
        # 3. Assign the 'admin' role
        assign_role(user_id, "admin")
        
        print(f"✅ Success! Admin account created for {email}.")
        print(f"User ID: {user_id}")
    except Exception as e:
        print(f"❌ Failed to create admin: {e}")

if __name__ == "__main__":
    seed_admin()
