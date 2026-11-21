def test_user_registration_success(client):
    """Verify standard user registration with valid payload."""
    payload = {
        "email": "newuser@example.com",
        "full_name": "New Team Member",
        "password": "SecurePassword123!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "newuser@example.com"
    assert "id" in data["data"]
    assert "hashed_password" not in data["data"]


def test_user_registration_duplicate_email(client, test_user):
    """Verify duplicate email registration is rejected with HTTP 409."""
    payload = {
        "email": test_user.email,
        "full_name": "Duplicate User",
        "password": "SecurePassword123!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "DUPLICATE_RESOURCE"


def test_user_registration_weak_password(client):
    """Verify registration fails if password is shorter than 8 characters."""
    payload = {
        "email": "shortpass@example.com",
        "full_name": "Short Pass",
        "password": "short",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_user_login_success(client, test_user):
    """Verify user login returns access and refresh tokens."""
    payload = {
        "email": "testuser@example.com",
        "password": "ValidPass123!",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == test_user.email


def test_user_login_invalid_password(client, test_user):
    """Verify login with incorrect password returns HTTP 401."""
    payload = {
        "email": test_user.email,
        "password": "WrongPassword!",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_CREDENTIALS"


def test_get_current_user_profile(client, user_auth_headers, test_user):
    """Verify /auth/me returns the authenticated user's profile."""
    response = client.get("/api/v1/auth/me", headers=user_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == test_user.email
    assert data["data"]["full_name"] == test_user.full_name


def test_get_current_user_unauthorized(client):
    """Verify /auth/me without token returns HTTP 401."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False


def test_token_refresh_and_logout_flow(client, test_user):
    """Verify complete login -> refresh access token -> logout -> invalidation cycle."""
    # 1. Login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "ValidPass123!"},
    )
    assert login_resp.status_code == 200
    tokens = login_resp.json()
    refresh_token = tokens["refresh_token"]

    # 2. Refresh
    refresh_resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_resp.status_code == 200
    refreshed = refresh_resp.json()
    assert "access_token" in refreshed

    # 3. Logout
    logout_resp = client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh_token},
    )
    assert logout_resp.status_code == 200

    # 4. Refresh again should fail (token revoked)
    repeat_refresh = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert repeat_refresh.status_code == 401
