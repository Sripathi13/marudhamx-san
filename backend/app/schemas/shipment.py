from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class LocationPoint(BaseModel):
    name: str
    lat: float
    lng: float

class ShipmentOptimizeRequest(BaseModel):
    crop_id: str
    quantity_kg: float = Field(gt=0, description="Quantity in kilograms")
    origin: LocationPoint
    destination: LocationPoint
    vehicle_type: str = "open_truck"
    departure_time: Optional[str] = None
    max_acceptable_hours: Optional[float] = None
    fuel_price_override: Optional[float] = None
    price_per_kg_override: Optional[float] = None

class RouteSegment(BaseModel):
    id: str
    name: str
    geometry: List[List[float]] # [[lat, lng], ...]
    stops: List[str]
    distance_km: float
    travel_time_hours: float
    eta_minutes: int
    transport_cost_inr: float
    spoilage_fraction: float
    expected_loss_inr: float
    total_economic_cost_inr: float
    score: float
    traffic_level: str
    data_quality: str = "estimated_traffic"
    weights_breakdown: Optional[Dict[str, float]] = None

class ShipmentOptimizeResponse(BaseModel):
    shipment_id: str
    crop: Dict[str, Any]
    quantity_kg: float
    origin: LocationPoint
    destination: LocationPoint
    vehicle_type: str
    recommended_route_id: str
    routes: List[RouteSegment]
    explanation: str
    assumptions: Dict[str, Any]

class VrpFarmRequest(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    quantity_kg: float

class VrpTruckRequest(BaseModel):
    id: str
    name: str
    capacity_kg: float

class VrpOptimizeRequest(BaseModel):
    crop_id: str
    market: LocationPoint
    farms: List[VrpFarmRequest]
    trucks: List[VrpTruckRequest]
