import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def make_request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    req_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode("utf-8")
            return json.loads(res_data), response.status
    except urllib.error.HTTPError as e:
        error_data = e.read().decode("utf-8")
        try:
            parsed_err = json.loads(error_data)
        except Exception:
            parsed_err = error_data
        print(f"HTTP Error {e.code}: {parsed_err}")
        return parsed_err, e.code
    except Exception as e:
        print(f"Connection Error: {e}")
        return None, 500

def run_tests():
    print("--- STARTING AUTHENTICATION SYSTEM TESTS ---")
    
    # 1. Test registration API
    test_user = {
        "name": "Alex Carter",
        "email": f"alex.carter.test@example.com",
        "password": "strongPassword123",
        "role": "Athlete"
    }
    
    print(f"\n1. Testing User Registration (POST /register)...")
    reg_response, status = make_request("/register", method="POST", data=test_user)
    print(f"Status Code: {status}")
    print(f"Response: {json.dumps(reg_response, indent=2)}")
    
    # If duplicate, we can ignore and log in
    if status == 400 and "already exists" in str(reg_response):
        print("User already exists, proceeding to login testing.")
    elif status != 201:
        print("Registration failed. Exiting tests.")
        sys.exit(1)
        
    # 2. Test login API
    login_credentials = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    print(f"\n2. Testing User Login (POST /login)...")
    login_response, status = make_request("/login", method="POST", data=login_credentials)
    print(f"Status Code: {status}")
    print(f"Response: {json.dumps(login_response, indent=2)}")
    
    if status != 200:
        print("Login failed. Exiting tests.")
        sys.exit(1)
        
    token = login_response.get("access_token")
    if not token:
        print("No token returned. Exiting.")
        sys.exit(1)
        
    # 3. Test protected API
    print(f"\n3. Testing Protected Endpoint (GET /me)...")
    me_response, status = make_request("/me", token=token)
    print(f"Status Code: {status}")
    print(f"Response: {json.dumps(me_response, indent=2)}")
    
    if status == 200:
        print("\n--- ALL BACKEND AUTH TESTS PASSED SUCCESSFULLY! ---")
    else:
        print("\n--- TESTS FAILED ---")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
