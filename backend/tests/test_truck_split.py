import math
import pytest

def calculate_truck_split(total_kg: float, truck_capacity_kg: float):
    if total_kg <= 0:
        raise ValueError("Total quantity must be greater than 0 kg.")
    if truck_capacity_kg <= 0:
        raise ValueError("Truck capacity must be greater than 0 kg.")
    
    trucks_needed = math.ceil(total_kg / truck_capacity_kg)
    full_trucks = math.floor(total_kg / truck_capacity_kg)
    last_truck_load = total_kg - (full_trucks * truck_capacity_kg)
    
    return {
        "trucks_needed": trucks_needed,
        "full_trucks": full_trucks,
        "last_truck_load": last_truck_load
    }

def test_10000_kg_with_3000_capacity():
    """10,000 kg with 3,000 kg capacity gives 4 trucks and last load 1,000 kg."""
    res = calculate_truck_split(10000, 3000)
    assert res["trucks_needed"] == 4
    assert res["full_trucks"] == 3
    assert res["last_truck_load"] == 1000

def test_9000_kg_with_3000_capacity():
    """9,000 kg with 3,000 kg gives 3 full trucks and 0 last load."""
    res = calculate_truck_split(9000, 3000)
    assert res["trucks_needed"] == 3
    assert res["full_trucks"] == 3
    assert res["last_truck_load"] == 0

def test_zero_or_negative_inputs_rejected():
    with pytest.raises(ValueError):
        calculate_truck_split(0, 3000)
    with pytest.raises(ValueError):
        calculate_truck_split(-500, 3000)
    with pytest.raises(ValueError):
        calculate_truck_split(5000, 0)
    with pytest.raises(ValueError):
        calculate_truck_split(5000, -1000)
