#!/usr/bin/env python3
"""Live Stage 2 verification against the running Mabiz ASP.NET Core API.

Auth endpoints share a fixed-window rate limiter (12 requests/minute/IP in
Development), so the run is phased: A = account/token/OTP flows, B = reset +
logout after the window replenishes, C = explicit proof the limiter rejects bursts.
"""
import json, os, sys, time, urllib.error, urllib.request, uuid

BASE = os.environ.get("SMOKE_BASE", "http://127.0.0.1:5080")
API = BASE + "/api/v1"
LOG = os.environ.get("SMOKE_LOG", "/tmp/bc2-api.log")
WINDOW = int(os.environ.get("SMOKE_WINDOW_SECONDS", "63"))

results, errors = [], []


def check(name, ok, detail=""):
    results.append((name, ok))
    print(f"{'PASS' if ok else 'FAIL'} | {name} | {detail}", flush=True)
    if not ok:
        errors.append(name)


def call(method, url, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw else None), dict(r.headers)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            payload = json.loads(raw) if raw else None
        except Exception:
            payload = raw
        return e.code, payload, dict(e.headers)
    except Exception as e:  # connection failure etc.
        return 0, str(e), {}


def code_of(payload, key="code"):
    return payload.get(key) if isinstance(payload, dict) else None


def log_offset():
    return os.path.getsize(LOG) if os.path.exists(LOG) else 0


def logged_code(offset, must_contain):
    if not os.path.exists(LOG):
        return None
    with open(LOG, "r", errors="replace") as f:
        f.seek(offset)
        for line in f.read().splitlines():
            if must_contain in line and "Code=" in line:
                return line.split("Code=")[-1].strip()
    return None


suffix = uuid.uuid4().hex[:8]
email = f"smoke.{suffix}@Mabiz.test"
phone = f"+2547{suffix}1"
username = f"smoke{suffix}"
password = "Stage2Dev!Pass123"
new_password = "Stage2Dev!Pass456"
reg_body = {"name": "Smoke Tester", "username": username, "email": email, "phone": phone,
            "password": password, "county": "Nairobi", "town": "Westlands", "interests": ["Entrepreneurship"]}

print("==== PHASE A: account, tokens, profile, privacy, preferences, devices, OTP ====")

for path, label in [("/health/live", "liveness"), ("/health/ready", "readiness (PostgreSQL checked)"),
                    ("/openapi/v1.json", "OpenAPI document")]:
    st, _, _ = call("GET", BASE + path)
    check(f"GET {path}", st == 200, f"status={st} ({label})")

st, reg, _ = call("POST", API + "/auth/register", reg_body)                                  # auth call 1
user_id = reg.get("id") if isinstance(reg, dict) else None
check("POST /auth/register creates account (201 + profile DTO)",
      st == 201 and bool(user_id) and reg.get("username") == username and reg.get("emailVerified") is False,
      f"status={st} id={'yes' if user_id else 'no'}")

st, dup, _ = call("POST", API + "/auth/register", {**reg_body, "username": "other" + suffix, "phone": f"+2547{suffix}2"})  # 2
check("POST /auth/register duplicate contact rejected (409, specific TAKEN code)",
      st == 409 and code_of(dup) in ("EMAIL_TAKEN", "PHONE_TAKEN", "USERNAME_TAKEN", "ACCOUNT_CONFLICT"), f"status={st} code={code_of(dup)}")

st, login, _ = call("POST", API + "/auth/login", {"identifier": email, "password": password})  # 3
access, refresh = (login or {}).get("accessToken"), (login or {}).get("refreshToken")
check("POST /auth/login with email identifier", st == 200 and bool(access) and bool(refresh), f"status={st}")

st, login_un, _ = call("POST", API + "/auth/login", {"identifier": username, "password": password})  # 4
check("POST /auth/login with username identifier", st == 200 and bool((login_un or {}).get("accessToken")), f"status={st}")

st, badpw, _ = call("POST", API + "/auth/login", {"identifier": email, "password": "WrongPassword!123"})  # 5
check("POST /auth/login wrong password rejected (401 INVALID_CREDENTIALS)",
      st == 401 and code_of(badpw) == "INVALID_CREDENTIALS", f"status={st} code={code_of(badpw)}")

st, me, _ = call("GET", API + "/users/me", token=access)
check("GET /users/me returns own profile including contact fields", st == 200 and me.get("email") == email, f"status={st}")

st, _, _ = call("GET", API + "/users/me")
check("GET /users/me without token rejected (401)", st == 401, f"status={st}")

st, patched, _ = call("PATCH", API + "/users/me", {"bio": "Built on ASP.NET Core + PostgreSQL.", "town": "Kilimani",
                                                   "privateProfile": True, "neighbourhood": "Gallery"}, token=access)
check("PATCH /users/me updates profile fields",
      st == 200 and patched.get("town") == "Kilimani" and patched.get("privateProfile") is True, f"status={st}")

st, owner_view, _ = call("GET", API + f"/users/{user_id}", token=access)
check("GET /users/{id} owner sees own private profile, contact fields omitted",
      st == 200 and owner_view.get("privateProfile") is True and owner_view.get("email") is None, f"status={st}")

st, _, _ = call("GET", API + f"/users/{user_id}")
check("GET /users/{id} private profile concealed from other viewers (404)", st == 404, f"status={st}")

st, contact_edit, _ = call("PATCH", API + "/users/me", {"email": "changed@Mabiz.test"}, token=access)
check("PATCH /users/me email change blocked pending verified-contact flow (422)",
      st == 422 and code_of(contact_edit) == "CONTACT_VERIFICATION_REQUIRED", f"status={st} code={code_of(contact_edit)}")

st, _, _ = call("GET", API + "/users/00000000-0000-0000-0000-000000000000")
check("GET /users/{unknown id} returns 404", st == 404, f"status={st}")

st, prefs, _ = call("GET", API + "/users/me/preferences", token=access)
check("GET /users/me/preferences returns seeded defaults", st == 200 and "theme" in (prefs or {}),
      f"status={st} theme={prefs.get('theme') if isinstance(prefs, dict) else '-'}")

st, prefs2, _ = call("PATCH", API + "/users/me/preferences",
                     {"theme": "dark", "locale": "sw-KE", "autoplayVideos": False, "timeZone": "Africa/Nairobi"}, token=access)
check("PATCH /users/me/preferences persists changes", st == 200 and prefs2.get("theme") == "dark" and prefs2.get("locale") == "sw-KE", f"status={st}")

st, bad_theme, _ = call("PATCH", API + "/users/me/preferences", {"theme": "neon"}, token=access)
check("PATCH /users/me/preferences invalid theme rejected (400)", st == 400, f"status={st} code={code_of(bad_theme)}")

device_ext_id = uuid.uuid4().hex
st, dev, _ = call("POST", API + "/users/me/devices", {"deviceIdentifier": device_ext_id, "platform": "android", "deviceName": "Smoke Pixel"}, token=access)
device_row_id = (dev or {}).get("id")
check("POST /users/me/devices registers device", st in (200, 201) and bool(device_row_id) and dev.get("platform") == "android", f"status={st}")

st, again, _ = call("POST", API + "/users/me/devices", {"deviceIdentifier": device_ext_id, "platform": "android", "deviceName": "Smoke Pixel 2"}, token=access)
check("POST /users/me/devices upserts on the per-user unique identifier",
      again.get("id") == device_row_id and again.get("deviceName") == "Smoke Pixel 2",
      f"status={st} same_row={again.get('id') == device_row_id if isinstance(again, dict) else '-'}")

st, dev_list, _ = call("GET", API + "/users/me/devices", token=access)
check("GET /users/me/devices lists the device once",
      st == 200 and isinstance(dev_list, list) and sum(1 for d in dev_list if d.get("id") == device_row_id) == 1,
      f"status={st} count={len(dev_list) if isinstance(dev_list, list) else '-'}")

st, bad_platform, _ = call("POST", API + "/users/me/devices", {"deviceIdentifier": uuid.uuid4().hex, "platform": "symbian"}, token=access)
check("POST /users/me/devices invalid platform rejected (400)", st == 400, f"status={st}")

st, rot, _ = call("POST", API + "/auth/refresh", {"refreshToken": refresh})                     # 6
new_access, new_refresh = (rot or {}).get("accessToken"), (rot or {}).get("refreshToken")
check("POST /auth/refresh rotates both tokens", st == 200 and bool(new_access) and bool(new_refresh) and new_refresh != refresh, f"status={st}")

st, reuse, _ = call("POST", API + "/auth/refresh", {"refreshToken": refresh})                    # 7
check("POST /auth/refresh reused token rejected (401 REFRESH_TOKEN_REUSE)", st == 401 and code_of(reuse) == "REFRESH_TOKEN_REUSE", f"status={st} code={code_of(reuse)}")

st, _, _ = call("GET", API + "/users/me", token=new_access)
check("reuse detection revokes the session (rotated access token now 401)", st == 401, f"status={st}")

st, login2, _ = call("POST", API + "/auth/login", {"identifier": email, "password": password})   # 8
access2 = (login2 or {}).get("accessToken")
check("POST /auth/login works after reuse detection", st == 200 and bool(access2), f"status={st}")

offset = log_offset()
st, chal, _ = call("POST", API + "/auth/verification-codes", {"identifier": email, "purpose": "registration"})  # 9
challenge_id = (chal or {}).get("challengeId")
logged = logged_code(offset, "Channel=email")
check("POST /auth/verification-codes issues email challenge (202, Development logs the code)",
      st == 202 and bool(challenge_id) and bool(logged), f"status={st} code_logged={'yes' if logged else 'no'}")

st, wrong, _ = call("POST", API + "/auth/verification-codes/verify", {"challengeId": challenge_id, "code": "000000"})  # 10
check("verify rejects a wrong code (422 INVALID_CODE, attempts bounded)", st == 422 and code_of(wrong) == "INVALID_CODE", f"status={st} code={code_of(wrong)}")

st, ver, _ = call("POST", API + "/auth/verification-codes/verify", {"challengeId": challenge_id, "code": logged})      # 11
check("verify accepts the correct code", st == 200 and ver.get("verified") is True, f"status={st}")

st, replay, _ = call("POST", API + "/auth/verification-codes/verify", {"challengeId": challenge_id, "code": logged})   # 12
check("consumed challenge cannot be replayed (422 CHALLENGE_EXPIRED)", st == 422 and code_of(replay) == "CHALLENGE_EXPIRED", f"status={st} code={code_of(replay)}")

st, me_verified, _ = call("GET", API + "/users/me", token=access2)
check("GET /users/me reflects verified email", st == 200 and me_verified.get("emailVerified") is True,
      f"status={st} emailVerified={me_verified.get('emailVerified') if isinstance(me_verified, dict) else '-'}")

print(f"\n==== waiting {WINDOW}s for the 1-minute auth rate-limit window ====")
time.sleep(WINDOW)

print("==== PHASE B: password policy, reset flow, logout, device removal ====")

st, weak, _ = call("POST", API + "/auth/register", {**reg_body, "username": "weak" + suffix,
                                                    "email": f"weak.{suffix}@Mabiz.test", "phone": None, "password": "123"})  # 1
check("POST /auth/register password below policy rejected (400)", st == 400, f"status={st} code={code_of(weak)}")

offset_unknown = log_offset()
st, unknown, _ = call("POST", API + "/auth/password-resets", {"identifier": f"nobody.{suffix}@Mabiz.test"})  # 2
check("password reset for an unknown identifier is accepted without confirming the account exists",
      st == 202 and (unknown or {}).get("accepted") is True and logged_code(offset_unknown, "nobody." + suffix) is None,
      f"status={st} body={unknown}")

offset = log_offset()
st, acc, _ = call("POST", API + "/auth/password-resets", {"identifier": email})                   # 3
reset_token = logged_code(offset, "Purpose=password-reset")
check("POST /auth/password-resets returns 202 accepted for an existing account", st == 202 and (acc or {}).get("accepted") is True, f"status={st} body={acc}")
check("password-reset token is delivered through Development logging only", bool(reset_token), f"token_captured={'yes' if reset_token else 'no'}")

st, short_pw, _ = call("POST", API + "/auth/password-resets/complete", {"resetToken": reset_token, "newPassword": "short"})  # 4
check("reset rejects a weak new password (400)", st == 400, f"status={st} code={code_of(short_pw)}")

st, done, _ = call("POST", API + "/auth/password-resets/complete", {"resetToken": reset_token, "newPassword": new_password})  # 5
check("reset completes with 204 No Content", st == 204, f"status={st}")

st, _, _ = call("GET", API + "/users/me", token=access2)
check("password reset revoked the pre-existing session", st == 401, f"status={st}")

st, replay_reset, _ = call("POST", API + "/auth/password-resets/complete", {"resetToken": reset_token, "newPassword": "AnotherPass!123"})  # 6
check("consumed reset token cannot be replayed (422 INVALID_RESET_TOKEN)",
      st == 422 and code_of(replay_reset) == "INVALID_RESET_TOKEN", f"status={st} code={code_of(replay_reset)}")

st, old_login, _ = call("POST", API + "/auth/login", {"identifier": email, "password": password})  # 7
check("old password no longer authenticates", st == 401, f"status={st}")

st, login3, _ = call("POST", API + "/auth/login", {"identifier": email, "password": new_password})  # 8
access3, refresh3 = (login3 or {}).get("accessToken"), (login3 or {}).get("refreshToken")
check("new password authenticates after reset", st == 200 and bool(access3), f"status={st}")

st, _, _ = call("POST", API + "/auth/logout", {"refreshToken": refresh3}, token=access3)           # 9
check("POST /auth/logout revokes the session", st in (200, 204), f"status={st}")

st, _, _ = call("POST", API + "/auth/refresh", {"refreshToken": refresh3})                         # 10
check("refresh after logout rejected", st == 401, f"status={st}")

st, _, _ = call("GET", API + "/users/me", token=access3)
check("access token after logout rejected (401)", st == 401, f"status={st}")

st, login4, _ = call("POST", API + "/auth/login", {"identifier": email, "password": new_password})  # 11
access4 = (login4 or {}).get("accessToken")

st, gone, _ = call("DELETE", API + f"/users/me/devices/{device_row_id}", token=access4)
check("DELETE /users/me/devices/{id} removes the device (204)", st == 204, f"status={st}")

st, after_del, _ = call("GET", API + "/users/me/devices", token=access4)
check("deleted device no longer listed", st == 200 and all(d.get("id") != device_row_id for d in (after_del or [])), f"status={st}")

st, missing, _ = call("DELETE", API + f"/users/me/devices/{device_row_id}", token=access4)
check("repeat DELETE is an idempotent revocation (204 again)", st == 204, f"status={st}")

st, ghost, _ = call("DELETE", API + "/users/me/devices/00000000-0000-0000-0000-000000000001", token=access4)
check("DELETE unknown device rejected (404 DEVICE_NOT_FOUND)", st == 404 and code_of(ghost) == "DEVICE_NOT_FOUND", f"status={st} code={code_of(ghost)}")

st, revived, _ = call("POST", API + "/users/me/devices", {"deviceIdentifier": device_ext_id, "platform": "ios", "deviceName": "Smoke iPhone"}, token=access4)
check("re-registering a revoked identifier reuses the same row", st in (200, 201) and (revived or {}).get("id") == device_row_id, f"status={st}")

st, after_revive, _ = call("GET", API + "/users/me/devices", token=access4)
check("re-registered device is listed again", st == 200 and any(d.get("id") == device_row_id for d in (after_revive or [])), f"status={st}")

print(f"\n==== waiting {WINDOW}s for a clean window before the rate-limit burst ====")
time.sleep(WINDOW)

print("==== PHASE C: cross-account isolation and auth rate limiting (12/minute/IP) ====")
email2 = f"smoke2.{suffix}@Mabiz.test"
st, reg2, _ = call("POST", API + "/auth/register", {**reg_body, "username": "smoketwo" + suffix,
                                                    "email": email2, "phone": f"+2547{suffix}9"})          # 1
st, login5, _ = call("POST", API + "/auth/login", {"identifier": email2, "password": password})            # 2
access5 = (login5 or {}).get("accessToken")
st, cross, _ = call("DELETE", API + f"/users/me/devices/{device_row_id}", token=access5)
check("another authenticated user cannot revoke this account's device (404 DEVICE_NOT_FOUND)",
      st == 404 and code_of(cross) == "DEVICE_NOT_FOUND", f"status={st} code={code_of(cross)}")

st, cross_prefs, _ = call("GET", API + "/users/me/preferences", token=access5)
check("another user's preferences are separate", st == 200 and cross_prefs.get("locale") != "sw-KE", f"status={st} locale={cross_prefs.get('locale') if isinstance(cross_prefs, dict) else '-'}")

statuses = [call("POST", API + "/auth/login", {"identifier": email, "password": new_password})[0] for _ in range(16)]
burst_429 = sum(1 for s in statuses if s == 429)
check("auth endpoints enforce the rate limiter (429 after 12 in one window)", 429 in statuses,
      f"permitted={len(statuses)-burst_429} rejected={burst_429}")

non_auth = call("GET", API + "/users/me", token=access4)[0]
check("rate limiter does not throttle non-auth endpoints as part of the burst", non_auth in (200, 401), f"status={non_auth}")

print("\n==== SUMMARY ====")
total = len(results)
print(f"checks={total} passed={total-len(errors)} failed={len(errors)}")
for name in errors:
    print("FAILED:", name)
sys.exit(1 if errors else 0)
