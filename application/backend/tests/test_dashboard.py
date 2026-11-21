from datetime import datetime, timedelta, timezone


def test_dashboard_metrics_aggregation(client, user_auth_headers):
    """Verify dashboard KPI statistics and distribution calculations."""
    now = datetime.now(timezone.utc)

    # 1. Todo task
    client.post(
        "/api/v1/tasks",
        json={"title": "Todo Item", "status": "todo", "priority": "medium"},
        headers=user_auth_headers,
    )
    # 2. In progress task
    client.post(
        "/api/v1/tasks",
        json={"title": "WIP Item", "status": "in_progress", "priority": "high"},
        headers=user_auth_headers,
    )
    # 3. Completed task
    client.post(
        "/api/v1/tasks",
        json={"title": "Done Item", "status": "completed", "priority": "low"},
        headers=user_auth_headers,
    )
    # 4. Overdue task (due yesterday and status != completed)
    yesterday = (now - timedelta(days=1)).isoformat()
    client.post(
        "/api/v1/tasks",
        json={
            "title": "Overdue Item",
            "status": "todo",
            "priority": "critical",
            "due_date": yesterday,
        },
        headers=user_auth_headers,
    )

    response = client.get("/api/v1/dashboard/stats", headers=user_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    stats = data["data"]["stats"]
    assert stats["total_tasks"] == 4
    assert stats["completed_tasks"] == 1
    assert stats["in_progress_tasks"] == 1
    assert stats["todo_tasks"] == 2
    assert stats["overdue_tasks"] == 1

    priorities = data["data"]["priority_distribution"]
    assert priorities["critical"] == 1
    assert priorities["high"] == 1
    assert priorities["medium"] == 1
    assert priorities["low"] == 1

    assert len(data["data"]["recent_tasks"]) <= 5
