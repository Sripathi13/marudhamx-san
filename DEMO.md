# AgriRoute — 2-Minute Judging Demo Script

Follow this script to demonstrate AgriRoute to judges or evaluators in under 120 seconds.

---

### Step 1: Problem & Pitch (0:00 – 0:25)
- **Speaker:** 
  > *"When a farmer near Pollachi harvests 5 tonnes of tomatoes, existing GPS tools like Google Maps suggest the shortest road. But for perishables, the shortest road is often the worst road. Every hour spent trapped in traffic under 32°C heat accelerates biological decay. AgriRoute uses an agricultural cost function with Dijkstra and OR-Tools to minimize **total economic loss**—jointly balancing fuel, tolls, transit time, and spoilage."*

---

### Step 2: One-Click Demo Scenario (0:25 – 0:45)
- **Action:** Click the gold **"Demo Scenario"** button in the top navigation bar.
- **Showcase:**
  - **Crop:** Tomato (5,000 kg)
  - **Origin:** Pollachi Farm Hub
  - **Destination:** Coimbatore MGR Wholesale Market
  - **Vehicle:** Refrigerated Reefer Truck (15-tonne cap, 0.3× insulation factor)
- **Speaker:**
  > *"Notice how the system immediately runs Dijkstra on our agricultural graph and renders three distinct candidate routes on the Leaflet OpenStreetMap."*

---

### Step 3: Map & Comparison Table (0:45 – 1:15)
- **Showcase:**
  - **Route A (Direct NH-83 Corridor):** Shorter distance (48 km), but encounters bottlenecks at Kinathukadavu.
  - **Route B (Expressway Bypass NH-544):** 55 km (+7 km longer), costs ₹500 more in tolls and fuel, but arrives **35 minutes faster** on a smooth bypass.
  - **Route C (Rural Link):** Zero tolls, but 35 km/h bumpy link that causes high cellular damage.
- **Speaker:**
  > *"Look at the recommendation: Route B is crowned the winner. The explanation clearly tells the farmer:*
  > **'Route B costs ₹650 more than the cheapest route, but reduces expected spoilage loss by ₹3,200 and arrives 35m earlier.'**
  > *Every number displays explicit units (₹, km, %, h) and estimated traffic badges."*

---

### Step 4: "Why This Route?" Explainability & Assumptions (1:15 – 1:40)
- **Action:** Expand the **"Why this route?"** section and click **"Assumptions & Model"**.
- **Showcase:**
  - Horizontal stacked bar showing the weights: Spoilage mitigation, Transit speed, Cost efficiency, Flow smoothness.
  - Assumptions modal clearly showing the biological decay equation $1 - e^{-kt}$, ambient Kongu temperature factors, and transparent demo notices.
- **Speaker:**
  > *"There is zero black-box AI magic here. The farmer sees exactly how their crop's sensitivity prioritized transit speed over toll savings. We also maintain full data transparency with explicit demonstration assumption notices."*

---

### Step 5: Multi-Truck (VRP) & Tamil Language Switch (1:40 – 2:00)
- **Action:**
  - Click **"தமிழ்"** in the top bar to show localized Tamil interface for Kongu farmers.
  - Click the **"Multi-Truck (VRP)"** tab and hit **"Solve Multi-Truck Allocation"** to demonstrate OR-Tools consolidating 4 regional farm harvests into 3 trucks with utilization bars.
- **Closing Speaker:**
  > *"AgriRoute bridges graph theory, logistics operations research, and agricultural post-harvest biology to put hard rupees back into the hands of our farmers."*
