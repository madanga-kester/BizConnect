#!/usr/bin/env python3
"""Stage 5 API smoke check.

Run it against a disposable database: the create/publish/upload flow writes rows, so the connection
string of the API process under test should name bizconnect_test (never bizconnect_dev). Start the API
with Database__ApplyMigrationsOnStartup=false and Storage__Provider=local, then:

    python3 scripts/stage5_smoke.py
    BIZCONNECT_API_BASE=http://127.0.0.1:5000 python3 scripts/stage5_smoke.py

It asserts on status codes and response bodies and exits non-zero on the first mismatching check,
printing a PASS/FAIL line per check.
"""
import base64, json, os, sys, uuid
import requests

BASE = os.environ.get("BIZCONNECT_API_BASE", "http://127.0.0.1:5199")
PNG = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==")
results = []


def check(label, expected, actual, extra=""):
    ok = expected == actual
    results.append((label, expected, actual, ok, extra))
    print(f"{'PASS' if ok else 'FAIL'} | {label}: expected={expected} actual={actual} {extra}")
    return ok


def upload(s, business_id, seed):
    files = {"file": (f"img-{seed}.png", PNG + f"#{seed}".encode(), "application/octet-stream")}
    return s.post(f"{BASE}/api/v1/businesses/{business_id}/media", files=files)


tag = uuid.uuid4().hex[:8]
plain = requests.Session()

# 1. health
check("GET /health/live", 200, plain.get(f"{BASE}/health/live").status_code)
ready = plain.get(f"{BASE}/health/ready")
check("GET /health/ready", 200, ready.status_code, ready.text[:120].replace("\n", " "))

# 2. OpenAPI documents Stage 5 routes
doc = plain.get(f"{BASE}/openapi/v1.json")
paths = doc.json().get("paths", {}) if doc.status_code == 200 else {}
for p in ["/api/v1/businesses/{businessId}/products", "/api/v1/businesses/{businessId}/services/{serviceId}/status",
          "/api/v1/businesses/{businessId}/products/{productId}/media", "/api/v1/businesses/{businessId}/media",
          "/api/v1/catalogue/products", "/api/v1/catalogue/services/{slugOrId}", "/api/v1/media/{mediaId}/content"]:
    check(f"openapi has {p}", True, p in paths)
print(f"   total documented paths: {len(paths)}")

# 3. anonymous public discovery works
for route in ["/api/v1/catalogue/products", "/api/v1/catalogue/services"]:
    r = plain.get(f"{BASE}{route}")
    check(f"GET {route} anonymous", 200, r.status_code, f"total={r.json().get('total')}")

# 4. protected catalogue/media management routes reject anonymous callers
r = plain.get(f"{BASE}/api/v1/businesses/{uuid.uuid4()}/products")
check("GET business products anonymous", 401, r.status_code, r.headers.get("content-type", ""))
body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
check("anonymous 401 problem code", "UNAUTHORIZED", body.get("code", body.get("title", "")))
check("DELETE media anonymous", 401, plain.delete(f"{BASE}/api/v1/media/{uuid.uuid4()}").status_code)
check("GET media metadata anonymous", 401, plain.get(f"{BASE}/api/v1/media/{uuid.uuid4()}").status_code)
check("GET draft media content anonymous", 404, plain.get(f"{BASE}/api/v1/media/{uuid.uuid4()}/content").status_code)

# 5. authenticated flow
s = requests.Session()
username = f"smoke{tag}"[:28]
reg = s.post(f"{BASE}/api/v1/auth/register", json={
    "name": username, "username": username, "email": f"{username}@example.test", "phone": None,
    "password": "P@ssword12345", "county": "Nairobi", "town": "Nairobi", "interests": ["Retail"], "avatar": None})
check("POST /auth/register", 201, reg.status_code)
tok = s.post(f"{BASE}/api/v1/auth/login", json={"identifier": f"{username}@example.test", "password": "P@ssword12345"})
check("POST /auth/login", 200, tok.status_code)
s.headers["Authorization"] = f"Bearer {tok.json()['accessToken']}"

biz = s.post(f"{BASE}/api/v1/businesses", json={
    "name": f"Smoke Works {tag}", "businessType": "hybrid", "category": "Retail", "subcategory": "General",
    "description": "Smoke test business", "about": "about", "founder": "Founder", "originStory": "story",
    "county": "Nairobi", "town": "Nairobi", "neighbourhood": "Westlands", "serviceAreas": ["Westlands"],
    "phone": "0712345678", "whatsapp": "0712345678", "email": None, "website": None, "priceRange": "KSh KSh",
    "operatingHours": "Mon-Fri", "logo": None, "cover": None, "visibility": "public", "socialLinks": {}})
check("POST /businesses", 201, biz.status_code)
business_id = biz.json()["id"]

# 6. uploads
assets = []
for seed in (1, 2, 3):
    r = upload(s, business_id, seed)
    check(f"POST media upload #{seed}", 201, r.status_code)
    if r.status_code == 201:
        assets.append(r.json())
if len(assets) == 3:
    a = assets[0]
    check("upload content type from signature", "image/png", a["contentType"])
    check("upload width parsed", 1, a["widthPx"])
    check("upload provider", "local", a["provider"])
    check("access url is api proxy", True, a["accessUrl"].startswith("/api/v1/media/"))
    check("no storage key leaked", True, "storageKey" not in json.dumps(a))

# 7. create product with ordered gallery
item = s.post(f"{BASE}/api/v1/businesses/{business_id}/products", json={
    "title": f"Smoke Basket {tag}", "description": "Handwoven basket", "category": "Homeware",
    "subcategory": "Baskets", "priceKsh": 1500, "sku": f"SMK-{tag}", "stockQuantity": 4, "inStock": True,
    "mediaAssetIds": [x["id"] for x in assets]})
check("POST products with gallery", 201, item.status_code)
if item.status_code != 201:
    print("   body:", item.text[:500])
else:
    created = item.json()
    check("gallery order on create", [0, 1, 2], [m["sortOrder"] for m in created["media"]])
    item_id = created["id"]

    # 8. reorder (the previously failing case)
    reorder = s.put(f"{BASE}/api/v1/businesses/{business_id}/products/{item_id}/media", json={
        "mediaAssetIds": [assets[2]["id"], assets[0]["id"]], "altTexts": ["front", "detail"]})
    print(f"   reorder status={reorder.status_code} body={reorder.text[:400]}")
    check("PUT gallery reorder", 200, reorder.status_code)
    if reorder.status_code == 200:
        media = reorder.json()["media"]
        check("reordered ids", [assets[2]["id"], assets[0]["id"]], [m["mediaAssetId"] for m in media])
        check("reordered alt text", "front", media[0]["altText"])

    # 9. publish then anonymous public read of the image
    pub = s.post(f"{BASE}/api/v1/businesses/{business_id}/products/{item_id}/status", json={"status": "published"})
    check("POST publish", 200, pub.status_code)
    disc = plain.get(f"{BASE}/api/v1/catalogue/products?search={tag}")
    check("anonymous discovery finds published item", 1, disc.json()["total"])
    detail = plain.get(f"{BASE}/api/v1/catalogue/products/{disc.json()['items'][0]['slug']}")
    check("anonymous public detail", 200, detail.status_code)
    img = plain.get(f"{BASE}{assets[2]['accessUrl']}")
    check("anonymous image through proxy", 200, img.status_code, f"ct={img.headers.get('content-type')} etag={img.headers.get('etag')}")

    # 10. deletion guard
    guard = s.delete(f"{BASE}/api/v1/media/{assets[2]['id']}")
    check("DELETE attached media blocked", 409, guard.status_code, guard.text[:160].replace("\n", " "))
    detached = s.put(f"{BASE}/api/v1/businesses/{business_id}/products/{item_id}/media", json={"mediaAssetIds": []})
    check("PUT empty gallery detaches", 200, detached.status_code)
    deleted = s.delete(f"{BASE}/api/v1/media/{assets[2]['id']}")
    check("DELETE detached media", 204, deleted.status_code)

# 11. duplicate SKU
dup = s.post(f"{BASE}/api/v1/businesses/{business_id}/products", json={
    "title": "Duplicate SKU item", "description": "same sku", "category": "Homeware", "priceKsh": 100, "sku": f"SMK-{tag}"})
check("POST duplicate sku", 409, dup.status_code, dup.text[:120].replace("\n", " "))

# 12. validation
bad = s.post(f"{BASE}/api/v1/businesses/{business_id}/products", json={
    "title": "Bad product", "description": "service field on product", "category": "Homeware", "priceKsh": 10, "durationMinutes": 30})
check("POST product with service field", 422, bad.status_code)
text_upload = requests.Session()
text_upload.headers["Authorization"] = s.headers["Authorization"]
notimage = text_upload.post(f"{BASE}/api/v1/businesses/{business_id}/media",
                            files={"file": ("fake.png", b"this is not an image", "image/png")})
check("POST non-image upload", 422, notimage.status_code, notimage.text[:120].replace("\n", " "))

print("\n=== note ===")
print("Verify the API process under test points at a disposable database before trusting the writes above.")
failed = [r for r in results if not r[3]]
print(f"checks={len(results)} passed={len(results) - len(failed)} failed={len(failed)}")
sys.exit(1 if failed else 0)
