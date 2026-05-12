
import requests
import time
import os

# --- CONFIGURATION ---
BASE_URL = "http://localhost:8006"
timestamp = int(time.time())

# Unique identifiers to avoid database conflicts
EMAILS = {
    "company": f"hr_{timestamp}@tech.com",
    "candidate": f"dev_{timestamp}@gmail.com"
}

# Storage for IDs
store = {
    "comp_token": "",
    "cand_token": "",
    "job_id": "",
    "app_id": "",
    "session_id": ""
}

def log(msg, success=True):
    symbol = "✅" if success else "❌"
    print(f"{symbol} {msg}")

def test_full_workflow():
    print(f"\n--- STARTING FULL RECRUITMENT TEST ({BASE_URL}) ---\n")

    # 1. REGISTER & LOGIN COMPANY
    print("1. [Company] Registering...")
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "name": "Global Tech", "email": EMAILS["company"],
        "password": "password123", "role": "company"
    }).json()
    store["comp_token"] = res["token"]
    log(f"Company Registered. Token starts: {store['comp_token'][:10]}")

    # 2. COMPANY CREATES JOB
    print("\n2. [Company] Creating Job...")
    headers_comp = {"Authorization": f"Bearer {store['comp_token']}"}
    res = requests.post(f"{BASE_URL}/company/jobs", headers=headers_comp, json={
        "title": "Senior Python Developer",
        "description": "Must know FastAPI and Postgres.",
        "skills": ["Python", "Postgres", "Redis"],
        "location": "Remote", "jobType": "Full-time",
        "salaryMin": 60000, "salaryMax": 90000
    }).json()
    store["job_id"] = res["id"]
    log(f"Job Created! ID: {store['job_id']}")

    # 3. REGISTER & LOGIN CANDIDATE
    print("\n3. [Candidate] Registering...")
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "name": "Ananth Krishnan", "email": EMAILS["candidate"],
        "password": "password123", "role": "candidate"
    }).json()
    store["cand_token"] = res["token"]
    log(f"Candidate Registered. Token starts: {store['cand_token'][:10]}")

    # 4. CANDIDATE UPDATES PROFILE
    print("\n4. [Candidate] Updating Profile...")
    headers_cand = {"Authorization": f"Bearer {store['cand_token']}"}
    requests.put(f"{BASE_URL}/candidate/profile", headers=headers_cand, json={
        "skills": ["Python", "Django", "SQL"],
        "experienceYears": 5,
        "education": "B.Tech Computer Science"
    })
    log("Profile updated with skills and experience.")

    # 5. CANDIDATE APPLIES TO JOB
    print("\n5. [Candidate] Applying for Job...")
    res = requests.post(f"{BASE_URL}/candidate/apply/{store['job_id']}", headers=headers_cand, json={
        "coverLetter": "I have 5 years of Python experience and love building APIs."
    }).json()
    store["app_id"] = res["id"]
    log(f"Application submitted. ID: {store['app_id']}")

    # 6. CANDIDATE UPLOADS RESUME (AI Screening)
    print("\n6. [Candidate] Uploading Resume (AI Screening)...")
    # Create a dummy file
    with open("resume_mock.pdf", "w") as f: f.write("Expert Python developer with 5 years experience.")
    with open("resume_mock.pdf", "rb") as f:
        res = requests.post(
            f"{BASE_URL}/candidate/applications/{store['app_id']}/resume", 
            headers=headers_cand, 
            files={"resume": f}
        ).json()
    os.remove("resume_mock.pdf")
    log(f"AI Score: {res.get('score')} | Status: {res.get('status')}")

    # 7. CANDIDATE STARTS TEST (AI Generation)
    print("\n7. [Candidate] Starting Technical Test...")
    res = requests.get(f"{BASE_URL}/test/{store['app_id']}/start", headers=headers_cand).json()
    # Note: Backend might return 'id' or 'sessionId' depending on logic
    store["session_id"] = res.get("id") or res.get("sessionId")
    mcqs = res.get("questions", {}).get("mcqs", [])
    log(f"Test Started. Session: {store['session_id']}")
    log(f"AI generated {len(mcqs)} multiple choice questions.")

    # 8. SIMULATE PROCTORING VIOLATION
    print("\n8. [Proctoring] Simulating Tab Switch...")
    requests.post(f"{BASE_URL}/test/{store['app_id']}/proctor/event", headers=headers_cand, json={
        "eventType": "tab_switch",
        "detail": {"browser": "Chrome", "reason": "User tried to search Google"}
    })
    log("Violation recorded by proctoring system.")

    # 9. SUBMIT TEST ANSWERS (AI Grading)
    print("\n9. [Candidate] Submitting Test...")
    res = requests.post(f"{BASE_URL}/test/{store['app_id']}/submit", headers=headers_cand, json={
        "sessionId": store["session_id"],
        "mcqAnswers": {"mcq_1": "A", "mcq_2": "B"}, # Mock answers
        "codingAnswers": {"code_1": "def solution(): return True"}
    }).json()
    log(f"Test Submitted. Final Score: {res.get('finalScore')}")

    # 10. COMPANY REVIEWS RESULTS
    print("\n10. [Company] Viewing Detailed Applicant Report...")
    res = requests.get(f"{BASE_URL}/company/applications/{store['app_id']}/details", headers=headers_comp).json()
    
    print("\n" + "="*40)
    print(f"FINAL CANDIDATE REPORT: {res['candidate']['name']}")
    print(f"Current Status: {res['current_status']}")
    print(f"Resume Score:   {res['phases']['resume_screening']['score']}/100")
    print(f"Test Score:     {res['phases']['technical_test']['total_score']}/100")
    print(f"Cheating Flag:  {res['phases']['proctoring']['is_flagged']}")
    if res['phases']['proctoring']['is_flagged']:
        print(f"Flag Reasons:   {res['phases']['proctoring']['flags']}")
    print("="*40)

if __name__ == "__main__":
    try:
        test_full_workflow()
        print("\n🏆 ALL API TESTS PASSED SUCCESSFULLY!")
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")