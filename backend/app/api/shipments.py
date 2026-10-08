from fastapi import APIRouter, HTTPException, Query
import json
import os
import uuid
from typing import List, Dict, Any
from app.schemas.shipment import ShipmentOptimizeRequest, ShipmentOptimizeResponse, VrpOptimizeRequest
from app.services.spoilage import calculate_k, calculate_spoilage_fraction, calculate_expected_loss
from app.services.cost_model import calculate_transport_cost
from app.services.scoring import score_and_rank_routes, generate_tradeoff_explanation
from app.services.vrp import solve_multi_truck_vrp

router = APIRouter()

# Load crops, markets, vehicles data
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
try:
    with open(os.path.join(DATA_DIR, "crops.json")) as f:
        CROPS_DATA = json.load(f)["crops"]
    with open(os.path.join(DATA_DIR, "markets.json")) as f:
        MARKETS_DATA = json.load(f)["markets"]
    with open(os.path.join(DATA_DIR, "vehicles.json")) as f:
        VEHICLES_CONFIG = json.load(f)
        VEHICLES_DATA = VEHICLES_CONFIG["vehicles"]
except Exception:
    CROPS_DATA = []
    MARKETS_DATA = []
    VEHICLES_DATA = []

# Simple in-memory history
SHIPMENT_HISTORY = []

@router.post("/optimize", response_model=ShipmentOptimizeResponse)
async def optimize_shipment(req: ShipmentOptimizeRequest):
    crop = next((c for c in CROPS_DATA if c["id"] == req.crop_id), None)
    if not crop:
        raise HTTPException(status_code=400, detail="Invalid crop selected")
    
    vehicle = next((v for v in VEHICLES_DATA if v["id"] == req.vehicle_type), None)
    if not vehicle:
        raise HTTPException(status_code=400, detail="Invalid vehicle selected")

    if req.quantity_kg > vehicle["capacity_kg"]:
        raise HTTPException(
            status_code=400,
            detail=f"Entered quantity ({req.quantity_kg} kg) exceeds maximum payload capacity for {vehicle['name']} ({vehicle['capacity_kg']} kg). Select a larger truck or enable multi-truck mode."
        )

    price_per_kg = req.price_per_kg_override or crop["default_price_inr_per_kg"]
    k = calculate_k(crop["base_rate"], req.vehicle_type, month=10)

    # Generate 3 distinct candidate routes between origin and destination
    # Route A: Direct Arterial Highway (e.g., NH-83 via Pollachi / Kinathukadavu)
    # Route B: Fast National Highway Bypass (via Palladam / NH-544, higher toll & distance, but smoother flow)
    # Route C: State Rural link (SH-174 / rural link, zero toll, slower surface)
    orig = req.origin
    dest = req.destination

    # Calculate base straight line distance
    import math
    d_lat = math.radians(dest.lat - orig.lat)
    d_lng = math.radians(dest.lng - orig.lng)
    a = math.sin(d_lat/2)**2 + math.cos(math.radians(orig.lat)) * math.cos(math.radians(dest.lat)) * math.sin(d_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    base_km = max(15.0, 6371.0 * c * 1.25)

    candidate_specs = [
        {
            "id": "A",
            "name": "Route A (NH-83 Direct Corridor)",
            "dist_factor": 1.05,
            "speed_kmh": 46.0,
            "tolls": ["Kaniyur"],
            "traffic_level": "moderate",
            "traffic_mult": 1.30,
            "stops": [orig.name, "Kinathukadavu", dest.name],
            "via_offsets": [(0.4, 0.05), (0.7, -0.02)]
        },
        {
            "id": "B",
            "name": "Route B (NH-544 Bypass & Expressway)",
            "dist_factor": 1.22,
            "speed_kmh": 64.0,
            "tolls": ["Kaniyur", "Vijayamangalam"],
            "traffic_level": "low",
            "traffic_mult": 1.05,
            "stops": [orig.name, "Palladam Bypass", "Avinashi Jn", dest.name],
            "via_offsets": [(0.3, 0.15), (0.6, 0.18)]
        },
        {
            "id": "C",
            "name": "Route C (SH-174 Rural Toll-Free Link)",
            "dist_factor": 1.08,
            "speed_kmh": 34.0,
            "tolls": [],
            "traffic_level": "heavy",
            "traffic_mult": 1.55,
            "stops": [orig.name, "Negamam", "Malumichampatti Village", dest.name],
            "via_offsets": [(0.3, -0.12), (0.7, -0.10)]
        }
    ]

    computed_routes = []
    for spec in candidate_specs:
        dist_km = round(base_km * spec["dist_factor"], 1)
        raw_hours = dist_km / spec["speed_kmh"]
        actual_hours = round(raw_hours * spec["traffic_mult"], 2)
        eta_minutes = int(round(actual_hours * 60))

        # Check max acceptable hours constraint if specified
        if req.max_acceptable_hours and actual_hours > req.max_acceptable_hours:
            continue

        transport = calculate_transport_cost(
            distance_km=dist_km,
            travel_time_hours=actual_hours,
            vehicle_type=req.vehicle_type,
            toll_names=spec["tolls"],
            fuel_price_override=req.fuel_price_override
        )

        spoilage_frac = round(calculate_spoilage_fraction(k, actual_hours), 4)
        expected_loss = round(calculate_expected_loss(req.quantity_kg, price_per_kg, spoilage_frac), 2)
        total_economic = round(transport["total_transport_cost"] + expected_loss, 2)

        # Generate realistic geometry coordinates
        geometry = [[orig.lat, orig.lng]]
        for frac, off in spec["via_offsets"]:
            lat_inter = orig.lat + (dest.lat - orig.lat) * frac + off * 0.1
            lng_inter = orig.lng + (dest.lng - orig.lng) * frac + off * 0.1
            geometry.append([round(lat_inter, 6), round(lng_inter, 6)])
        geometry.append([dest.lat, dest.lng])

        computed_routes.append({
            "id": spec["id"],
            "name": spec["name"],
            "geometry": geometry,
            "stops": spec["stops"],
            "distance_km": dist_km,
            "travel_time_hours": actual_hours,
            "eta_minutes": eta_minutes,
            "transport_cost_inr": transport["total_transport_cost"],
            "spoilage_fraction": spoilage_frac,
            "expected_loss_inr": expected_loss,
            "total_economic_cost_inr": total_economic,
            "traffic_level": spec["traffic_level"],
            "data_quality": "estimated_traffic"
        })

    # Score according to D6 formula
    scored_routes = score_and_rank_routes(computed_routes, crop["weights"])
    best_route = scored_routes[0] if scored_routes else None

    explanation = generate_tradeoff_explanation(best_route, scored_routes) if best_route else "No feasible route found within time limit."

    shipment_id = f"shp_{uuid.uuid4().hex[:8]}"

    response_data = {
        "shipment_id": shipment_id,
        "crop": crop,
        "quantity_kg": req.quantity_kg,
        "origin": req.origin,
        "destination": req.destination,
        "vehicle_type": req.vehicle_type,
        "recommended_route_id": best_route["id"] if best_route else "",
        "routes": scored_routes,
        "explanation": explanation,
        "assumptions": {
            "crop_base_rate": crop["base_rate"],
            "vehicle_temp_factor": vehicle["temp_factor"],
            "effective_k": round(k, 5),
            "heat_factor": 0.95,
            "price_per_kg_used": price_per_kg,
            "notice": "All spoilage rates & traffic delays are algorithmic demonstration assumptions."
        }
    }

    # Store in history
    SHIPMENT_HISTORY.append({
        "id": shipment_id,
        "date": "2026-10-08",
        "crop_name": crop["name"],
        "quantity_kg": req.quantity_kg,
        "origin_name": req.origin.name,
        "dest_name": req.destination.name,
        "recommended_route": best_route["name"] if best_route else "",
        "expected_loss_inr": best_route["expected_loss_inr"] if best_route else 0,
        "transport_cost_inr": best_route["transport_cost_inr"] if best_route else 0,
        "actual_loss_inr": None
    })

    return response_data

@router.post("/vrp")
async def optimize_vrp(req: VrpOptimizeRequest):
    farms_data = [f.model_dump() for f in req.farms]
    trucks_data = [t.model_dump() for t in req.trucks]
    market_data = req.market.model_dump()
    result = solve_multi_truck_vrp(farms_data, market_data, trucks_data)
    return result

@router.get("/history")
async def get_history():
    return SHIPMENT_HISTORY
