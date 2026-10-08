import React, { useState } from 'react';
import { Truck, Layers, MapPin, CheckCircle, Navigation, Play, AlertCircle } from 'lucide-react';
import { Language, translations } from '../i18n/locales.ts';
import marketsData from '../data/markets.json';

interface FarmNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  quantity_kg: number;
}

interface TruckResource {
  id: string;
  name: string;
  capacity_kg: number;
}

interface VrpAssignment {
  truck_id: string;
  truck_name: string;
  capacity_kg: number;
  load_kg: number;
  utilization_pct: number;
  stops: string[];
  distance_km: number;
}

interface VrpPlannerProps {
  lang: Language;
}

export const VrpPlanner: React.FC<VrpPlannerProps> = ({ lang }) => {
  const t = translations[lang];

  // Demo farms in Pollachi/Coimbatore belt
  const [farms, setFarms] = useState<FarmNode[]>([
    { id: 'f1', name: 'Farm 1 (Pollachi East)', lat: 10.6586, lng: 77.0087, quantity_kg: 3800 },
    { id: 'f2', name: 'Farm 2 (Anaimalai Valley)', lat: 10.5847, lng: 76.9324, quantity_kg: 2800 },
    { id: 'f3', name: 'Farm 3 (Negamam Belt)', lat: 10.7482, lng: 77.1085, quantity_kg: 2200 },
    { id: 'f4', name: 'Farm 4 (Kinathukadavu)', lat: 10.8228, lng: 76.9964, quantity_kg: 3200 },
  ]);

  const [trucks, setTrucks] = useState<TruckResource[]>([
    { id: 'trk1', name: 'Truck A (Eicher 6-Wheeler)', capacity_kg: 7500 },
    { id: 'trk2', name: 'Truck B (Tata 407)', capacity_kg: 3500 },
    { id: 'trk3', name: 'Truck C (Tata 407)', capacity_kg: 3500 },
  ]);

  const [market, setMarket] = useState(marketsData.markets[0]);
  const [isSolving, setIsSolving] = useState(false);
  const [solution, setSolution] = useState<{
    total_distance_km: number;
    assignments: VrpAssignment[];
  } | null>(null);

  const totalHarvest = farms.reduce((sum, f) => sum + f.quantity_kg, 0);
  const totalFleetCap = trucks.reduce((sum, t) => sum + t.capacity_kg, 0);

  const handleSolve = async () => {
    setIsSolving(true);
    try {
      const res = await fetch('/api/shipments/vrp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop_id: 'tomato',
          market: { name: market.name, lat: market.lat, lng: market.lng },
          farms,
          trucks,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSolution(data);
      }
    } catch {
      // ignore
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900">{t.vrpTitle}</h2>
            <span className="text-[11px] font-semibold bg-blue-100 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
              OR-Tools VRP Solver
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {t.vrpDesc}
          </p>
        </div>

        <button
          onClick={handleSolve}
          disabled={isSolving || totalHarvest > totalFleetCap}
          className="bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 disabled:bg-stone-300 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-xs transition-colors"
        >
          {isSolving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>{t.solveVrpBtn}</span>
        </button>
      </div>

      {/* Fleet Capacity vs Harvest Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-stone-50 p-3.5 rounded-lg border border-stone-200">
          <div className="text-xs text-stone-500 font-medium">Aggregated Produce (4 Farms)</div>
          <div className="text-lg font-extrabold text-stone-900 mt-0.5">
            {totalHarvest.toLocaleString()} kg
          </div>
          <div className="text-[11px] text-stone-600 mt-1">
            4 local regional farm pick-ups
          </div>
        </div>

        <div className="bg-stone-50 p-3.5 rounded-lg border border-stone-200">
          <div className="text-xs text-stone-500 font-medium">Total Fleet Capacity (3 Trucks)</div>
          <div className="text-lg font-extrabold text-stone-900 mt-0.5">
            {totalFleetCap.toLocaleString()} kg
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            {(totalFleetCap - totalHarvest).toLocaleString()} kg buffer headroom
          </div>
        </div>

        <div className="bg-stone-50 p-3.5 rounded-lg border border-stone-200">
          <div className="text-xs text-stone-500 font-medium">Consolidated Terminal</div>
          <div className="text-sm font-extrabold text-stone-900 mt-1 truncate">
            {market.name}
          </div>
          <div className="text-[11px] text-stone-600 mt-1">
            Coimbatore Wholesale Hub
          </div>
        </div>
      </div>

      {/* Farms and Fleet Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Farm Nodes */}
        <div className="space-y-2">
          <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <span>Farm Pickup Points</span>
          </h3>
          <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg overflow-hidden text-xs">
            {farms.map((farm) => (
              <div key={farm.id} className="p-2.5 flex items-center justify-between bg-white hover:bg-stone-50">
                <div>
                  <div className="font-bold text-stone-900">{farm.name}</div>
                  <div className="text-[10px] text-stone-400">{farm.lat.toFixed(4)}, {farm.lng.toFixed(4)}</div>
                </div>
                <div className="font-semibold text-stone-800 bg-stone-100 px-2.5 py-1 rounded">
                  {farm.quantity_kg.toLocaleString()} kg
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Truck Fleet */}
        <div className="space-y-2">
          <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-emerald-700" />
            <span>Available Vehicle Fleet</span>
          </h3>
          <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg overflow-hidden text-xs">
            {trucks.map((trk) => (
              <div key={trk.id} className="p-2.5 flex items-center justify-between bg-white hover:bg-stone-50">
                <div>
                  <div className="font-bold text-stone-900">{trk.name}</div>
                  <div className="text-[10px] text-stone-500">Commercial Carrier</div>
                </div>
                <div className="font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                  {trk.capacity_kg.toLocaleString()} kg payload
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Solution Results */}
      {solution && (
        <div className="mt-6 pt-5 border-t border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-700" />
              <span>Optimized Multi-Truck Allocation Schedule</span>
            </h3>
            <span className="text-xs bg-stone-100 border border-stone-300 font-bold px-2.5 py-1 rounded text-stone-800">
              Total Fleet Route: <strong>{solution.total_distance_km} km</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {solution.assignments.map((assignment, idx) => (
              <div
                key={idx}
                className="bg-stone-50 rounded-xl p-4 border border-stone-200 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-stone-900">{assignment.truck_name}</div>
                  <span className="text-xs font-semibold text-stone-600 bg-white border border-stone-200 px-2 py-0.5 rounded">
                    {assignment.distance_km} km
                  </span>
                </div>

                {/* Utilization Progress Bar */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-medium text-stone-600">
                    <span>Load: {assignment.load_kg.toLocaleString()} kg</span>
                    <span>Cap: {assignment.capacity_kg.toLocaleString()} kg ({assignment.utilization_pct}%)</span>
                  </div>
                  <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, assignment.utilization_pct)}%` }}
                      className={`h-full ${
                        assignment.utilization_pct > 95
                          ? 'bg-amber-600'
                          : assignment.utilization_pct > 0
                          ? 'bg-emerald-700'
                          : 'bg-stone-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Ordered Stops */}
                <div className="pt-1">
                  <div className="text-[11px] font-bold uppercase text-stone-500 mb-1">Assigned Stops Sequence:</div>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-stone-800">
                    {assignment.stops.map((stop, sIdx) => (
                      <li key={sIdx} className="truncate" title={stop}>
                        {stop}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
