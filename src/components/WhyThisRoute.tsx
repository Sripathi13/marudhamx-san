import React, { useState } from 'react';
import { RouteOption } from '../services/optimizerEngine.ts';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface WhyThisRouteProps {
  route: RouteOption;
  cropName: string;
}

export const WhyThisRoute: React.FC<WhyThisRouteProps> = ({ route, cropName }) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const breakdown = route.weights_breakdown || {
    time_impact_pct: 35,
    spoilage_savings_pct: 35,
    cost_efficiency_pct: 20,
    traffic_smoothness_pct: 10,
  };

  return (
    <div className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-stone-100/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-stone-900">Why this route? (Score Breakdown)</span>
          <span className="text-xs bg-emerald-100 text-emerald-900 font-semibold px-2 py-0.5 rounded-full border border-emerald-300">
            Score: {route.score}/100
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-stone-500 font-medium">
          <span>{isOpen ? 'Collapse' : 'Expand'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 pt-1 border-t border-stone-200/60 space-y-3 text-xs text-stone-700">
          <p className="text-stone-600">
            Dijkstra evaluated this path against alternative corridors by dynamically weighting travel time, produce respiration loss, fuel, and road traffic penalties tailored for <strong>{cropName}</strong>:
          </p>

          {/* Horizontal Stacked Bar Chart */}
          <div className="space-y-1.5">
            <div className="h-6 w-full rounded-md overflow-hidden flex bg-stone-200 text-white text-[11px] font-bold">
              <div
                style={{ width: `${Math.max(10, breakdown.spoilage_savings_pct)}%` }}
                className="bg-emerald-700 flex items-center justify-center truncate px-1"
                title={`Spoilage Savings: ${breakdown.spoilage_savings_pct}%`}
              >
                Loss: {breakdown.spoilage_savings_pct}%
              </div>
              <div
                style={{ width: `${Math.max(10, breakdown.time_impact_pct)}%` }}
                className="bg-blue-700 flex items-center justify-center truncate px-1"
                title={`Transit Speed: ${breakdown.time_impact_pct}%`}
              >
                Time: {breakdown.time_impact_pct}%
              </div>
              <div
                style={{ width: `${Math.max(10, breakdown.cost_efficiency_pct)}%` }}
                className="bg-amber-600 flex items-center justify-center truncate px-1"
                title={`Cost Efficiency: ${breakdown.cost_efficiency_pct}%`}
              >
                Cost: {breakdown.cost_efficiency_pct}%
              </div>
              <div
                style={{ width: `${Math.max(5, breakdown.traffic_smoothness_pct)}%` }}
                className="bg-stone-600 flex items-center justify-center truncate px-1"
                title={`Flow Smoothness: ${breakdown.traffic_smoothness_pct}%`}
              >
                Flow: {breakdown.traffic_smoothness_pct}%
              </div>
            </div>

            {/* Legend & Breakdown values */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-700"></span>
                <span>Spoilage Mitigation (<strong>{breakdown.spoilage_savings_pct}%</strong>)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-blue-700"></span>
                <span>Transit Velocity (<strong>{breakdown.time_impact_pct}%</strong>)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-amber-600"></span>
                <span>Transport Efficiency (<strong>{breakdown.cost_efficiency_pct}%</strong>)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-stone-600"></span>
                <span>Traffic Flow (<strong>{breakdown.traffic_smoothness_pct}%</strong>)</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-stone-200 text-stone-600 text-[11px] leading-relaxed">
            <strong>Key Decision Driver:</strong> For crops with high moisture and respiration decay, bypassing town choke points on an expressway reduces cellular breakdown and preserves fresh market grade, even when toll tariffs are higher.
          </div>
        </div>
      )}
    </div>
  );
};
