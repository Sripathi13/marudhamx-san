import math
from typing import Dict, Any

MONTH_HEAT_FACTORS = {
    1: 0.85, 2: 0.95, 3: 1.10, 4: 1.25,
    5: 1.20, 6: 0.95, 7: 0.90, 8: 0.90,
    9: 0.95, 10: 0.95, 11: 0.90, 12: 0.80
}

VEHICLE_TEMP_FACTORS = {
    "open_truck": 1.0,
    "closed_truck": 0.7,
    "reefer_truck": 0.3
}

def calculate_k(crop_base_rate: float, vehicle_type: str, month: int = 10) -> float:
    temp_factor = VEHICLE_TEMP_FACTORS.get(vehicle_type, 1.0)
    heat_factor = MONTH_HEAT_FACTORS.get(month, 0.95)
    return crop_base_rate * temp_factor * heat_factor

def calculate_spoilage_fraction(k: float, travel_time_hours: float) -> float:
    if travel_time_hours <= 0:
        return 0.0
    # spoilage_fraction(t) = 1 - exp(-k * t)
    fraction = 1.0 - math.exp(-k * travel_time_hours)
    # Bounded between 0 and 1
    return max(0.0, min(1.0, fraction))

def calculate_expected_loss(quantity_kg: float, price_per_kg: float, spoilage_fraction: float) -> float:
    return quantity_kg * price_per_kg * spoilage_fraction
