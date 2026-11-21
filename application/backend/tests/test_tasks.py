from datetime import datetime, timedelta, timezone


def test_create_task_success(client, user_auth_headers):
    """Verify task creation with priority and due date."""
    due = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    payload = {
        "title": "Configure Prometheus metrics scrape",
        "description": "Add backend deployment endpoint to prometheus.yml",
        "status": "todo",
        "priority": "high",
        "due_date": due,
    }
    response = client.post("/api/v1/tasks", json=payload, headers=user_auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["title"] == payload["title"]
    assert data["data"]["priority"] == "high"
    assert data["data"]["status"] == "todo"
    assert "id" in data["data"]


def test_get_task_details(client, user_auth_headers):
    """Verify retrieving a created task by ID."""
    create_resp = client.post(
        "/api/v1/tasks",
        json={"title": "Test task details"},
        headers=user_auth_headers,
    )
    task_id = create_resp.json()["data"]["id"]

    get_resp = client.get(f"/api/v1/tasks/{task_id}", headers=user_auth_headers)
    assert get_resp.status_code == 200
    data = get_resp.json()["data"]
    assert data["id"] == task_id
    assert data["title"] == "Test task details"


def test_list_tasks_pagination_and_filter(client, user_auth_headers):
    """Verify listing tasks with pagination and status filtering."""
    # Seed tasks
    for i in range(5):
        client.post(
            "/api/v1/tasks",
            json={"title": f"Task Todo {i}", "status": "todo", "priority": "medium"},
            headers=user_auth_headers,
        )
    for i in range(3):
        client.post(
            "/api/v1/tasks",
            json={"title": f"Task Completed {i}", "status": "completed", "priority": "low"},
            headers=user_auth_headers,
        )

    # Filter by status=completed
    response = client.get(
        "/api/v1/tasks?status=completed&page=1&page_size=10",
        headers=user_auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["meta"]["total_records"] == 3
    for t in data["data"]:
        assert t["status"] == "completed"

    # Search keyword
    search_resp = client.get(
        "/api/v1/tasks?search=Todo%202",
        headers=user_auth_headers,
    )
    assert search_resp.status_code == 200
    search_data = search_resp.json()
    assert search_data["meta"]["total_records"] == 1
    assert search_data["data"][0]["title"] == "Task Todo 2"


def test_update_task_fields(client, user_auth_headers):
    """Verify updating task title and description."""
    create_resp = client.post(
        "/api/v1/tasks",
        json={"title": "Original Title"},
        headers=user_auth_headers,
    )
    task_id = create_resp.json()["data"]["id"]

    update_resp = client.put(
        f"/api/v1/tasks/{task_id}",
        json={"title": "Updated Title", "description": "Updated Description"},
        headers=user_auth_headers,
    )
    assert update_resp.status_code == 200
    data = update_resp.json()["data"]
    assert data["title"] == "Updated Title"
    assert data["description"] == "Updated Description"


def test_patch_task_status_and_priority(client, user_auth_headers):
    """Verify individual PATCH endpoints for status and priority."""
    create_resp = client.post(
        "/api/v1/tasks",
        json={"title": "Patch Target"},
        headers=user_auth_headers,
    )
    task_id = create_resp.json()["data"]["id"]

    # Patch status
    status_resp = client.patch(
        f"/api/v1/tasks/{task_id}/status",
        json={"status": "in_progress"},
        headers=user_auth_headers,
    )
    assert status_resp.status_code == 200
    assert status_resp.json()["data"]["status"] == "in_progress"

    # Patch priority
    priority_resp = client.patch(
        f"/api/v1/tasks/{task_id}/priority",
        json={"priority": "critical"},
        headers=user_auth_headers,
    )
    assert priority_resp.status_code == 200
    assert priority_resp.json()["data"]["priority"] == "critical"


def test_delete_task(client, user_auth_headers):
    """Verify task deletion."""
    create_resp = client.post(
        "/api/v1/tasks",
        json={"title": "Task to delete"},
        headers=user_auth_headers,
    )
    task_id = create_resp.json()["data"]["id"]

    delete_resp = client.delete(f"/api/v1/tasks/{task_id}", headers=user_auth_headers)
    assert delete_resp.status_code == 200

    # Ensure it no longer exists
    get_resp = client.get(f"/api/v1/tasks/{task_id}", headers=user_auth_headers)
    assert get_resp.status_code == 404


def test_tenant_isolation_and_ownership(client, user_auth_headers, other_auth_headers):
    """Verify a user cannot view, edit, or delete another user's task."""
    create_resp = client.post(
        "/api/v1/tasks",
        json={"title": "User1 Private Task"},
        headers=user_auth_headers,
    )
    task_id = create_resp.json()["data"]["id"]

    # Other user attempts to get task
    other_get = client.get(f"/api/v1/tasks/{task_id}", headers=other_auth_headers)
    assert other_get.status_code == 403

    # Other user attempts to edit task
    other_edit = client.put(
        f"/api/v1/tasks/{task_id}",
        json={"title": "Hacked Title"},
        headers=other_auth_headers,
    )
    assert other_edit.status_code == 403

    # Other user attempts to delete task
    other_del = client.delete(f"/api/v1/tasks/{task_id}", headers=other_auth_headers)
    assert other_del.status_code == 403
