import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Award, Truck, Clock, DollarSign, ExternalLink, ChevronDown, ChevronUp, Info, ArrowLeft, Navigation, ShieldCheck } from 'lucide-react';
import { ShipmentPlanResult, SettingsState } from '../services/realRoadRouter.ts';
import { MapPicker } from '../components/MapPicker.tsx';
import { formatCurrency, formatNumber, formatLocalizedDateTime, getLocalizedRouteLetter } from '../i18n/index.ts';
import cropsData from '../data/crops.json' with { type: 'json' };

interface ResultsPageProps {
  currentResult: ShipmentPlanResult | null;
  settings: SettingsState;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ currentResult, settings }) => {
  const { t, i18n } = useTranslation();
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const navigate = useNavigate();

  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    currentResult?.recommendedRouteId || currentResult?.routes[0]?.id || 'A'
  );
  const [showSteps, setShowSteps] = useState<boolean>(false);

  if (!currentResult) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">{t('history.emptyTitle')}</h2>
        <p className="text-sm text-stone-600">{t('history.subtitle')}</p>
        <button
          onClick={() => navigate('/plan')}
          className="bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg text-sm cursor-pointer"
        >
          {t('nav.plan')}
        </button>
      </div>
    );
  }

  const bestRoute = currentResult.routes.find((r) => r.id === currentResult.recommendedRouteId) || currentResult.routes[0];
  const activeRoute = currentResult.routes.find((r) => r.id === selectedRouteId) || bestRoute;

  // Localized crop name
  const cropObj = cropsData.crops.find((c) => c.id === currentResult.cropId);
  const localizedCropName = i18n.language === 'ta' && cropObj?.name_ta
    ? cropObj.name_ta
    : i18n.language === 'hi' && cropObj?.name_hi
    ? cropObj.name_hi
    : currentResult.cropId;

  // Localized origin and destination names
  const originName = i18n.language === 'ta' && currentResult.origin.name_ta
    ? currentResult.origin.name_ta
    : currentResult.origin.name;

  const destName = i18n.language === 'ta' && currentResult.destination.name_ta
    ? currentResult.destination.name_ta
    : currentResult.destination.name;

  // Format truck summary string via translation keys
  const fullTrucksPart = currentResult.fullTrucks > 0
    ? t('results.fullTrucksPart', {
        count: currentResult.fullTrucks,
        capacity: formatNumber(currentResult.truckCapacityKg)
      })
    : '';

  const remainderTrucksPart = currentResult.lastTruckLoad > 0
    ? t('results.remainderTrucksPart', {
        load: formatNumber(currentResult.lastTruckLoad)
      })
    : '';

  const truckSummaryString = t('results.truckSummaryFormat', {
    trucks: currentResult.trucksNeeded,
    fullText: fullTrucksPart,
    remainderText: remainderTrucksPart
  });

  // Distance unit conversion
  const formatDist = (km: number) => {
    if (settings.units === 'miles') {
      const mi = Math.round(km * 0.621371 * 10) / 10;
      return `${formatNumber(mi)} ${t('units.mi')}`;
    }
    return `${formatNumber(km)} ${t('units.km')}`;
  };

  // Localized route titles
  const getLocalizedRouteTitle = (route: typeof bestRoute) => {
    const corridorName = t(`corridors.${route.corridorKey}`);
    return t('corridors.corridorPrefix', {
      letter: getLocalizedRouteLetter(route.id, i18n.language),
      name: corridorName
    });
  };

  // Localized tradeoff explanation sentence
  const getTradeoffSentence = (route: typeof bestRoute) => {
    const info = route.tradeoffInfo;
    if (!info) return '';
    return t(`results.tradeoff.${info.templateKey}`, {
      ...info.params,
      route: info.params?.route ? getLocalizedRouteLetter(info.params.route, i18n.language) : '',
      crop: localizedCropName
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation & Back */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/plan')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('results.editParameters')}</span>
        </button>

        <div className="text-xs font-mono text-stone-500">
          {currentResult.shipmentId} • {formatLocalizedDateTime(currentResult.timestamp, i18n.language)}
        </div>
      </div>

      {/* Truck Requirement Summary Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-stone-500 tracking-wider">
              {t('results.truckAllocationTitle')}
            </div>
            <div className="text-base font-extrabold text-stone-900 mt-0.5">
              {truckSummaryString}
            </div>
            <div className="text-xs text-stone-600 mt-1">
              {t('results.cropInfo', {
                crop: localizedCropName,
                totalKg: formatNumber(currentResult.totalKg)
              })}
            </div>
          </div>
        </div>

        <a
          href={activeRoute.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 flex items-center gap-2 shrink-0 transition-colors cursor-pointer"
        >
          <Navigation className="w-4 h-4 text-blue-600" />
          <span>{t('results.openInGoogleMaps')}</span>
        </a>
      </div>

      {/* Map with Candidate Routes Drawn From Real Geometry */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>{t('results.realRoadNetwork')}</span>
          </h2>
          <span className="text-xs text-stone-500">
            {t('results.realRoadNetworkSub')}
          </span>
        </div>

        <MapPicker
          currentCoords={currentResult.origin}
          destinationCoords={currentResult.destination}
          routes={currentResult.routes}
          selectedRouteId={selectedRouteId}
          recommendedRouteId={currentResult.recommendedRouteId}
          onSelectRoute={(id) => setSelectedRouteId(id)}
          trafficIsLive={currentResult.trafficIsLive}
        />
      </div>

      {/* Recommended Route Winner Feature Banner */}
      <div className="bg-emerald-950 text-emerald-50 rounded-2xl p-6 border border-emerald-900 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>{t('results.recommendedBadge')}</span>
            </span>
            <span className="text-xs text-emerald-300 font-semibold">
              {t('results.scoreLabel', { score: bestRoute.score })}
            </span>
          </div>

          <div className="text-xs text-emerald-300">
            {originName} → {destName}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            {getLocalizedRouteTitle(bestRoute)}
          </h3>
          <p className="text-sm sm:text-base text-emerald-100 mt-2 bg-emerald-900/40 p-3.5 rounded-xl border border-emerald-800/40 leading-relaxed">
            {getTradeoffSentence(bestRoute)}
          </p>
        </div>

        {/* 4 Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="bg-emerald-900/50 p-3 rounded-xl border border-emerald-800/50">
            <div className="text-emerald-300 font-medium">{t('results.expectedSpoilageLoss')}</div>
            <div className="text-base font-extrabold text-white mt-1">
              {formatCurrency(bestRoute.expectedLossInr, i18n.language)}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              {(bestRoute.spoilageFraction * 100).toFixed(1)}% ({t('results.estimatedLabel')})
            </div>
          </div>

          <div className="bg-emerald-900/50 p-3 rounded-xl border border-emerald-800/50">
            <div className="text-emerald-300 font-medium">{t('results.transportCost')}</div>
            <div className="text-base font-extrabold text-white mt-1">
              {formatCurrency(bestRoute.transportCostInr, i18n.language)}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              {t('results.fuelWearTolls')}
            </div>
          </div>

          <div className="bg-emerald-900/50 p-3 rounded-xl border border-emerald-800/50">
            <div className="text-emerald-300 font-medium">{t('results.durationDistance')}</div>
            <div className="text-base font-extrabold text-white mt-1">
              {bestRoute.duration_min} {t('units.mins')}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              {formatDist(bestRoute.distance_km)}
            </div>
          </div>

          <div className="bg-emerald-900/50 p-3 rounded-xl border border-emerald-800/50">
            <div className="text-emerald-300 font-medium">{t('results.totalEconomicCost')}</div>
            <div className="text-base font-extrabold text-white mt-1">
              {formatCurrency(bestRoute.totalEconomicCostInr, i18n.language)}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              {t('results.transportSpoilage')}
            </div>
          </div>
        </div>
      </div>

      {/* Route Comparison Table (Part 1 & 2) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900">
            {t('results.candidateRoutesTitle')}
          </h3>
          <span className="text-xs text-stone-500">
            {t('results.keyboardHelp')}
          </span>
        </div>

        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left text-xs text-stone-800" role="table">
            <thead className="bg-stone-100 text-stone-700 uppercase tracking-wider font-bold border-b border-stone-200 text-[11px]">
              <tr>
                <th scope="col" className="p-3">{t('results.comparisonTable.route')}</th>
                <th scope="col" className="p-3">{t('results.comparisonTable.distance')}</th>
                <th scope="col" className="p-3">{t('results.comparisonTable.time')}</th>
                <th scope="col" className="p-3">{t('results.comparisonTable.trafficDelay')}</th>
                <th scope="col" className="p-3">{t('results.comparisonTable.dataSource')}</th>
                <th scope="col" className="p-3">{t('results.comparisonTable.transportCost')}</th>
                <th scope="col" className="p-3">{t('results.comparisonTable.spoilage')}</th>
                <th scope="col" className="p-3">{t('results.comparisonTable.expectedLoss')}</th>
                <th scope="col" className="p-3">{t('results.comparisonTable.totalCost')}</th>
                <th scope="col" className="p-3 text-right">{t('results.comparisonTable.score')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {currentResult.routes.map((route) => {
                const isWinner = route.id === currentResult.recommendedRouteId;
                const isSelected = route.id === selectedRouteId;

                return (
                  <tr
                    key={route.id}
                    tabIndex={0}
                    onClick={() => setSelectedRouteId(route.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSelectedRouteId(route.id);
                    }}
                    className={`cursor-pointer transition-colors focus:outline-hidden focus:bg-emerald-50 ${
                      isSelected ? 'bg-emerald-50/80 font-medium' : 'hover:bg-stone-50'
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isWinner ? 'bg-emerald-600' : 'bg-stone-400'}`} />
                        <div>
                          <span className="font-bold text-stone-900">{getLocalizedRouteTitle(route)}</span>
                          {isWinner && (
                            <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                              {t('results.recommendedBadge')}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {formatDist(route.distance_km)}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <div>{route.duration_min} {t('units.mins')}</div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <span className="font-medium text-stone-700">
                        {t('results.trafficDelayLabel', { mins: route.traffic_delay_min })}
                      </span>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <span className="text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200 font-semibold">
                        {t(`traffic.sources.${route.data_source}`)}
                      </span>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {formatCurrency(route.transportCostInr, i18n.language)}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <span>{(route.spoilageFraction * 100).toFixed(1)}%</span>
                      <span className="text-[10px] text-stone-500 ml-1">({t('results.estimatedLabel')})</span>
                    </td>

                    <td className="p-3 whitespace-nowrap text-amber-900 font-bold">
                      {formatCurrency(route.expectedLossInr, i18n.language)}
                    </td>

                    <td className="p-3 whitespace-nowrap font-extrabold text-stone-900">
                      {formatCurrency(route.totalEconomicCostInr, i18n.language)}
                    </td>

                    <td className="p-3 whitespace-nowrap text-right">
                      <span className={`font-extrabold px-2 py-1 rounded text-xs ${
                        isWinner ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-800'
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

      {/* "Why this route?" Panel with Stacked Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900">
            {t('results.whyThisRoute')}
          </h3>
          <span className="text-xs bg-emerald-100 text-emerald-900 font-semibold px-2 py-0.5 rounded-full border border-emerald-300">
            {getLocalizedRouteTitle(activeRoute)}
          </span>
        </div>

        {/* Labeled Horizontal Stacked Bar */}
        <div className="space-y-2">
          <div className="h-7 w-full rounded-lg overflow-hidden flex bg-stone-200 text-white text-[11px] font-bold">
            <div
              style={{ width: `${Math.max(12, activeRoute.weightsBreakdown.spoilagePct)}%` }}
              className="bg-emerald-700 flex items-center justify-center px-1 truncate"
            >
              {activeRoute.weightsBreakdown.spoilagePct}%
            </div>
            <div
              style={{ width: `${Math.max(12, activeRoute.weightsBreakdown.timePct)}%` }}
              className="bg-blue-700 flex items-center justify-center px-1 truncate"
            >
              {activeRoute.weightsBreakdown.timePct}%
            </div>
            <div
              style={{ width: `${Math.max(12, activeRoute.weightsBreakdown.costPct)}%` }}
              className="bg-amber-600 flex items-center justify-center px-1 truncate"
            >
              {activeRoute.weightsBreakdown.costPct}%
            </div>
            <div
              style={{ width: `${Math.max(8, activeRoute.weightsBreakdown.trafficPct)}%` }}
              className="bg-stone-600 flex items-center justify-center px-1 truncate"
            >
              {activeRoute.weightsBreakdown.trafficPct}%
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-stone-700 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-700"></span>
              <span>{t('results.breakdown.spoilage')} (<strong>{activeRoute.weightsBreakdown.spoilagePct}%</strong>)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-blue-700"></span>
              <span>{t('results.breakdown.time')} (<strong>{activeRoute.weightsBreakdown.timePct}%</strong>)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-600"></span>
              <span>{t('results.breakdown.cost')} (<strong>{activeRoute.weightsBreakdown.costPct}%</strong>)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-stone-600"></span>
              <span>{t('results.breakdown.traffic')} (<strong>{activeRoute.weightsBreakdown.trafficPct}%</strong>)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Assumptions Panel with Link to Settings */}
      <div className="bg-stone-50 rounded-2xl border border-stone-200 p-6 space-y-3 text-xs text-stone-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-800" />
            <h4 className="font-bold text-sm text-stone-900">{t('results.assumptions.title')}</h4>
          </div>
          <Link
            to="/settings"
            className="text-emerald-800 hover:text-emerald-950 font-bold underline text-xs"
          >
            {t('results.assumptions.editLink')} →
          </Link>
        </div>

        <p className="text-stone-600">{t('results.assumptions.notice')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-white p-3 rounded-xl border border-stone-200">
            <div className="text-stone-500 font-medium">{t('results.assumptions.decayParam')}</div>
            <div className="font-bold text-stone-900 mt-0.5">
              {t('results.assumptions.decayParamFormat', {
                val: currentResult.assumptions.effectiveK,
                unit: t('units.hrs')
              })}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-stone-200">
            <div className="text-stone-500 font-medium">{t('results.assumptions.fuelPrice')}</div>
            <div className="font-bold text-stone-900 mt-0.5">
              ₹{currentResult.assumptions.fuelPriceInr} / {t('units.litre')}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-stone-200">
            <div className="text-stone-500 font-medium">{t('results.assumptions.trafficFactor')}</div>
            <div className="font-bold text-stone-900 mt-0.5">
              {currentResult.assumptions.trafficMultiplier}× ({t('results.estimatedLabel')})
            </div>
          </div>
        </div>
      </div>

      {/* Turn-by-Turn Steps Expandable List */}
      {activeRoute.steps && activeRoute.steps.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSteps(!showSteps)}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <div>
              <h4 className="font-bold text-sm text-stone-900">{t('results.turnByTurn')}</h4>
              <p className="text-xs text-stone-500 mt-0.5">
                {t('results.stepsCount', {
                  count: activeRoute.steps.length,
                  route: getLocalizedRouteLetter(activeRoute.id, i18n.language)
                })}
              </p>
            </div>
            {showSteps ? <ChevronUp className="w-5 h-5 text-stone-500" /> : <ChevronDown className="w-5 h-5 text-stone-500" />}
          </button>

          {showSteps && (
            <div className="p-5 pt-0 border-t border-stone-100 max-h-80 overflow-y-auto divide-y divide-stone-100 text-xs">
              {activeRoute.steps.map((st, sIdx) => (
                <div key={sIdx} className="py-2.5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center font-bold text-[10px] text-stone-600 shrink-0">
                      {sIdx + 1}
                    </span>
                    <div>
                      <div className="font-medium text-stone-900">{st.instruction}</div>
                      <div className="text-stone-500 text-[11px]">{st.roadName}</div>
                    </div>
                  </div>
                  <div className="text-stone-500 text-right shrink-0">
                    {Math.round(st.distanceMeters / 100) / 10} {t('units.km')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
