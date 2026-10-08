from typing import List, Dict, Any

def score_and_rank_routes(routes: List[Dict[str, Any]], crop_weights: Dict[str, float]) -> List[Dict[str, Any]]:
    if not routes:
        return []
    
    # Extract min & max for normalization
    times = [r["travel_time_hours"] for r in routes]
    costs = [r["transport_cost_inr"] for r in routes]
    losses = [r["expected_loss_inr"] for r in routes]

    min_t, max_t = min(times), max(times)
    min_c, max_c = min(costs), max(costs)
    min_l, max_l = min(losses), max(losses)

    w_time = crop_weights.get("time", 0.4)
    w_cost = crop_weights.get("cost", 0.2)
    w_spoil = crop_weights.get("spoilage", 0.3)
    w_traffic = crop_weights.get("traffic", 0.1)

    scored_routes = []
    for r in routes:
        # Normalized values between 0.0 and 1.0 (0 is best, 1 is worst)
        n_time = (r["travel_time_hours"] - min_t) / (max_t - min_t) if max_t > min_t else 0.0
        n_cost = (r["transport_cost_inr"] - min_c) / (max_c - min_c) if max_c > min_c else 0.0
        n_loss = (r["expected_loss_inr"] - min_l) / (max_l - min_l) if max_l > min_l else 0.0
        
        # traffic penalty normalized
        traffic_norm = 0.8 if r.get("traffic_level") == "heavy" else (0.4 if r.get("traffic_level") == "moderate" else 0.1)

        # overall_score = 100 * (1 - [w_time*n_time + w_cost*n_cost + w_spoil*n_loss + w_traffic*traffic_norm])
        penalty = (w_time * n_time) + (w_cost * n_cost) + (w_spoil * n_loss) + (w_traffic * traffic_norm * 0.2)
        score = round(max(10.0, min(100.0, 100.0 * (1.0 - penalty))), 1)

        # Breakdown contributions for explainability UI
        r_copy = dict(r)
        r_copy["score"] = score
        r_copy["weights_breakdown"] = {
            "time_impact_pct": round(w_time * (1.0 - n_time) * 100, 1),
            "spoilage_savings_pct": round(w_spoil * (1.0 - n_loss) * 100, 1),
            "cost_efficiency_pct": round(w_cost * (1.0 - n_cost) * 100, 1),
            "traffic_smoothness_pct": round(w_traffic * (1.0 - traffic_norm) * 100, 1)
        }
        scored_routes.append(r_copy)

    # Sort descending by score
    scored_routes.sort(key=lambda x: x["score"], reverse=True)
    return scored_routes

def generate_tradeoff_explanation(best_route: Dict[str, Any], all_routes: List[Dict[str, Any]]) -> str:
    if len(all_routes) <= 1:
        return f"{best_route['name']} is the optimal route with balanced travel duration and minimal produce spoilage."
    
    # Compare against the cheapest transport route
    cheapest = min(all_routes, key=lambda r: r["transport_cost_inr"])
    shortest = min(all_routes, key=lambda r: r["distance_km"])

    if best_route["id"] != cheapest["id"]:
        extra_cost = best_route["transport_cost_inr"] - cheapest["transport_cost_inr"]
        loss_saved = cheapest["expected_loss_inr"] - best_route["expected_loss_inr"]
        time_saved_min = round((cheapest["travel_time_hours"] - best_route["travel_time_hours"]) * 60)

        if loss_saved > 0 and time_saved_min > 0:
            return (
                f"{best_route['name']} costs ₹{abs(round(extra_cost)):,} more in vehicle & toll expenditure "
                f"than the cheapest route, but saves ₹{round(loss_saved):,} in spoilage damage and arrives "
                f"{time_saved_min} min earlier."
            )
        elif loss_saved > 0:
            return (
                f"{best_route['name']} saves ₹{round(loss_saved):,} in spoilage loss despite ₹{round(extra_cost):,} higher transport cost, "
                f"maximizing total farmer revenue."
            )

    return (
        f"{best_route['name']} delivers the lowest total economic loss (₹{round(best_route['total_economic_cost_inr']):,}) "
        f"across transport expenditure and expected produce decay."
    )
