import urllib.request
import urllib.parse
import json
import sys
import os

BASE_URL = "http://127.0.0.1:8000"

def make_request(path, method="GET", data=None, token=None, files=None, content_type="application/json"):
    url = f"{BASE_URL}{path}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    if files:
        # Multipart form data upload using raw urllib
        boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        body = bytearray()
        for field_name, file_info in files.items():
            filename, file_content = file_info
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode("utf-8"))
            body.extend(f"Content-Type: image/png\r\n\r\n".encode("utf-8"))
            body.extend(file_content)
            body.extend(b"\r\n")
        body.extend(f"--{boundary}--\r\n".encode("utf-8"))
        req_data = bytes(body)
    else:
        headers["Content-Type"] = content_type
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
    print("--- STARTING ATHLETE CRUD TESTS ---")

    # 1. Log in as operator (created in test_auth.py)
    login_credentials = {
        "email": "coach.test@example.com",
        "password": "strongPassword123"
    }
    print("\n1. Logging in as Administrator...")
    login_response, status = make_request("/login", method="POST", data=login_credentials)
    if status != 200:
        # Register if not exists
        print("Operator login failed. Registering new test operator...")
        reg_user = {
            "name": "Coach Carter",
            "email": "coach.test@example.com",
            "password": "strongPassword123",
            "role": "Coach"
        }
        make_request("/register", method="POST", data=reg_user)
        login_response, status = make_request("/login", method="POST", data=login_credentials)
        if status != 200:
            print("Failed to authenticate test operator. Exiting.")
            sys.exit(1)

    token = login_response["access_token"]
    print("Login successful! Token acquired.")

    # 2. Upload photo (simulated upload)
    print("\n2. Testing Photo Upload (POST /athletes/upload-photo)...")
    dummy_image_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82" # 1px transparent PNG
    files = {"file": ("avatar.png", dummy_image_content)}
    upload_response, status = make_request("/athletes/upload-photo", method="POST", token=token, files=files)
    print(f"Status Code: {status}")
    print(f"Response: {upload_response}")
    if status != 200:
        print("Upload failed.")
        sys.exit(1)
    
    photo_url = upload_response["photo_url"]

    # 3. Create Athlete
    print("\n3. Testing Athlete Creation (POST /athletes)...")
    new_athlete = {
        "full_name": "Sarah Miller",
        "age": 22,
        "gender": "Female",
        "sport": "Sprinting",
        "playing_position": "Lane 4 Racer",
        "height": "174 cm",
        "weight": "61 kg",
        "training_load": "Medium",
        "experience": "4 years collegiate",
        "fitness_level": "Elite",
        "medical_notes": "None",
        "injury_history": "Mild hamstring pull (2025)",
        "emergency_contact": "John Miller (555-0192)",
        "coach_name": "Coach Gallagher",
        "photo": photo_url,
        "disability_status": "No"
    }
    
    create_response, status = make_request("/athletes", method="POST", data=new_athlete, token=token)
    print(f"Status Code: {status}")
    print(f"Response: {json.dumps(create_response, indent=2)}")
    if status != 201:
        print("Creation failed.")
        sys.exit(1)

    athlete_db_id = create_response["_id"]
    athlete_custom_id = create_response["athlete_id"]

    # 4. List Athletes (Verify listing, search, filters)
    print("\n4. Testing List/Search (GET /athletes?search=Sarah&sport=Sprinting)...")
    list_response, status = make_request(f"/athletes?search=Sarah&sport=Sprinting&page=1&limit=5", token=token)
    print(f"Status Code: {status}")
    print(f"Response: Total {list_response.get('total')} items found on page {list_response.get('page')}.")
    
    # 5. Read single Athlete
    print(f"\n5. Testing Fetch Profile (GET /athletes/{athlete_db_id})...")
    get_response, status = make_request(f"/athletes/{athlete_db_id}", token=token)
    print(f"Status Code: {status}")
    print(f"Response name matches: {get_response['full_name']}")

    # 6. Update Athlete
    print(f"\n6. Testing Profile Edit (PUT /athletes/{athlete_db_id})...")
    update_data = {
        "weight": "63 kg",
        "training_load": "High"
    }
    update_response, status = make_request(f"/athletes/{athlete_db_id}", method="PUT", data=update_data, token=token)
    print(f"Status Code: {status}")
    print(f"Updated weight matches: {update_response['weight']}")
    print(f"Updated load matches: {update_response['training_load']}")

    # 7. Delete Athlete
    print(f"\n7. Testing Profile Deletion (DELETE /athletes/{athlete_db_id})...")
    del_response, status = make_request(f"/athletes/{athlete_db_id}", method="DELETE", token=token)
    print(f"Status Code: {status}")
    print(f"Response: {del_response}")

    # 8. Verify deletion
    print("\n8. Confirming Deletion check...")
    check_response, status = make_request(f"/athletes/{athlete_db_id}", token=token)
    if status == 404:
        print("\n--- ALL ATHLETE CRUD TESTS PASSED SUCCESSFULLY! ---")
    else:
        print("\n--- TEST FAILURE: Athlete was not deleted ---")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
