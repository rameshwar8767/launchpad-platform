def test_root_endpoint(client):
    """Test the root endpoint returns API metadata and documentation links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "version" in data
    assert data["documentation"]["swagger_ui"] == "/docs"


def test_liveness_probe(client):
    """Test the Kubernetes liveness probe endpoint."""
    response = client.get("/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "alive"


def test_readiness_probe(client):
    """Test the Kubernetes readiness probe verifying database connectivity."""
    response = client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"


def test_metrics_endpoint(client):
    """Test Prometheus metrics endpoint is exposed and functioning."""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "http_requests_total" in response.text or "process_cpu_seconds_total" in response.text or "http" in response.text
