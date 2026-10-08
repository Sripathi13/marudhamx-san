import React, { useState } from 'react';
import { Award, Clock, DollarSign, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, Info, HelpCircle } from 'lucide-react';
import { Language, translations } from '../i18n/locales.ts';
import { OptimizeResult, RouteOption } from '../services/optimizerEngine.ts';
import { WhyThisRoute } from './WhyThisRoute.tsx';
import { AssumptionsModal } from './AssumptionsModal.tsx';

interface ResultsPanelProps {
  lang: Language;
  result: OptimizeResult;
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  lang,
  result,
  selectedRouteId,
  onSelectRoute,
}) => {
  const t = translations[lang];
  const [showAssumptionsModal, setShowAssumptionsModal] = useState<boolean>(false);

  const bestRoute = result.routes.find((r) => r.id === result.recommended_route_id) || result.routes[0];
  const activeRoute = result.routes.find((r) => r.id === selectedRouteId) || bestRoute;

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 sm:p-6 space-y-6">
      {/* Recommended Route Feature Card (Part E3 & Quick Reference) */}
      <div className="bg-emerald-950 text-emerald-50 rounded-xl p-5 border border-emerald-900 shadow-sm relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-800/60">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>{t.recommendedBadge}</span>
            </span>
            <span className="text-xs text-emerald-300 font-semibold">
              Score: <strong>{bestRoute.score}/100</strong>
            </span>
          </div>

          <button
            onClick={() => setShowAssumptionsModal(true)}
            className="text-xs text-emerald-300 hover:text-white flex items-center gap-1 font-medium underline underline-offset-2"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Assumptions & Model</span>
          </button>
        </div>

        {/* Route Name & One-Sentence Trade-off Pitch */}
        <div className="mt-3.5 space-y-2">
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {bestRoute.name}
          </h3>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed bg-emerald-900/40 p-3 rounded-lg border border-emerald-800/40">
            {result.explanation}
          </p>
        </div>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-emerald-900/60 text-xs">
          <div className="bg-emerald-900/50 p-2.5 rounded-lg border border-emerald-800/50">
            <div className="text-emerald-300 font-medium">Expected Loss</div>
            <div className="text-base font-extrabold text-white mt-0.5">
              ₹{bestRoute.expected_loss_inr.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              Spoilage: {(bestRoute.spoilage_fraction * 100).toFixed(1)}% <span className="opacity-80">({t.estimatedBadge})</span>
            </div>
          </div>

          <div className="bg-emerald-900/50 p-2.5 rounded-lg border border-emerald-800/50">
            <div className="text-emerald-300 font-medium">Transport Cost</div>
            <div className="text-base font-extrabold text-white mt-0.5">
              ₹{bestRoute.transport_cost_inr.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              Fuel + Wear + Tolls
            </div>
          </div>

          <div className="bg-emerald-900/50 p-2.5 rounded-lg border border-emerald-800/50">
            <div className="text-emerald-300 font-medium">Duration & ETA</div>
            <div className="text-base font-extrabold text-white mt-0.5">
              {bestRoute.travel_time_hours} hrs
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              {bestRoute.eta_minutes} mins total
            </div>
          </div>

          <div className="bg-emerald-900/50 p-2.5 rounded-lg border border-emerald-800/50">
            <div className="text-emerald-300 font-medium">Total Economic Cost</div>
            <div className="text-base font-extrabold text-white mt-0.5">
              ₹{bestRoute.total_economic_cost_inr.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              Transport + Loss
            </div>
          </div>
        </div>
      </div>

      {/* Route Comparison Table (Part E3) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-base text-stone-900">{t.routeComparison}</h4>
          <span className="text-xs text-stone-500">
            Click any row to display and trace on the map
          </span>
        </div>

        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left text-xs text-stone-800">
            <thead className="bg-stone-100 text-stone-700 uppercase tracking-wider font-bold border-b border-stone-200 text-[11px]">
              <tr>
                <th className="p-3">{t.colRoute}</th>
                <th className="p-3">{t.colDistance}</th>
                <th className="p-3">{t.colTime}</th>
                <th className="p-3">{t.colTransportCost}</th>
                <th className="p-3">{t.colSpoilage}</th>
                <th className="p-3">{t.colExpectedLoss}</th>
                <th className="p-3">{t.colTotalLoss}</th>
                <th className="p-3 text-right">{t.colScore}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {result.routes.map((route) => {
                const isSelected = route.id === selectedRouteId;
                const isWinner = route.id === result.recommended_route_id;

                return (
                  <tr
                    key={route.id}
                    onClick={() => onSelectRoute(route.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/80 font-medium'
                        : 'hover:bg-stone-50'
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isWinner ? 'bg-emerald-600' : 'bg-stone-400'}`} />
                        <div>
                          <div className="font-bold text-stone-900 flex items-center gap-1.5">
                            <span>{route.name}</span>
                            {isWinner && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-300">
                                Best
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            Via: {route.stops.slice(1, -1).join(' → ') || 'Direct Link'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <strong className="text-stone-900">{route.distance_km}</strong> km
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <div>
                        <strong className="text-stone-900">{route.travel_time_hours}</strong> h ({route.eta_minutes}m)
                      </div>
                      <span className="text-[10px] text-stone-500">
                        Traffic: {route.traffic_level} <span className="opacity-75">({t.estimatedBadge})</span>
                      </span>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <div>₹<strong>{route.transport_cost_inr.toLocaleString()}</strong></div>
                      <div className="text-[10px] text-stone-500">
                        Tolls: ₹{route.toll_cost_inr}
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="font-bold">{(route.spoilage_fraction * 100).toFixed(1)}%</span>
                        <span className="text-[10px] text-stone-500">({t.estimatedBadge})</span>
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap text-amber-900 font-semibold">
                      ₹{route.expected_loss_inr.toLocaleString()}
                    </td>

                    <td className="p-3 whitespace-nowrap font-bold text-stone-900">
                      ₹{route.total_economic_cost_inr.toLocaleString()}
                    </td>

                    <td className="p-3 whitespace-nowrap text-right">
                      <span className={`inline-block font-extrabold px-2 py-1 rounded text-xs ${
                        isWinner
                          ? 'bg-emerald-700 text-white'
                          : 'bg-stone-200 text-stone-800'
                      }`}>
                        {route.score}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* "Why this route?" expandable component (Part E3) */}
      <WhyThisRoute route={activeRoute} cropName={result.crop.name} />

      {/* Assumptions Modal */}
      <AssumptionsModal
        isOpen={showAssumptionsModal}
        onClose={() => setShowAssumptionsModal(false)}
        assumptions={result.assumptions}
      />
    </div>
  );
};
