import pytest

def test_mock_osrm_geometry_passthrough():
    mock_osrm_response = {
        "code": "Ok",
        "routes": [
            {
                "geometry": {
                    "coordinates": [
                        [76.9634, 10.9982],
                        [76.9964, 10.8228],
                        [77.0087, 10.6586]
                    ]
                },
                "distance": 42000.0,
                "duration": 3400.0
            }
        ]
    }

    # Extract coordinates in lat/lng format
    raw_coords = mock_osrm_response["routes"][0]["geometry"]["coordinates"]
    parsed_geometry = [[pt[1], pt[0]] for pt in raw_coords]

    # Verify geometry is intact and not altered
    assert len(parsed_geometry) == 3
    assert parsed_geometry[0] == [10.9982, 76.9634]
    assert parsed_geometry[1] == [10.8228, 76.9964]
    assert parsed_geometry[2] == [10.6586, 77.0087]
