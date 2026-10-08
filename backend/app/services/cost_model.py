from typing import List, Dict

TOLL_RATES: Dict[str, float] = {
    "Kaniyur": 110.0,
    "Vijayamangalam": 145.0,
    "Vaiguntham": 130.0,
    "Omalur": 115.0,
    "Krishnagiri": 95.0,
    "Pallikonda": 110.0,
    "Chennasamudram": 85.0,
    "Nemili": 90.0,
    "Kodai Road Toll": 120.0
}

VEHICLE_PROFILES = {
    "open_truck": {
        "fuel_rate_per_km": 14.5,
        "wear_per_km": 2.5,
        "driver_hourly": 160.0
    },
    "closed_truck": {
        "fuel_rate_per_km": 19.5,
        "wear_per_km": 3.8,
        "driver_hourly": 200.0
    },
    "reefer_truck": {
        "fuel_rate_per_km": 28.0,
        "wear_per_km": 5.2,
        "driver_hourly": 280.0
    }
}

def calculate_toll_cost(toll_names: List[str]) -> float:
    return sum(TOLL_RATES.get(name, 100.0) for name in toll_names)

def calculate_transport_cost(
    distance_km: float,
    travel_time_hours: float,
    vehicle_type: str,
    toll_names: List[str],
    fuel_price_override: float = None
) -> Dict[str, float]:
    profile = VEHICLE_PROFILES.get(vehicle_type, VEHICLE_PROFILES["open_truck"])
    fuel_rate = profile["fuel_rate_per_km"]
    if fuel_price_override:
        # scale fuel rate based on standard reference price 94.5 INR
        fuel_rate = fuel_rate * (fuel_price_override / 94.5)
    
    fuel_cost = distance_km * fuel_rate
    wear_cost = distance_km * profile["wear_per_km"]
    driver_cost = travel_time_hours * profile["driver_hourly"]
    toll_cost = calculate_toll_cost(toll_names)

    total_cost = fuel_cost + wear_cost + driver_cost + toll_cost

    return {
        "fuel_cost": round(fuel_cost, 2),
        "wear_cost": round(wear_cost, 2),
        "driver_cost": round(driver_cost, 2),
        "toll_cost": round(toll_cost, 2),
        "total_transport_cost": round(total_cost, 2)
    }
