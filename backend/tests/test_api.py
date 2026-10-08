import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_invalid_negative_quantity():
    payload = {
        "crop_id": "tomato",
        "quantity_kg": -500,
        "origin": {"name": "Pollachi Farm", "lat": 10.65, "lng": 77.01},
        "destination": {"name": "Coimbatore Market", "lat": 10.99, "lng": 76.96},
        "vehicle_type": "open_truck"
    }
    response = client.post("/api/shipments/optimize", json=payload)
    assert response.status_code == 422 # Pydantic validation error

def test_exceeding_vehicle_capacity():
    # open_truck capacity is 3500 kg, trying to ship 8000 kg
    payload = {
        "crop_id": "tomato",
        "quantity_kg": 8000,
        "origin": {"name": "Pollachi Farm", "lat": 10.65, "lng": 77.01},
        "destination": {"name": "Coimbatore Market", "lat": 10.99, "lng": 76.96},
        "vehicle_type": "open_truck"
    }
    response = client.post("/api/shipments/optimize", json=payload)
    assert response.status_code == 400
    assert "exceeds maximum payload capacity" in response.json()["detail"]

def test_missing_origin():
    payload = {
        "crop_id": "tomato",
        "quantity_kg": 2000,
        "destination": {"name": "Coimbatore Market", "lat": 10.99, "lng": 76.96},
        "vehicle_type": "open_truck"
    }
    response = client.post("/api/shipments/optimize", json=payload)
    assert response.status_code == 422 # Missing required field
