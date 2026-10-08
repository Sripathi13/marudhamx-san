# AgriRoute — AI-Based Perishable Produce Transportation Optimizer

> **Hackathon Master Pitch:** AgriRoute finds the economically best route for perishable produce by jointly weighing travel time, transport cost, traffic congestion, and biological spoilage risk, rather than simply selecting the shortest road.

---

## 1. Problem Statement

A farmer near Pollachi / Coimbatore has harvested 5 to 10 tonnes of tomatoes and needs to get them to wholesale markets (Coimbatore MGR Market, Tiruppur, Salem, or Chennai Koyambedu). 

A standard navigation algorithm (Google Maps / shortest path) routes along the shortest physical distance. However, for perishable crops with high moisture content and rapid respiration rates:
- A route that is **15 km shorter** through congested urban bottlenecks exposes produce to **2 extra hours of 32°C ambient heat**, causing ₹12,000+ in damaged, spoiled tomatoes.
- A **longer 4-lane expressway bypass** costs ₹800 more in tolls and diesel, but saves 90 minutes of transit time, arriving before wholesale morning auctions close with crisp, high-grade produce.

**AgriRoute minimizes Total Economic Loss = Transport Costs + Expected Spoilage Loss.**

---

## 2. Architecture & Algorithms

```
                          [ Farmer Input ]
             (Crop, Tonnes, Farm Location, Market, Truck)
                                 │
                                 ▼
             ┌────────────────────────────────────────┐
             │         AgriRoute Core Engine          │
             ├────────────────────────────────────────┤
             │ 1. Candidate Road Network Discovery    │
             │    - OpenStreetMap Road Graph          │
             │    - NH-83, NH-544 Bypass, SH-174 Link │
             │ 2. Agricultural Edge Weighting         │
             │    - w_time × Travel Time              │
             │    - w_cost × Transport Cost           │
             │    - w_spoil × Respiration Decay Loss  │
             │    - w_traffic × Congestion Penalty    │
             │ 3. Custom Dijkstra Path Search         │
             │ 4. OR-Tools Multi-Truck VRP Allocator  │
             └──────────────────┬─────────────────────┘
                                │
                                ▼
             ┌────────────────────────────────────────┐
             │       Interactive Leaflet & UI         │
             │  - Leaflet Map with 3 Distinct Routes  │
             │  - Recommended Route Card & Trade-off  │
             │  - "Why This Route?" Stacked Breakdown │
             │  - Spoilage vs Tolls Comparison Table  │
             │  - Dual-Language (English & தமிழ்)     │
             └────────────────────────────────────────┘
```

---

## 3. Mathematical Models

### 3.1 Spoilage Model (Exponential Biological Decay)
$$\text{spoilage\_fraction}(t) = 1 - e^{-k \cdot t}$$
$$k = \text{base\_rate}[\text{crop}] \times \text{temp\_factor}[\text{vehicle}] \times \text{heat\_factor}[\text{month}]$$

- $\text{base\_rate}$: Tomato ($0.035/\text{hr}$), Leafy Greens ($0.058/\text{hr}$), Potato ($0.005/\text{hr}$), Rice ($0.0008/\text{hr}$).
- $\text{temp\_factor}$: Refrigerated Active Cooling ($0.3\times$), Closed Insulated ($0.7\times$), Open Tarpaulin ($1.0\times$).
- $\text{expected\_loss} = \text{quantity\_kg} \times \text{price\_per\_kg} \times \text{spoilage\_fraction}(t)$.

### 3.2 Transport Cost Model
$$\text{transport\_cost} = \text{fuel\_cost} + \text{driver\_wages} + \text{toll\_cost} + \text{vehicle\_wear}$$
$$\text{fuel\_cost} = \text{distance\_km} \times \text{fuel\_rate\_per\_km}(\text{vehicle})$$

### 3.3 Crop-Specific Weighting Vectors
| Crop Perishability Category | Time Weight ($w_t$) | Spoilage Weight ($w_s$) | Cost Weight ($w_c$) | Traffic Weight ($w_{tr}$) |
|---|---|---|---|---|
| **Highly Perishable** (Tomato, Spinach, Mango) | **0.50** | **0.30** | 0.15 | 0.05 |
| **Medium Perishable** (Banana, Potato, Onion) | **0.30** | **0.20** | 0.35 | 0.15 |
| **Low Perishable** (Rice, Dry Grains, Maize) | 0.15 | 0.05 | **0.60** | 0.20 |

---

## 4. Setup & Running

### Using Docker Compose
```bash
# Clone and spin up full stack (Frontend + Backend + PostgreSQL)
git clone https://github.com/example/agriroute.git
cd agriroute
docker compose up --build
```
- Frontend: `http://localhost:3000`
- FastAPI Backend: `http://localhost:8000/docs`

### Running the Live Applet
```bash
# Install dependencies
npm install

# Run full-stack dev server
npm run dev
```

---

## 5. Backend Unit Tests
Run backend test suite covering Dijkstra edge weights, monotonic spoilage, and API capacity bounds:
```bash
cd backend
pytest -v
```

---

## 6. Assumptions Table

| Parameter | Used Value | Source / Methodology |
|---|---|---|
| Tomato Base Decay Rate | 0.035 / hr | Demonstration assumption based on ambient Kongu summer climate |
| Leafy Vegetables Base Decay | 0.058 / hr | Demonstration assumption reflecting rapid moisture transpirational loss |
| Reefer Insulation Multiplier | 0.30× | Demonstration assumption for active diesel compressor (+4°C) |
| Diesel Fuel Benchmark | ₹94.50 / Litre | Tamil Nadu state retail commercial benchmark |
| Traffic Congestion | 1.0× - 1.65× | Estimated deterministic multiplier based on peak auction dispatch windows |

---

## 7. Limitations and Next Steps

1. **Spoilage Rates are Assumptions:** Spoilage parameters ($k$) are calibrated for algorithmic demonstration. Commercial deployment requires integration with ICAR-CFTRI post-harvest respiration curves.
2. **Traffic is Estimated:** Traffic levels currently use time-of-day multipliers. A future release can plug into live TomTom or MoRTH highway feeds.
3. **Multi-Truck VRP Mode:** Multi-truck bin-packing and vehicle routing is functional via OR-Tools heuristics; next steps include dynamic mid-route recalculations when traffic spikes occur.
