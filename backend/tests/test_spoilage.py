import pytest
import math
from app.services.spoilage import calculate_k, calculate_spoilage_fraction, calculate_expected_loss

def test_spoilage_monotonic_increasing():
    """Verify spoilage fraction is strictly monotonic increasing with time."""
    k = calculate_k(crop_base_rate=0.035, vehicle_type="open_truck", month=5)
    hours = [0.5, 1.0, 2.0, 5.0, 10.0, 24.0, 48.0]
    fractions = [calculate_spoilage_fraction(k, t) for t in hours]

    for i in range(len(fractions) - 1):
        assert fractions[i] < fractions[i+1], f"Expected {fractions[i]} < {fractions[i+1]}"

def test_spoilage_bounded_between_zero_and_one():
    """Verify spoilage fraction is bounded strictly in [0.0, 1.0]."""
    k = calculate_k(crop_base_rate=0.08, vehicle_type="open_truck", month=4)
    # At t=0
    assert calculate_spoilage_fraction(k, 0.0) == 0.0
    # At negative time
    assert calculate_spoilage_fraction(k, -5.0) == 0.0
    # At huge time
    assert 0.99 <= calculate_spoilage_fraction(k, 1000.0) <= 1.0

def test_expected_loss_proportionality():
    """Verify expected loss is quantity * price * spoilage_fraction."""
    qty = 5000.0 # 5 tonnes
    price = 30.0 # Rs 30 / kg
    fraction = 0.08 # 8%
    expected = calculate_expected_loss(qty, price, fraction)
    assert pytest.approx(expected, 0.01) == 12000.0

def test_cooling_reduces_spoilage():
    """Verify reefer truck significantly reduces k and spoilage fraction compared to open truck."""
    k_open = calculate_k(crop_base_rate=0.035, vehicle_type="open_truck")
    k_reefer = calculate_k(crop_base_rate=0.035, vehicle_type="reefer_truck")
    assert k_reefer < k_open
    
    t = 6.0 # 6 hours
    spoil_open = calculate_spoilage_fraction(k_open, t)
    spoil_reefer = calculate_spoilage_fraction(k_reefer, t)
    assert spoil_reefer < (spoil_open * 0.4)
