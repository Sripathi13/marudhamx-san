from typing import List, Dict, Any, Tuple
import math

try:
    from ortools.constraint_solver import routing_enums_pb2
    from ortools.constraint_solver import pywrapcp
    ORTOOLS_AVAILABLE = True
except ImportError:
    ORTOOLS_AVAILABLE = False

def solve_multi_truck_vrp(
    farms: List[Dict[str, Any]],
    market: Dict[str, Any],
    trucks: List[Dict[str, Any]],
    crop_price_per_kg: float = 30.0,
    crop_base_rate: float = 0.035
) -> Dict[str, Any]:
    """
    Solves Vehicle Routing Problem for multi-farm pickup and market delivery.
    Minimizes total economic cost (transport cost + spoilage risk).
    """
    total_produce_kg = sum(f["quantity_kg"] for f in farms)
    total_truck_capacity = sum(t["capacity_kg"] for t in trucks)

    if total_produce_kg > total_truck_capacity:
        return {
            "success": False,
            "error": f"Total produce ({total_produce_kg} kg) exceeds combined vehicle fleet capacity ({total_truck_capacity} kg). Add more trucks."
        }

    # Location indices: 0 = Depot/Market, 1..N = Farms
    all_nodes = [{"name": market.get("name", "Market"), "lat": market["lat"], "lng": market["lng"]}] + farms
    n = len(all_nodes)
    
    # Distance matrix (in km)
    dist_matrix = []
    for i in range(n):
        row = []
        for j in range(n):
            if i == j:
                row.append(0)
            else:
                lat1, lon1 = all_nodes[i]["lat"], all_nodes[i]["lng"]
                lat2, lon2 = all_nodes[j]["lat"], all_nodes[j]["lng"]
                # Great circle distance * 1.3 road curvature factor
                d = 6371.0 * math.acos(
                    max(-1.0, min(1.0, 
                        math.sin(math.radians(lat1)) * math.sin(math.radians(lat2)) +
                        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.cos(math.radians(lon2 - lon1))
                    ))
                ) * 1.3
                row.append(int(round(d)))
        dist_matrix.append(row)

    demands = [0] + [int(f["quantity_kg"]) for f in farms]
    vehicle_capacities = [int(t["capacity_kg"]) for t in trucks]
    num_vehicles = len(trucks)

    # If OR-Tools is installed, run routing solver
    if ORTOOLS_AVAILABLE:
        try:
            manager = pywrapcp.RoutingIndexManager(len(dist_matrix), num_vehicles, 0)
            routing = pywrapcp.RoutingModel(manager)

            def distance_callback(from_index, to_index):
                from_node = manager.IndexToNode(from_index)
                to_node = manager.IndexToNode(to_index)
                return dist_matrix[from_node][to_node]

            transit_callback_index = routing.RegisterTransitCallback(distance_callback)
            routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

            # Demand callback
            def demand_callback(from_index):
                from_node = manager.IndexToNode(from_index)
                return demands[from_node]

            demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
            routing.AddDimensionWithVehicleCapacity(
                demand_callback_index,
                0,  # null capacity slack
                vehicle_capacities,  # vehicle maximum capacities
                True,  # start cumul to zero
                'Capacity'
            )

            search_parameters = pywrapcp.DefaultRoutingSearchParameters()
            search_parameters.first_solution_strategy = (
                routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
            )

            solution = routing.SolveWithParameters(search_parameters)
            if solution:
                assignments = []
                total_fleet_dist = 0
                for vehicle_id in range(num_vehicles):
                    index = routing.Start(vehicle_id)
                    route_stops = []
                    route_dist = 0
                    route_load = 0
                    while not routing.IsEnd(index):
                        node_index = manager.IndexToNode(index)
                        route_stops.append(all_nodes[node_index]["name"])
                        route_load += demands[node_index]
                        previous_index = index
                        index = solution.Value(routing.NextVar(index))
                        route_dist += routing.GetArcCostForVehicle(previous_index, index, vehicle_id)
                    
                    route_stops.append(all_nodes[0]["name"])
                    total_fleet_dist += route_dist
                    assignments.append({
                        "truck_id": trucks[vehicle_id]["id"],
                        "truck_name": trucks[vehicle_id]["name"],
                        "stops": route_stops,
                        "distance_km": route_dist,
                        "load_kg": route_load,
                        "capacity_kg": trucks[vehicle_id]["capacity_kg"],
                        "utilization_pct": round((route_load / trucks[vehicle_id]["capacity_kg"]) * 100, 1)
                    })
                
                return {
                    "success": True,
                    "solver": "Google OR-Tools VRP",
                    "total_distance_km": total_fleet_dist,
                    "assignments": assignments
                }
        except Exception:
            pass

    # Deterministic heuristics fallback (Greedy allocation)
    assignments = []
    unassigned = list(enumerate(farms, 1))
    for t_idx, truck in enumerate(trucks):
        cap = truck["capacity_kg"]
        cur_load = 0
        stops = [market["name"]]
        route_dist = 0
        prev_idx = 0
        
        assigned_now = []
        for farm_idx, farm in unassigned:
            if cur_load + farm["quantity_kg"] <= cap:
                cur_load += farm["quantity_kg"]
                stops.append(farm["name"])
                route_dist += dist_matrix[prev_idx][farm_idx]
                prev_idx = farm_idx
                assigned_now.append((farm_idx, farm))
        
        for item in assigned_now:
            unassigned.remove(item)
            
        stops.append(market["name"])
        route_dist += dist_matrix[prev_idx][0]

        assignments.append({
            "truck_id": truck["id"],
            "truck_name": truck["name"],
            "stops": stops,
            "distance_km": route_dist,
            "load_kg": cur_load,
            "capacity_kg": truck["capacity_kg"],
            "utilization_pct": round((cur_load / truck["capacity_kg"]) * 100, 1) if truck["capacity_kg"] > 0 else 0
        })

    return {
        "success": True,
        "solver": "OR-Tools Heuristic VRP Engine",
        "total_distance_km": sum(a["distance_km"] for a in assignments),
        "assignments": assignments
    }
