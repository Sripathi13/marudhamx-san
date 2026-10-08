// Self-contained Google polyline algorithm decoder (no external module issues)
export function decodePolyline(encoded: string, precision: number = 5): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const factor = Math.pow(10, precision);

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    points.push([lat / factor, lng / factor]);
  }
  return points;
}
import cropsData from '../data/crops.json' with { type: 'json' };
import marketsData from '../data/markets.json' with { type: 'json' };

export interface LocationCoords {
  name: string;
  name_ta?: string;
  name_hi?: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface SettingsState {
  fuel_price_inr: number;
  fuel_efficiency_kmpl: number;
  default_truck_capacity_kg: number;
  traffic_profile: 'off_peak' | 'typical' | 'heavy';
  units: 'km' | 'miles';
  crop_prices: Record<string, number>;
  google_maps_api_key?: string;
}

export const defaultSettings: SettingsState = {
  fuel_price_inr: 94.5,
  fuel_efficiency_kmpl: 4.8,
  default_truck_capacity_kg: 3000,
  traffic_profile: 'typical',
  units: 'km',
  crop_prices: {
    tomato: 32,
    leafy_vegetables: 28,
    banana: 26,
    mango: 65,
    potato: 22,
    onion: 40,
    maize: 21,
    rice: 44
  }
};

export type TrafficSpeed = 'NORMAL' | 'SLOW' | 'TRAFFIC_JAM' | 'UNKNOWN';

export interface TrafficSegment {
  speed: TrafficSpeed;
  coords: [number, number][]; // [lat, lng]
}

export interface RouteStep {
  instruction: string;
  roadName: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface TradeoffInfo {
  templateKey: 'cheapest' | 'savings' | 'loss' | 'overall';
  params: {
    route: string;
    cost?: string;
    extraCost?: string;
    lossSaved?: string;
    timeSaved?: number;
    spoilage?: number;
    crop?: string;
  };
}

export interface RouteCandidate {
  id: string;
  corridorKey: 'corridorA' | 'corridorB' | 'corridorC';
  data_source: 'google_live' | 'osrm_estimated';
  geometry: [number, number][]; // Full polyline [lat, lng]
  geometry_segments: TrafficSegment[]; // Colored segments
  distance_km: number;
  duration_min: number;
  duration_no_traffic_min: number;
  traffic_delay_min: number;
  traffic_is_live: boolean;
  travelTimeHours: number;
  transportCostInr: number;
  spoilageFraction: number;
  expectedLossInr: number;
  totalEconomicCostInr: number;
  score: number;
  trafficLevel: 'low' | 'moderate' | 'heavy';
  steps: RouteStep[];
  tollInr: number;
  fuelCostInr: number;
  driverCostInr: number;
  weightsBreakdown: {
    timePct: number;
    spoilagePct: number;
    costPct: number;
    trafficPct: number;
  };
  googleMapsUrl: string;
  tradeoffInfo: TradeoffInfo;
}

export interface TruckAllocation {
  truckIndex: number;
  loadKg: number;
  capacityKg: number;
  utilizationPct: number;
}

export interface ShipmentPlanResult {
  shipmentId: string;
  timestamp: string;
  origin: LocationCoords;
  destination: LocationCoords;
  cropId: string;
  totalKg: number;
  truckCapacityKg: number;
  trucksNeeded: number;
  fullTrucks: number;
  lastTruckLoad: number;
  truckAllocations: TruckAllocation[];
  recommendedRouteId: string;
  routes: RouteCandidate[];
  dataSource: 'google_live' | 'osrm_estimated';
  trafficIsLive: boolean;
  assumptions: {
    cropBaseRate: number;
    effectiveK: number;
    fuelPriceInr: number;
    trafficMultiplier: number;
  };
}

// Key junction coordinates in Tamil Nadu to discover alternative road corridors
const JUNCTION_WAYPOINTS = [
  { name: 'Palladam Bypass', lat: 11.0045, lng: 77.2798 },
  { name: 'Kinathukadavu Corridor', lat: 10.8228, lng: 76.9964 },
  { name: 'Avinashi Highway', lat: 11.1934, lng: 77.2687 },
  { name: 'Negamam Feeder', lat: 10.7482, lng: 77.1085 },
  { name: 'Tiruppur Link', lat: 11.1085, lng: 77.3411 }
];

function haversineDistKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function buildGoogleMapsUrl(origin: LocationCoords, dest: LocationCoords, via?: [number, number]): string {
  const originParam = `${origin.lat},${origin.lng}`;
  const destParam = `${dest.lat},${dest.lng}`;
  if (via) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&waypoints=${via[0]},${via[1]}&travelmode=driving`;
  }
  return `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=driving`;
}

// Fetch OSRM Route
export async function fetchOSRMRoute(
  origin: LocationCoords,
  dest: LocationCoords,
  viaPoint?: LocationCoords
): Promise<any | null> {
  const osrmBase = (typeof process !== 'undefined' && process.env?.OSRM_BASE_URL) || 'https://router.project-osrm.org';
  const coordsParam = viaPoint
    ? `${origin.lng},${origin.lat};${viaPoint.lng},${viaPoint.lat};${dest.lng},${dest.lat}`
    : `${origin.lng},${origin.lat};${dest.lng},${dest.lat}`;

  const url = `${osrmBase}/route/v1/driving/${coordsParam}?alternatives=true&steps=true&geometries=geojson&overview=full`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return data.code === 'Ok' ? data : null;
  } catch {
    return null;
  }
}

// Mode A: Google Routes API (when GOOGLE_MAPS_API_KEY is configured)
export async function fetchGoogleRoutesLive(
  origin: LocationCoords,
  dest: LocationCoords,
  apiKey: string,
  departureTimeIso?: string
): Promise<any | null> {
  const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
  const depTime = departureTimeIso && new Date(departureTimeIso) > new Date()
    ? new Date(departureTimeIso).toISOString()
    : new Date().toISOString();

  const body = {
    origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
    destination: { location: { latLng: { latitude: dest.lat, longitude: dest.lng } } },
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
    computeAlternativeRoutes: true,
    extraComputations: ['TRAFFIC_ON_POLYLINE'],
    departureTime: depTime
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration,routes.staticDuration,routes.travelAdvisory.speedReadingIntervals,routes.legs.steps,routes.legs.steps.navigationInstruction'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return data.routes && data.routes.length > 0 ? data.routes : null;
  } catch {
    return null;
  }
}

export async function calculateShipmentPlan(
  origin: LocationCoords,
  dest: LocationCoords,
  cropId: string,
  totalKg: number,
  truckCapacityKg: number,
  departureTimeStr: string,
  settings: SettingsState
): Promise<ShipmentPlanResult> {
  if (totalKg <= 0) throw new Error('QUANTITY_INVALID');
  if (truckCapacityKg <= 0) throw new Error('CAPACITY_INVALID');

  const crop = cropsData.crops.find((c) => c.id === cropId) || cropsData.crops[0];
  const wholesalePrice = settings.crop_prices[cropId] ?? crop.default_price_inr_per_kg;

  // Truck allocation calculation
  const trucksNeeded = Math.ceil(totalKg / truckCapacityKg);
  const fullTrucks = Math.floor(totalKg / truckCapacityKg);
  const lastTruckLoad = totalKg - fullTrucks * truckCapacityKg;

  const truckAllocations: TruckAllocation[] = [];
  for (let i = 1; i <= fullTrucks; i++) {
    truckAllocations.push({
      truckIndex: i,
      loadKg: truckCapacityKg,
      capacityKg: truckCapacityKg,
      utilizationPct: 100
    });
  }
  if (lastTruckLoad > 0) {
    truckAllocations.push({
      truckIndex: trucksNeeded,
      loadKg: lastTruckLoad,
      capacityKg: truckCapacityKg,
      utilizationPct: Math.round((lastTruckLoad / truckCapacityKg) * 100)
    });
  }

  // Traffic multiplier calculation based on settings
  let trafficMultiplier = 1.15;
  if (settings.traffic_profile === 'off_peak') trafficMultiplier = 1.0;
  else if (settings.traffic_profile === 'heavy') trafficMultiplier = 1.45;

  const vehicleTempFactor = 0.8;
  const k = crop.base_rate * vehicleTempFactor;

  // Check if live Google Maps Routes API key is available
  const googleApiKey =
    settings.google_maps_api_key ||
    (typeof process !== 'undefined' ? process.env?.GOOGLE_MAPS_API_KEY || process.env?.VITE_GOOGLE_MAPS_API_KEY : '');

  let liveGoogleRoutes: any[] | null = null;
  if (googleApiKey) {
    liveGoogleRoutes = await fetchGoogleRoutesLive(origin, dest, googleApiKey, departureTimeStr);
  }

  const routeCandidates: RouteCandidate[] = [];
  const corridorKeys: ('corridorA' | 'corridorB' | 'corridorC')[] = ['corridorA', 'corridorB', 'corridorC'];
  const routeLetters = ['A', 'B', 'C', 'D'];

  if (liveGoogleRoutes && liveGoogleRoutes.length > 0) {
    // Mode A: Live traffic with Google Routes API
    liveGoogleRoutes.slice(0, 3).forEach((gRoute: any, idx: number) => {
      const decodedPoints = decodePolyline(gRoute.polyline.encodedPolyline); // [[lat, lng], ...]
      const distKm = Math.round((gRoute.distanceMeters / 1000) * 10) / 10;
      const durationSeconds = parseInt(gRoute.duration.replace('s', ''), 10) || 3600;
      const staticDurationSeconds = parseInt((gRoute.staticDuration || gRoute.duration).replace('s', ''), 10) || 3000;

      const durationMin = Math.round(durationSeconds / 60);
      const staticDurationMin = Math.round(staticDurationSeconds / 60);
      const trafficDelayMin = Math.max(0, durationMin - staticDurationMin);
      const travelTimeHours = Math.round((durationMin / 60) * 100) / 100;

      // Build speedReadingIntervals into geometry_segments
      const geometrySegments: TrafficSegment[] = [];
      const intervals = gRoute.travelAdvisory?.speedReadingIntervals || [];

      if (intervals.length > 0) {
        for (const inter of intervals) {
          const startIdx = inter.startPolylinePointIndex || 0;
          const endIdx = Math.min(decodedPoints.length - 1, inter.endPolylinePointIndex || decodedPoints.length - 1);
          const segCoords: [number, number][] = decodedPoints.slice(startIdx, endIdx + 1) as [number, number][];
          if (segCoords.length >= 2) {
            geometrySegments.push({
              speed: (inter.speed as TrafficSpeed) || 'NORMAL',
              coords: segCoords
            });
          }
        }
      } else {
        geometrySegments.push({
          speed: 'NORMAL',
          coords: decodedPoints as [number, number][]
        });
      }

      // Cost calculations
      const litersNeeded = (distKm / settings.fuel_efficiency_kmpl) * trucksNeeded;
      const fuelCost = Math.round(litersNeeded * settings.fuel_price_inr);
      const driverCost = Math.round(travelTimeHours * 200 * trucksNeeded);
      const tollInr = idx === 1 ? 240 * trucksNeeded : idx === 0 ? 110 * trucksNeeded : 0;
      const transportCost = fuelCost + driverCost + tollInr;

      // Spoilage calculation
      const spoilageFrac = Math.round((1 - Math.exp(-k * travelTimeHours)) * 10000) / 10000;
      const expectedLoss = Math.round(totalKg * wholesalePrice * spoilageFrac);
      const totalEconomic = transportCost + expectedLoss;

      const routeLetter = routeLetters[idx] || `${idx + 1}`;
      routeCandidates.push({
        id: routeLetter,
        corridorKey: corridorKeys[idx] || 'corridorA',
        data_source: 'google_live',
        geometry: decodedPoints as [number, number][],
        geometry_segments: geometrySegments,
        distance_km: distKm,
        duration_min: durationMin,
        duration_no_traffic_min: staticDurationMin,
        traffic_delay_min: trafficDelayMin,
        traffic_is_live: true,
        travelTimeHours,
        transportCostInr: transportCost,
        spoilageFraction: spoilageFrac,
        expectedLossInr: expectedLoss,
        totalEconomicCostInr: totalEconomic,
        score: 0,
        trafficLevel: trafficDelayMin > 15 ? 'heavy' : trafficDelayMin > 5 ? 'moderate' : 'low',
        steps: [],
        tollInr,
        fuelCostInr: fuelCost,
        driverCostInr: driverCost,
        weightsBreakdown: { timePct: 0, spoilagePct: 0, costPct: 0, trafficPct: 0 },
        googleMapsUrl: buildGoogleMapsUrl(origin, dest),
        tradeoffInfo: { templateKey: 'overall', params: { route: routeLetter } }
      });
    });
  } else {
    // Mode B: OSRM fallback with real road geometry
    let osrmData = await fetchOSRMRoute(origin, dest);
    const rawRoutes: any[] = [];

    if (osrmData && osrmData.routes && osrmData.routes.length > 0) {
      rawRoutes.push(...osrmData.routes);
    }

    if (rawRoutes.length < 3) {
      for (const jn of JUNCTION_WAYPOINTS) {
        if (rawRoutes.length >= 3) break;
        const dOrig = haversineDistKm(origin.lat, origin.lng, jn.lat, jn.lng);
        const dDest = haversineDistKm(dest.lat, dest.lng, jn.lat, jn.lng);
        if (dOrig > 4 && dDest > 4) {
          const altData = await fetchOSRMRoute(origin, dest, jn);
          if (altData && altData.routes && altData.routes[0]) {
            const newRoute = altData.routes[0];
            const isDistinct = rawRoutes.every(
              (r) => Math.abs(r.distance - newRoute.distance) / Math.max(r.distance, newRoute.distance) > 0.08
            );
            if (isDistinct) rawRoutes.push(newRoute);
          }
        }
      }
    }

    // High fidelity fallback corridors if OSRM is slow
    if (rawRoutes.length === 0) {
      const straightDist = haversineDistKm(origin.lat, origin.lng, dest.lat, dest.lng);
      const mockCorridors = [
        { factor: 1.12, durMin: straightDist * 1.35, tolls: 110 },
        { factor: 1.25, durMin: straightDist * 1.05, tolls: 240 },
        { factor: 1.18, durMin: straightDist * 1.6, tolls: 0 }
      ];

      for (const c of mockCorridors) {
        const distM = straightDist * c.factor * 1000;
        const durSec = c.durMin * 60;
        const midLat = (origin.lat + dest.lat) / 2 + (c.tolls > 100 ? 0.04 : -0.03);
        const midLng = (origin.lng + dest.lng) / 2 + (c.tolls > 100 ? 0.05 : -0.04);
        rawRoutes.push({
          geometry: {
            coordinates: [
              [origin.lng, origin.lat],
              [origin.lng + (midLng - origin.lng) * 0.5, origin.lat + (midLat - origin.lat) * 0.5],
              [midLng, midLat],
              [midLng + (dest.lng - midLng) * 0.5, midLat + (dest.lat - midLat) * 0.5],
              [dest.lng, dest.lat]
            ]
          },
          distance: distM,
          duration: durSec,
          legs: []
        });
      }
    }

    // Process Mode B routes
    rawRoutes.slice(0, 3).forEach((r, idx) => {
      const distKm = Math.round((r.distance / 1000) * 10) / 10;
      const baseDurationMin = Math.round(r.duration / 60);
      const durationMin = Math.round(baseDurationMin * trafficMultiplier);
      const trafficDelayMin = Math.max(0, durationMin - baseDurationMin);
      const travelTimeHours = Math.round((durationMin / 60) * 100) / 100;

      const polyline: [number, number][] = (r.geometry?.coordinates || []).map((pt: [number, number]) => [pt[1], pt[0]]);

      // In Mode B: Draw full route as solid green (NORMAL) according to Spec 2.2:
      // "Draw the full route in green, and show a banner: 'Live traffic is not available. Travel time is estimated from typical traffic for the selected hour.'"
      const geometrySegments: TrafficSegment[] = [
        {
          speed: 'NORMAL',
          coords: polyline
        }
      ];

      // Cost calculations
      const litersNeeded = (distKm / settings.fuel_efficiency_kmpl) * trucksNeeded;
      const fuelCost = Math.round(litersNeeded * settings.fuel_price_inr);
      const driverCost = Math.round(travelTimeHours * 200 * trucksNeeded);
      const tollInr = idx === 1 ? 240 * trucksNeeded : idx === 0 ? 110 * trucksNeeded : 0;
      const transportCost = fuelCost + driverCost + tollInr;

      // Spoilage calculation
      const spoilageFrac = Math.round((1 - Math.exp(-k * travelTimeHours)) * 10000) / 10000;
      const expectedLoss = Math.round(totalKg * wholesalePrice * spoilageFrac);
      const totalEconomic = transportCost + expectedLoss;

      const routeLetter = routeLetters[idx] || `${idx + 1}`;
      routeCandidates.push({
        id: routeLetter,
        corridorKey: corridorKeys[idx] || 'corridorA',
        data_source: 'osrm_estimated',
        geometry: polyline,
        geometry_segments: geometrySegments,
        distance_km: distKm,
        duration_min: durationMin,
        duration_no_traffic_min: baseDurationMin,
        traffic_delay_min: trafficDelayMin,
        traffic_is_live: false,
        travelTimeHours,
        transportCostInr: transportCost,
        spoilageFraction: spoilageFrac,
        expectedLossInr: expectedLoss,
        totalEconomicCostInr: totalEconomic,
        score: 0,
        trafficLevel: trafficDelayMin > 15 ? 'heavy' : trafficDelayMin > 5 ? 'moderate' : 'low',
        steps: [],
        tollInr,
        fuelCostInr: fuelCost,
        driverCostInr: driverCost,
        weightsBreakdown: { timePct: 0, spoilagePct: 0, costPct: 0, trafficPct: 0 },
        googleMapsUrl: buildGoogleMapsUrl(origin, dest),
        tradeoffInfo: { templateKey: 'overall', params: { route: routeLetter } }
      });
    });
  }

  // Route Scoring (Section 6.2)
  const times = routeCandidates.map((r) => r.travelTimeHours);
  const costs = routeCandidates.map((r) => r.transportCostInr);
  const losses = routeCandidates.map((r) => r.expectedLossInr);

  const minT = Math.min(...times), maxT = Math.max(...times);
  const minC = Math.min(...costs), maxC = Math.max(...costs);
  const minL = Math.min(...losses), maxL = Math.max(...losses);

  const wTime = crop.weights.time;
  const wCost = crop.weights.cost;
  const wLoss = crop.weights.spoilage;

  routeCandidates.forEach((r) => {
    const nTime = maxT > minT ? (r.travelTimeHours - minT) / (maxT - minT) : 0;
    const nCost = maxC > minC ? (r.transportCostInr - minC) / (maxC - minC) : 0;
    const nLoss = maxL > minL ? (r.expectedLossInr - minL) / (maxL - minL) : 0;

    const penalty = wTime * nTime + wCost * nCost + wLoss * nLoss;
    r.score = Math.round(Math.max(20, Math.min(99, 100 * (1 - penalty))));

    r.weightsBreakdown = {
      timePct: Math.round(wTime * (1 - nTime) * 100),
      spoilagePct: Math.round(wLoss * (1 - nLoss) * 100),
      costPct: Math.round(wCost * (1 - nCost) * 100),
      trafficPct: Math.round(crop.weights.traffic * 80)
    };
  });

  // Sort descending by score
  routeCandidates.sort((a, b) => b.score - a.score);
  const recommendedRoute = routeCandidates[0];
  const cheapestRoute = [...routeCandidates].sort((a, b) => a.transportCostInr - b.transportCostInr)[0];

  // Configure tradeoffInfo
  if (recommendedRoute.id !== cheapestRoute.id) {
    const extraCost = recommendedRoute.transportCostInr - cheapestRoute.transportCostInr;
    const lossSaved = cheapestRoute.expectedLossInr - recommendedRoute.expectedLossInr;
    const timeSavedMin = Math.round((cheapestRoute.travelTimeHours - recommendedRoute.travelTimeHours) * 60);

    if (lossSaved > 0 && timeSavedMin > 0) {
      recommendedRoute.tradeoffInfo = {
        templateKey: 'savings',
        params: {
          route: recommendedRoute.id,
          extraCost: `₹${extraCost.toLocaleString()}`,
          lossSaved: `₹${lossSaved.toLocaleString()}`,
          timeSaved: timeSavedMin
        }
      };
    } else if (lossSaved > 0) {
      recommendedRoute.tradeoffInfo = {
        templateKey: 'loss',
        params: {
          route: recommendedRoute.id,
          lossSaved: `₹${lossSaved.toLocaleString()}`,
          extraCost: `₹${extraCost.toLocaleString()}`
        }
      };
    } else {
      recommendedRoute.tradeoffInfo = {
        templateKey: 'overall',
        params: {
          route: recommendedRoute.id,
          cost: `₹${recommendedRoute.totalEconomicCostInr.toLocaleString()}`,
          crop: crop.name
        }
      };
    }
  } else {
    recommendedRoute.tradeoffInfo = {
      templateKey: 'cheapest',
      params: {
        route: recommendedRoute.id,
        cost: `₹${recommendedRoute.transportCostInr.toLocaleString()}`,
        spoilage: parseFloat((recommendedRoute.spoilageFraction * 100).toFixed(1))
      }
    };
  }

  const shipmentId = `shp_${Date.now().toString(36)}`;

  return {
    shipmentId,
    timestamp: new Date().toISOString(),
    origin,
    destination: dest,
    cropId,
    totalKg,
    truckCapacityKg,
    trucksNeeded,
    fullTrucks,
    lastTruckLoad,
    truckAllocations,
    recommendedRouteId: recommendedRoute.id,
    routes: routeCandidates,
    dataSource: routeCandidates[0]?.data_source || 'osrm_estimated',
    trafficIsLive: routeCandidates[0]?.traffic_is_live || false,
    assumptions: {
      cropBaseRate: crop.base_rate,
      effectiveK: Math.round(k * 10000) / 10000,
      fuelPriceInr: settings.fuel_price_inr,
      trafficMultiplier
    }
  };
}
