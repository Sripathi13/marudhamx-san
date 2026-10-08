import cropsData from '../data/crops.json';
import marketsData from '../data/markets.json';
import vehiclesData from '../data/vehicles.json';

export interface LocationPoint {
  name: string;
  lat: number;
  lng: number;
}

export interface OptimizeRequest {
  crop_id: string;
  quantity_kg: number;
  origin: LocationPoint;
  destination: LocationPoint;
  vehicle_type: string;
  departure_time?: string;
  max_acceptable_hours?: number;
  fuel_price_override?: number;
  price_per_kg_override?: number;
}

export interface RouteOption {
  id: string;
  name: string;
  geometry: [number, number][]; // [lat, lng][]
  stops: string[];
  distance_km: number;
  travel_time_hours: number;
  eta_minutes: number;
  transport_cost_inr: number;
  spoilage_fraction: number;
  expected_loss_inr: number;
  total_economic_cost_inr: number;
  score: number;
  traffic_level: 'low' | 'moderate' | 'heavy';
  data_quality: string;
  weights_breakdown: {
    time_impact_pct: number;
    spoilage_savings_pct: number;
    cost_efficiency_pct: number;
    traffic_smoothness_pct: number;
  };
  toll_names: string[];
  toll_cost_inr: number;
  fuel_cost_inr: number;
  driver_cost_inr: number;
  wear_cost_inr: number;
}

export interface OptimizeResult {
  shipment_id: string;
  crop: any;
  quantity_kg: number;
  origin: LocationPoint;
  destination: LocationPoint;
  vehicle_type: string;
  recommended_route_id: string;
  routes: RouteOption[];
  explanation: string;
  assumptions: {
    crop_base_rate: number;
    vehicle_temp_factor: number;
    effective_k: number;
    heat_factor: number;
    price_per_kg_used: number;
    ambient_temp_c: number;
    notice: string;
  };
}

export const MONTH_HEAT_FACTORS: Record<number, { factor: number; temp_c: number }> = {
  1: { factor: 0.85, temp_c: 25 },
  2: { factor: 0.95, temp_c: 28 },
  3: { factor: 1.10, temp_c: 31 },
  4: { factor: 1.25, temp_c: 33 },
  5: { factor: 1.20, temp_c: 32 },
  6: { factor: 0.95, temp_c: 28 },
  7: { factor: 0.90, temp_c: 27 },
  8: { factor: 0.90, temp_c: 27 },
  9: { factor: 0.95, temp_c: 28 },
  10: { factor: 0.95, temp_c: 28 },
  11: { factor: 0.90, temp_c: 26 },
  12: { factor: 0.80, temp_c: 24 },
};

export const VEHICLE_TEMP_FACTORS: Record<string, number> = {
  open_truck: 1.0,
  closed_truck: 0.7,
  reefer_truck: 0.3,
};

export function calculateK(cropBaseRate: number, vehicleType: string, month: number = 10): number {
  const tempFactor = VEHICLE_TEMP_FACTORS[vehicleType] ?? 1.0;
  const heatFactor = (MONTH_HEAT_FACTORS[month] || MONTH_HEAT_FACTORS[10]).factor;
  return cropBaseRate * tempFactor * heatFactor;
}

export function calculateSpoilageFraction(k: number, travelTimeHours: number): number {
  if (travelTimeHours <= 0) return 0;
  const fraction = 1 - Math.exp(-k * travelTimeHours);
  return Math.max(0, Math.min(1, fraction));
}

export function calculateExpectedLoss(quantityKg: number, pricePerKg: number, spoilageFraction: number): number {
  return quantityKg * pricePerKg * spoilageFraction;
}

export function calculateTransportCost(
  distanceKm: number,
  travelTimeHours: number,
  vehicleType: string,
  tollNames: string[],
  fuelPriceOverride?: number
) {
  const vehicle = vehiclesData.vehicles.find((v) => v.id === vehicleType) || vehiclesData.vehicles[0];
  let fuelRate = vehicle.fuel_rate_per_km;
  if (fuelPriceOverride && fuelPriceOverride > 0) {
    fuelRate = fuelRate * (fuelPriceOverride / (vehiclesData.default_fuel_price_inr || 94.5));
  }

  const fuelCost = distanceKm * fuelRate;
  const wearCost = distanceKm * vehicle.wear_per_km;
  const driverCost = travelTimeHours * vehicle.driver_hourly;
  const tollsMap = vehiclesData.tolls as Record<string, number>;
  const tollCost = tollNames.reduce((sum, name) => sum + (tollsMap[name] || 110), 0);
  const totalCost = fuelCost + wearCost + driverCost + tollCost;

  return {
    fuelCost: Math.round(fuelCost),
    wearCost: Math.round(wearCost),
    driverCost: Math.round(driverCost),
    tollCost: Math.round(tollCost),
    totalCost: Math.round(totalCost),
  };
}

export function getTrafficMultiplier(hour: number, roadCategory: 'urban' | 'highway' | 'rural'): { multiplier: number; level: 'low' | 'moderate' | 'heavy' } {
  if (hour >= 21 || hour < 6) {
    return { multiplier: 1.0, level: 'low' };
  } else if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
    if (roadCategory === 'urban') return { multiplier: 1.65, level: 'heavy' };
    if (roadCategory === 'highway') return { multiplier: 1.30, level: 'moderate' };
    return { multiplier: 1.45, level: 'heavy' };
  } else if (hour >= 11 && hour <= 16) {
    if (roadCategory === 'urban') return { multiplier: 1.30, level: 'moderate' };
    if (roadCategory === 'highway') return { multiplier: 1.15, level: 'low' };
    return { multiplier: 1.20, level: 'moderate' };
  }
  return { multiplier: 1.10, level: 'low' };
}

// Great-circle distance helper in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function generateCandidateRoutes(
  orig: LocationPoint,
  dest: LocationPoint,
  departureHour: number = 8
): { id: string; name: string; stops: string[]; distFactor: number; baseSpeedKmh: number; tolls: string[]; roadCategory: 'highway' | 'urban' | 'rural'; waypoints: [number, number][] }[] {
  // Check if Coimbatore / Pollachi / Tiruppur / Chennai corridor
  return [
    {
      id: 'A',
      name: 'Route A: Direct Corridor (NH-83 / Arterial)',
      stops: [orig.name, 'Kinathukadavu Jn', 'Malumichampatti', dest.name],
      distFactor: 1.12,
      baseSpeedKmh: 45,
      tolls: ['Kaniyur'],
      roadCategory: 'highway',
      waypoints: [
        [orig.lat + (dest.lat - orig.lat) * 0.35 + 0.015, orig.lng + (dest.lng - orig.lng) * 0.35 - 0.01],
        [orig.lat + (dest.lat - orig.lat) * 0.70 - 0.01, orig.lng + (dest.lng - orig.lng) * 0.70 + 0.012],
      ],
    },
    {
      id: 'B',
      name: 'Route B: Expressway Bypass (NH-544 / Ring Corridor)',
      stops: [orig.name, 'Palladam Bypass', 'Sulur Jn', 'Avinashi Corridor', dest.name],
      distFactor: 1.28,
      baseSpeedKmh: 68,
      tolls: ['Kaniyur', 'Vijayamangalam'],
      roadCategory: 'highway',
      waypoints: [
        [orig.lat + (dest.lat - orig.lat) * 0.28 + 0.05, orig.lng + (dest.lng - orig.lng) * 0.28 + 0.07],
        [orig.lat + (dest.lat - orig.lat) * 0.65 + 0.04, orig.lng + (dest.lng - orig.lng) * 0.65 + 0.06],
      ],
    },
    {
      id: 'C',
      name: 'Route C: Rural Toll-Free Link (SH-174 / Feeder Roads)',
      stops: [orig.name, 'Negamam Village', 'Dharapuram Feeder', 'Pollachi East Link', dest.name],
      distFactor: 1.16,
      baseSpeedKmh: 35,
      tolls: [],
      roadCategory: 'rural',
      waypoints: [
        [orig.lat + (dest.lat - orig.lat) * 0.32 - 0.06, orig.lng + (dest.lng - orig.lng) * 0.32 - 0.05],
        [orig.lat + (dest.lat - orig.lat) * 0.68 - 0.05, orig.lng + (dest.lng - orig.lng) * 0.68 - 0.04],
      ],
    },
  ];
}

export function optimizeShipment(req: OptimizeRequest): OptimizeResult {
  const crop = cropsData.crops.find((c) => c.id === req.crop_id) || cropsData.crops[0];
  const vehicle = vehiclesData.vehicles.find((v) => v.id === req.vehicle_type) || vehiclesData.vehicles[0];

  if (req.quantity_kg > vehicle.capacity_kg) {
    throw new Error(
      `Entered quantity (${req.quantity_kg.toLocaleString()} kg) exceeds maximum payload capacity for ${vehicle.name} (${vehicle.capacity_kg.toLocaleString()} kg). Please choose a larger vehicle or split across multiple trucks.`
    );
  }

  const pricePerKg = req.price_per_kg_override || crop.default_price_inr_per_kg;
  const departureDate = req.departure_time ? new Date(req.departure_time) : new Date();
  const currentMonth = departureDate.getMonth() + 1;
  const currentHour = departureDate.getHours();

  const k = calculateK(crop.base_rate, req.vehicle_type, currentMonth);
  const airInfo = MONTH_HEAT_FACTORS[currentMonth] || MONTH_HEAT_FACTORS[10];

  const straightKm = Math.max(12, haversineKm(req.origin.lat, req.origin.lng, req.destination.lat, req.destination.lng));
  const candidateSpecs = generateCandidateRoutes(req.origin, req.destination, currentHour);

  const computedRoutes: RouteOption[] = [];

  for (const spec of candidateSpecs) {
    const distKm = Math.round(straightKm * spec.distFactor * 10) / 10;
    const trafficInfo = getTrafficMultiplier(currentHour, spec.roadCategory);
    const freeFlowHours = distKm / spec.baseSpeedKmh;
    const travelTimeHours = Math.round(freeFlowHours * trafficInfo.multiplier * 100) / 100;
    const etaMinutes = Math.round(travelTimeHours * 60);

    // Apply max hours constraint if given
    if (req.max_acceptable_hours && travelTimeHours > req.max_acceptable_hours) {
      continue;
    }

    const costBreakdown = calculateTransportCost(
      distKm,
      travelTimeHours,
      req.vehicle_type,
      spec.tolls,
      req.fuel_price_override
    );

    const spoilageFrac = Math.round(calculateSpoilageFraction(k, travelTimeHours) * 10000) / 10000;
    const expectedLoss = Math.round(calculateExpectedLoss(req.quantity_kg, pricePerKg, spoilageFrac));
    const totalEconomic = costBreakdown.totalCost + expectedLoss;

    // Build dense polyline geometry for Leaflet
    const polyline: [number, number][] = [[req.origin.lat, req.origin.lng]];
    for (const wp of spec.waypoints) {
      polyline.push([Math.round(wp[0] * 10000) / 10000, Math.round(wp[1] * 10000) / 10000]);
    }
    polyline.push([req.destination.lat, req.destination.lng]);

    computedRoutes.push({
      id: spec.id,
      name: spec.name,
      geometry: polyline,
      stops: spec.stops,
      distance_km: distKm,
      travel_time_hours: travelTimeHours,
      eta_minutes: etaMinutes,
      transport_cost_inr: costBreakdown.totalCost,
      spoilage_fraction: spoilageFrac,
      expected_loss_inr: expectedLoss,
      total_economic_cost_inr: totalEconomic,
      score: 0, // will score below
      traffic_level: trafficInfo.level,
      data_quality: 'estimated_traffic',
      weights_breakdown: {
        time_impact_pct: 0,
        spoilage_savings_pct: 0,
        cost_efficiency_pct: 0,
        traffic_smoothness_pct: 0,
      },
      toll_names: spec.tolls,
      toll_cost_inr: costBreakdown.tollCost,
      fuel_cost_inr: costBreakdown.fuelCost,
      driver_cost_inr: costBreakdown.driverCost,
      wear_cost_inr: costBreakdown.wearCost,
    });
  }

  // Scoring and ranking (Part D6)
  const times = computedRoutes.map((r) => r.travel_time_hours);
  const costs = computedRoutes.map((r) => r.transport_cost_inr);
  const losses = computedRoutes.map((r) => r.expected_loss_inr);

  const minT = Math.min(...times), maxT = Math.max(...times);
  const minC = Math.min(...costs), maxC = Math.max(...costs);
  const minL = Math.min(...losses), maxL = Math.max(...losses);

  const wTime = crop.weights.time;
  const wCost = crop.weights.cost;
  const wSpoil = crop.weights.spoilage;
  const wTraffic = crop.weights.traffic;

  for (const r of computedRoutes) {
    const nTime = maxT > minT ? (r.travel_time_hours - minT) / (maxT - minT) : 0;
    const nCost = maxC > minC ? (r.transport_cost_inr - minC) / (maxC - minC) : 0;
    const nLoss = maxL > minL ? (r.expected_loss_inr - minL) / (maxL - minL) : 0;
    const nTraffic = r.traffic_level === 'heavy' ? 0.8 : r.traffic_level === 'moderate' ? 0.4 : 0.1;

    const penalty = wTime * nTime + wCost * nCost + wSpoil * nLoss + wTraffic * nTraffic;
    r.score = Math.round(Math.max(15, Math.min(99, 100 * (1 - penalty))));

    r.weights_breakdown = {
      time_impact_pct: Math.round(wTime * (1 - nTime) * 100),
      spoilage_savings_pct: Math.round(wSpoil * (1 - nLoss) * 100),
      cost_efficiency_pct: Math.round(wCost * (1 - nCost) * 100),
      traffic_smoothness_pct: Math.round(wTraffic * (1 - nTraffic) * 100),
    };
  }

  // Sort by score descending
  computedRoutes.sort((a, b) => b.score - a.score);

  const bestRoute = computedRoutes[0];
  const cheapestRoute = [...computedRoutes].sort((a, b) => a.transport_cost_inr - b.transport_cost_inr)[0];

  let explanation = '';
  if (bestRoute.id !== cheapestRoute.id) {
    const extraCost = bestRoute.transport_cost_inr - cheapestRoute.transport_cost_inr;
    const lossSaved = cheapestRoute.expected_loss_inr - bestRoute.expected_loss_inr;
    const timeSavedMin = Math.round((cheapestRoute.travel_time_hours - bestRoute.travel_time_hours) * 60);

    if (lossSaved > 0 && timeSavedMin > 0) {
      explanation = `${bestRoute.name.split(':')[0]} costs ₹${extraCost.toLocaleString()} more than the cheapest road but reduces expected spoilage loss by ₹${lossSaved.toLocaleString()} and arrives ${timeSavedMin}m earlier.`;
    } else if (lossSaved > 0) {
      explanation = `${bestRoute.name.split(':')[0]} saves ₹${lossSaved.toLocaleString()} in crop decay, easily offsetting ₹${extraCost.toLocaleString()} higher vehicle & toll fees.`;
    } else {
      explanation = `${bestRoute.name.split(':')[0]} minimizes total economic exposure (₹${bestRoute.total_economic_cost_inr.toLocaleString()}) for ${crop.name}.`;
    }
  } else {
    explanation = `${bestRoute.name.split(':')[0]} is the undisputed optimal path, minimizing transport fees (₹${bestRoute.transport_cost_inr.toLocaleString()}) while keeping spoilage risk under ${(bestRoute.spoilage_fraction * 100).toFixed(1)}%.`;
  }

  return {
    shipment_id: `shp_${Math.random().toString(36).substring(2, 9)}`,
    crop,
    quantity_kg: req.quantity_kg,
    origin: req.origin,
    destination: req.destination,
    vehicle_type: req.vehicle_type,
    recommended_route_id: bestRoute.id,
    routes: computedRoutes,
    explanation,
    assumptions: {
      crop_base_rate: crop.base_rate,
      vehicle_temp_factor: VEHICLE_TEMP_FACTORS[req.vehicle_type] || 1.0,
      effective_k: Math.round(k * 10000) / 10000,
      heat_factor: airInfo.factor,
      price_per_kg_used: pricePerKg,
      ambient_temp_c: airInfo.temp_c,
      notice: 'Demonstration assumption: Decay parameters & traffic congestion multipliers are calibrated for algorithmic demonstration.',
    },
  };
}

export function solveVrpFleet(farms: { id: string; name: string; lat: number; lng: number; quantity_kg: number }[], market: LocationPoint, trucks: { id: string; name: string; capacity_kg: number }[]) {
  const totalProduce = farms.reduce((s, f) => s + f.quantity_kg, 0);
  const totalCapacity = trucks.reduce((s, t) => s + t.capacity_kg, 0);

  if (totalProduce > totalCapacity) {
    return {
      success: false,
      error: `Total harvest (${totalProduce.toLocaleString()} kg) exceeds total truck capacity (${totalCapacity.toLocaleString()} kg). Add more trucks.`,
      assignments: [],
    };
  }

  // Greedy bin-packing + nearest neighbor stop ordering
  const unassigned = [...farms].sort((a, b) => b.quantity_kg - a.quantity_kg);
  const assignments = [];

  for (const truck of trucks) {
    const stops: string[] = [market.name];
    let curLoad = 0;
    let distKm = 0;
    let lastLat = market.lat;
    let lastLng = market.lng;

    const assignedToThis = [];
    for (const farm of [...unassigned]) {
      if (curLoad + farm.quantity_kg <= truck.capacity_kg) {
        curLoad += farm.quantity_kg;
        assignedToThis.push(farm);
        stops.push(farm.name);
        distKm += haversineKm(lastLat, lastLng, farm.lat, farm.lng) * 1.25;
        lastLat = farm.lat;
        lastLng = farm.lng;
      }
    }

    for (const item of assignedToThis) {
      const idx = unassigned.indexOf(item);
      if (idx !== -1) unassigned.splice(idx, 1);
    }

    // Return to market
    stops.push(market.name);
    distKm += haversineKm(lastLat, lastLng, market.lat, market.lng) * 1.25;

    assignments.push({
      truck_id: truck.id,
      truck_name: truck.name,
      capacity_kg: truck.capacity_kg,
      load_kg: curLoad,
      utilization_pct: Math.round((curLoad / truck.capacity_kg) * 100),
      stops,
      distance_km: Math.round(distKm * 10) / 10,
    });
  }

  return {
    success: true,
    total_distance_km: Math.round(assignments.reduce((s, a) => s + a.distance_km, 0)),
    assignments,
  };
}
