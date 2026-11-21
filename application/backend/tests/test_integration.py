from datetime import datetime, timedelta, timezone


def test_full_stack_user_workflow_integration(client):
    """
    Execute an end-to-end simulation of the 8 primary user workflows
    exercised by the React frontend against the FastAPI backend.
    """
    # -------------------------------------------------------------
    # 1. User Registration
    # -------------------------------------------------------------
    reg_payload = {
        "email": "devops.lead@launchpad.io",
        "full_name": "DevOps Lead",
        "password": "SecurePassword2026!",
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    user_data = reg_resp.json()["data"]
    assert user_data["email"] == "devops.lead@launchpad.io"
    user_id = user_data["id"]

    # -------------------------------------------------------------
    # 2. User Login & Token Receipt
    # -------------------------------------------------------------
    login_payload = {
        "email": "devops.lead@launchpad.io",
        "password": "SecurePassword2026!",
    }
    login_resp = client.post("/api/v1/auth/login", json=login_payload)
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    access_token = token_data["access_token"]
    refresh_token = token_data["refresh_token"]
    assert access_token is not None
    assert refresh_token is not None

    auth_headers = {"Authorization": f"Bearer {access_token}"}

    # -------------------------------------------------------------
    # 3. Dashboard Loading (Empty State)
    # -------------------------------------------------------------
    dash_resp = client.get("/api/v1/dashboard/stats", headers=auth_headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()["data"]
    assert dash_data["stats"]["total_tasks"] == 0

    # -------------------------------------------------------------
    # 4. Task Creation
    # -------------------------------------------------------------
    due_date = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    task_payload = {
        "title": "Deploy Argo CD GitOps Application",
        "description": "Create application.yaml pointing to the launchpad Helm chart",
        "status": "todo",
        "priority": "critical",
        "due_date": due_date,
    }
    create_resp = client.post("/api/v1/tasks", json=task_payload, headers=auth_headers)
    assert create_resp.status_code == 201
    created_task = create_resp.json()["data"]
    task_id = created_task["id"]
    assert created_task["title"] == task_payload["title"]
    assert created_task["priority"] == "critical"
    assert created_task["user_id"] == user_id

    # -------------------------------------------------------------
    # 5. Task Listing with Search & Filters
    # -------------------------------------------------------------
    list_resp = client.get(
        "/api/v1/tasks?search=Argo&status=todo&priority=critical",
        headers=auth_headers,
    )
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert list_data["meta"]["total_records"] == 1
    assert list_data["data"][0]["id"] == task_id

    # -------------------------------------------------------------
    # 6. Task Status Transition (todo -> in_progress)
    # -------------------------------------------------------------
    patch_resp = client.patch(
        f"/api/v1/tasks/{task_id}/status",
        json={"status": "in_progress"},
        headers=auth_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["status"] == "in_progress"

    # Verify dashboard reflects the update
    dash_updated = client.get("/api/v1/dashboard/stats", headers=auth_headers).json()["data"]
    assert dash_updated["stats"]["total_tasks"] == 1
    assert dash_updated["stats"]["in_progress_tasks"] == 1

    # -------------------------------------------------------------
    # 7. Task Update & Deletion
    # -------------------------------------------------------------
    # Update title
    update_resp = client.put(
        f"/api/v1/tasks/{task_id}",
        json={"title": "Deploy Argo CD v2.10 GitOps Application"},
        headers=auth_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["data"]["title"] == "Deploy Argo CD v2.10 GitOps Application"

    # Delete task
    del_resp = client.delete(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert del_resp.status_code == 200

    # Ensure deleted
    verify_del = client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert verify_del.status_code == 404

    # -------------------------------------------------------------
    # 8. Token Refresh & Logout
    # -------------------------------------------------------------
    # Refresh access token
    refresh_resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_resp.status_code == 200
    new_access_token = refresh_resp.json()["access_token"]
    assert new_access_token is not None

    # Revoke session via logout
    logout_resp = client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh_token},
    )
    assert logout_resp.status_code == 200

    # Ensure refresh token can no longer be used
    revoked_check = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert revoked_check.status_code == 401
