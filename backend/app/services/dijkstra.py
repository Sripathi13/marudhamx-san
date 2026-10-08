import heapq
from typing import Dict, List, Tuple, Any, Optional
import networkx as nx

def custom_dijkstra_agricultural(
    graph: nx.DiGraph,
    source: str,
    target: str,
    crop_weights: Dict[str, float],
    crop_k: float,
    quantity_kg: float,
    price_per_kg: float,
    fuel_rate_per_km: float,
    wear_per_km: float,
    driver_hourly: float
) -> Tuple[List[str], float, Dict[str, float]]:
    """
    Dijkstra's shortest path where edge weight is an agricultural cost function:
    edge_weight = w_time * travel_time_hours
                + w_cost * transport_cost_rupees
                + w_spoil * expected_spoilage_loss_rupees
                + w_traffic * traffic_penalty
    """
    w_time = crop_weights.get("time", 0.40)
    w_cost = crop_weights.get("cost", 0.25)
    w_spoil = crop_weights.get("spoilage", 0.25)
    w_traffic = crop_weights.get("traffic", 0.10)

    # Priority queue: (total_weight, current_node, path, accumulated_stats)
    distances: Dict[str, float] = {node: float('inf') for node in graph.nodes}
    distances[source] = 0.0
    pq: List[Tuple[float, str, List[str], Dict[str, float]]] = [
        (0.0, source, [source], {"time_h": 0.0, "cost_inr": 0.0, "spoil_inr": 0.0, "distance_km": 0.0})
    ]

    best_stats = {}

    while pq:
        current_weight, current_node, path, stats = heapq.heappop(pq)

        if current_weight > distances[current_node]:
            continue

        if current_node == target:
            return path, current_weight, stats

        for neighbor in graph.neighbors(current_node):
            edge_data = graph[current_node][neighbor]
            dist_km = edge_data.get("distance_km", 1.0)
            free_flow_hours = edge_data.get("duration_hours", dist_km / 50.0)
            traffic_mult = edge_data.get("traffic_mult", 1.0)
            toll_inr = edge_data.get("toll_inr", 0.0)

            # Segment travel time with traffic
            seg_time_h = free_flow_hours * traffic_mult

            # Transport cost for this segment
            seg_fuel = dist_km * fuel_rate_per_km
            seg_wear = dist_km * wear_per_km
            seg_driver = seg_time_h * driver_hourly
            seg_transport_cost = seg_fuel + seg_wear + seg_driver + toll_inr

            # Incremental spoilage approximation for segment
            # spoilage rate k * delta_t * total produce value
            seg_spoilage_loss = (crop_k * seg_time_h) * (quantity_kg * price_per_kg)

            # Traffic penalty
            traffic_penalty = (traffic_mult - 1.0) * 100.0

            # Edge weight
            edge_weight = (
                w_time * (seg_time_h * 200.0) # scaled to comparable economic scale
                + w_cost * seg_transport_cost
                + w_spoil * seg_spoilage_loss
                + w_traffic * traffic_penalty
            )

            new_distance = current_weight + edge_weight

            if new_distance < distances[neighbor]:
                distances[neighbor] = new_distance
                new_stats = {
                    "time_h": stats["time_h"] + seg_time_h,
                    "cost_inr": stats["cost_inr"] + seg_transport_cost,
                    "spoil_inr": stats["spoil_inr"] + seg_spoilage_loss,
                    "distance_km": stats["distance_km"] + dist_km
                }
                heapq.heappush(pq, (new_distance, neighbor, path + [neighbor], new_stats))

    return [], float('inf'), {}
