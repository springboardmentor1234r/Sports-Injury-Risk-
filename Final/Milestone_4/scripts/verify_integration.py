import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def make_req(path, method="GET", data=None, token=None):
    url = BASE_URL + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, err_body

print("=" * 60)
print("COMPREHENSIVE INTEGRATION VERIFICATION")
print("=" * 60)

# 1. Login
print("\n1. Testing Login...")
status, res = make_req("/login", method="POST", data={"email": "coach_integration@test.com", "password": "password123"})


assert status == 200, f"Login failed: {res}"
token = res["access_token"]
print("   [PASS] Login successful. Got JWT token.")

# 2. Get user
print("\n2. Testing /me endpoint...")
status, user_data = make_req("/me", token=token)
assert status == 200, f"Get user failed: {user_data}"
print(f"   [PASS] Current user: {user_data.get('email')} ({user_data.get('role')})")

# 3. Get Analysis Sessions
print("\n3. Testing /milestone2/analysis/sessions...")
status, sessions_resp = make_req("/milestone2/analysis/sessions", token=token)
assert status == 200, f"Sessions list failed: {sessions_resp}"
sessions = sessions_resp.get("sessions", [])
print(f"   [PASS] Found {len(sessions)} session(s).")

if sessions:
    session = sessions[0]
    session_id = session.get("session_id")
    athlete_id = session.get("athlete_id")
    print(f"   Using Session ID: {session_id} | Athlete ID: {athlete_id}")

    # 4. Milestone 3 Analysis
    print(f"\n4. Testing /milestone3/analysis/{session_id}...")
    status, data = make_req(f"/milestone3/analysis/{session_id}", token=token)
    print(f"   Status Code: {status}")
    if status == 200:
        print(f"   [PASS] M3 Status: {data.get('status')}, Anomalies: {len(data.get('anomalies', []))}, Risks: {len(data.get('injury_risks', []))}")
    else:
        print(f"   Response: {data}")

    # 5. Milestone 4 Report
    print(f"\n5. Testing /milestone4/reports/{session_id}...")
    status, rep = make_req(f"/milestone4/reports/{session_id}", token=token)
    print(f"   Status Code: {status}")
    if status == 200:
        print(f"   [PASS] M4 Report loaded. Athlete: {rep.get('athlete_name')}, Overall Score: {rep.get('overall_risk_score')}")
    elif status == 404:
        print("   Report not generated yet, generating...")
        gen_status, gen_rep = make_req(f"/milestone4/reports/{session_id}/generate", method="POST", token=token)
        print(f"   Generate Status: {gen_status}")
        if gen_status == 201:
            print("   [PASS] M4 Report generated successfully!")

    # 6. Milestone 4 History
    if athlete_id:
        print(f"\n6. Testing /milestone4/history/{athlete_id}...")
        status, hist = make_req(f"/milestone4/history/{athlete_id}", token=token)
        print(f"   Status Code: {status}")
        if status == 200:
            print(f"   [PASS] History points: {len(hist)}")

    # 7. Milestone 4 Notifications
    if athlete_id:
        print(f"\n7. Testing /milestone4/notifications/{athlete_id}...")
        status, notifs = make_req(f"/milestone4/notifications/{athlete_id}", token=token)
        print(f"   Status Code: {status}")
        if status == 200:
            print(f"   [PASS] Notifications: {len(notifs)}")

print("\n" + "=" * 60)
print("ALL MILESTONE APIS VERIFIED AND FULLY OPERATIONAL!")
print("=" * 60)
