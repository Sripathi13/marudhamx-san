import httpx
from typing import List, Dict, Any, Tuple
import networkx as nx
from app.core.config import settings

# Bounding box & key junction nodes in Coimbatore & Western Tamil Nadu belt
JUNCTION_COORDINATES = {
    "Pollachi": (10.6586, 77.0087),
    "Kinathukadavu": (10.8228, 76.9964),
    "Malumichampatti": (10.9100, 76.9850),
    "Coimbatore_South": (10.9700, 76.9600),
    "Coimbatore_MGR": (10.9982, 76.9634),
    "Palladam": (11.0045, 77.2798),
    "Tiruppur": (11.1085, 77.3411),
    "Avinashi": (11.1934, 77.2687),
    "Perundurai": (11.2750, 77.5830),
    "Erode": (11.3410, 77.7172),
    "Sankari": (11.4820, 77.8680),
    "Salem": (11.6643, 78.1460),
    "Dharapuram": (10.7300, 77.5300),
    "Madurai": (9.9252, 78.1198),
    "Chennai": (13.0694, 80.1948)
}

def get_traffic_multiplier(hour: int, is_urban: bool = False, is_highway: bool = True) -> float:
    """
    Time of day multiplier table:
    1.0 at night (21:00 - 06:00)
    1.6 for peak 8-10 AM and 5-8 PM in urban Coimbatore
    1.3 for towns on NH-544 corridor
    """
    if 21 <= hour or hour < 6:
        return 1.0 # Night: smooth flow
    elif (8 <= hour <= 10) or (17 <= hour <= 20):
        return 1.65 if is_urban else 1.35
    elif 11 <= hour <= 16:
        return 1.25 if is_urban else 1.15
    return 1.10

def build_tamil_nadu_road_graph(hour: int = 8) -> nx.DiGraph:
    """
    Builds a NetworkX directed graph representing the real highway network
    of Tamil Nadu (NH-83, NH-544, SH-174, etc.)
    """
    G = nx.DiGraph()
    for name, coords in JUNCTION_COORDINATES.items():
        G.add_node(name, lat=coords[0], lng=coords[1])

    # Add edges with real physical road distances (km), free-flow hours, and tolls
    edges = [
        # NH-83 Pollachi -> Kinathukadavu -> Coimbatore (Primary route)
        ("Pollachi", "Kinathukadavu", 22.0, 0.40, get_traffic_multiplier(hour, False), 0.0, "NH-83 4-Lane"),
        ("Kinathukadavu", "Pollachi", 22.0, 0.40, get_traffic_multiplier(hour, False), 0.0, "NH-83 4-Lane"),
        ("Kinathukadavu", "Malumichampatti", 14.0, 0.25, get_traffic_multiplier(hour, True), 0.0, "NH-83 Suburban"),
        ("Malumichampatti", "Kinathukadavu", 14.0, 0.25, get_traffic_multiplier(hour, True), 0.0, "NH-83 Suburban"),
        ("Malumichampatti", "Coimbatore_MGR", 12.0, 0.35, get_traffic_multiplier(hour, True), 0.0, "City Arterial"),
        ("Coimbatore_MGR", "Malumichampatti", 12.0, 0.35, get_traffic_multiplier(hour, True), 0.0, "City Arterial"),

        # Bypass via Palladam -> Sulur -> Coimbatore (Bypasses Kinathukadavu congestion)
        ("Pollachi", "Palladam", 42.0, 0.70, get_traffic_multiplier(hour, False), 0.0, "SH-19 State Highway"),
        ("Palladam", "Coimbatore_MGR", 38.0, 0.75, get_traffic_multiplier(hour, True), 0.0, "Trichy Road"),
        ("Palladam", "Tiruppur", 16.0, 0.30, get_traffic_multiplier(hour, True), 0.0, "SH-169"),
        
        # NH-544 Expressway Corridor (Coimbatore -> Avinashi -> Tiruppur -> Erode -> Salem)
        ("Coimbatore_MGR", "Avinashi", 42.0, 0.65, get_traffic_multiplier(hour, False), 110.0, "NH-544 Expressway"),
        ("Avinashi", "Coimbatore_MGR", 42.0, 0.65, get_traffic_multiplier(hour, False), 110.0, "NH-544 Expressway"),
        ("Avinashi", "Tiruppur", 14.0, 0.25, get_traffic_multiplier(hour, True), 0.0, "State Link"),
        ("Avinashi", "Perundurai", 36.0, 0.50, get_traffic_multiplier(hour, False), 145.0, "NH-544 Expressway"),
        ("Perundurai", "Erode", 18.0, 0.35, get_traffic_multiplier(hour, True), 0.0, "SH-96"),
        ("Perundurai", "Sankari", 28.0, 0.40, get_traffic_multiplier(hour, False), 130.0, "NH-544 Expressway"),
        ("Sankari", "Salem", 40.0, 0.55, get_traffic_multiplier(hour, False), 130.0, "NH-544 Expressway"),

        # Salem to Chennai via NH-44 / NH-48
        ("Salem", "Chennai", 345.0, 5.2, get_traffic_multiplier(hour, False), 620.0, "NH-48 Golden Quad")
    ]

    for u, v, dist, dur, tmult, toll, rname in edges:
        G.add_edge(u, v, distance_km=dist, duration_hours=dur, traffic_mult=tmult, toll_inr=toll, road_name=rname)

    return G
