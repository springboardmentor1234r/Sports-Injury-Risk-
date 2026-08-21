import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tests.test_api_suite import (
    test_system_health,
    test_athlete_registration_and_auth,
    test_strict_athlete_data_isolation,
    test_coach_dashboard_sees_new_athlete
)

if __name__ == "__main__":
    print("--- RUNNING ATHLETIQ AI API TEST SUITE ---")
    
    print("\n1. Testing System Health API...")
    test_system_health()
    print("   [PASS] System Health API OK")

    print("\n2. Testing Athlete Registration & JWT Authentication...")
    test_athlete_registration_and_auth()
    print("   [PASS] Registration & Auth OK")

    print("\n3. Testing Strict Athlete Data Isolation (HTTP 403 Forbidden enforcement)...")
    test_strict_athlete_data_isolation()
    print("   [PASS] Data Isolation 403 Security Check OK")

    print("\n4. Testing Coach Dashboard Live Dynamic Sync (New registered athlete appears)...")
    test_coach_dashboard_sees_new_athlete()
    print("   [PASS] Coach Dashboard Dynamic Roster Sync OK")

    print("\n[SUCCESS] ALL BACKEND API TESTS PASSED SUCCESSFULLY!")
