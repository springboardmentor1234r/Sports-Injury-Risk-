import psycopg2
import random
from datetime import datetime, timedelta

def seed_db():
    conn = psycopg2.connect("dbname=sport user=postgres password=postgres host=localhost")
    cur = conn.cursor()
    
    # Insert users
    cur.execute("""
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ('admin@sport.com', 'hash123', 'Admin', 'User', 'ADMIN'),
               ('coach@sport.com', 'hash123', 'Coach', 'Carter', 'COACH'),
               ('athlete@sport.com', 'hash123', 'John', 'Doe', 'ATHLETE')
        RETURNING id;
    """)
    users = cur.fetchall()
    
    # Insert athletes
    cur.execute("""
        INSERT INTO athletes (user_id, date_of_birth, height_cm, weight_kg, gender, sport, playing_position)
        VALUES (%s, '1995-05-15', 180.5, 75.0, 'M', 'Basketball', 'Point Guard')
        RETURNING id;
    """, (users[2][0],))
    athlete_id = cur.fetchone()[0]
    
    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    seed_db()
