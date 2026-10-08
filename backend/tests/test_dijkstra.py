import pytest
import networkx as nx
from app.services.dijkstra import custom_dijkstra_agricultural
from app.services.scoring import score_and_rank_routes

def create_6_node_test_graph():
    """
    Creates a 6-node test graph:
    S (Source) -> A -> B -> T (Target) [Route 1: Long distance, smooth highway, high speed]
    S -> C -> D -> T [Route 2: Short distance, heavily congested city bottlenecks]
    """
    G = nx.DiGraph()
    # Route 1: Highway (total 90 km, 1.2 hours, toll = 100)
    G.add_edge("S", "A", distance_km=30.0, duration_hours=0.4, traffic_mult=1.0, toll_inr=0.0)
    G.add_edge("A", "B", distance_km=30.0, duration_hours=0.4, traffic_mult=1.0, toll_inr=100.0)
    G.add_edge("B", "T", distance_km=30.0, duration_hours=0.4, traffic_mult=1.0, toll_inr=0.0)

    # Route 2: Congested Short Road (total 45 km, but heavily jammed: 3.5 hours, toll = 0)
    G.add_edge("S", "C", distance_km=15.0, duration_hours=0.3, traffic_mult=2.5, toll_inr=0.0)
    G.add_edge("C", "D", distance_km=15.0, duration_hours=0.3, traffic_mult=2.5, toll_inr=0.0)
    G.add_edge("D", "T", distance_km=15.0, duration_hours=0.3, traffic_mult=2.5, toll_inr=0.0)

    return G

def test_tomato_prefers_faster_longer_route():
    """
    For highly perishable tomatoes:
    Weights prioritize time (0.50) and spoilage (0.30).
    The 90 km highway route arrives in 1.2 hrs; the 45 km road takes > 2.2 hrs in traffic.
    Dijkstra must pick the highway path S->A->B->T!
    """
    G = create_6_node_test_graph()
    tomato_weights = {"time": 0.50, "spoilage": 0.30, "cost": 0.15, "traffic": 0.05}
    crop_k = 0.035
    quantity = 5000.0
    price = 32.0

    path, cost, stats = custom_dijkstra_agricultural(
        graph=G,
        source="S",
        target="T",
        crop_weights=tomato_weights,
        crop_k=crop_k,
        quantity_kg=quantity,
        price_per_kg=price,
        fuel_rate_per_km=18.0,
        wear_per_km=3.0,
        driver_hourly=200.0
    )

    assert path == ["S", "A", "B", "T"], f"Expected faster highway route, got {path}"

def test_rice_prefers_cheapest_shortest_route():
    """
    For non-perishable rice:
    Weights prioritize cost (0.60) with minimal spoilage weight (0.05).
    The short toll-free road S->C->D->T has half the fuel and zero toll, so it must win!
    """
    G = create_6_node_test_graph()
    rice_weights = {"time": 0.15, "spoilage": 0.05, "cost": 0.60, "traffic": 0.20}
    crop_k = 0.0008
    quantity = 5000.0
    price = 44.0

    path, cost, stats = custom_dijkstra_agricultural(
        graph=G,
        source="S",
        target="T",
        crop_weights=rice_weights,
        crop_k=crop_k,
        quantity_kg=quantity,
        price_per_kg=price,
        fuel_rate_per_km=18.0,
        wear_per_km=3.0,
        driver_hourly=200.0
    )

    assert path == ["S", "C", "D", "T"], f"Expected cheapest route for rice, got {path}"
