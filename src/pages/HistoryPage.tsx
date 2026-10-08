import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, ArrowRight, Truck } from 'lucide-react';
import { ShipmentPlanResult } from '../services/realRoadRouter.ts';
import { formatCurrency, formatNumber, formatLocalizedDateTime, getLocalizedRouteLetter } from '../i18n/index.ts';
import cropsData from '../data/crops.json' with { type: 'json' };

interface HistoryPageProps {
  history: ShipmentPlanResult[];
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ history }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [dateFilter, setDateFilter] = useState<string>('all');

  // Filter history by date if selected
  const filteredHistory = history.filter((item) => {
    if (dateFilter === 'all') return true;
    return item.timestamp.includes(dateFilter);
  });

  const getLocalizedCropName = (cropId: string) => {
    const c = cropsData.crops.find((item) => item.id === cropId);
    if (i18n.language === 'ta' && c?.name_ta) return c.name_ta;
    if (i18n.language === 'hi' && c?.name_hi) return c.name_hi;
    return c?.name || cropId;
  };

  // Export to CSV with UTF-8 BOM and localized headers (Part 1.2)
  const handleExportCsv = () => {
    const headers = [
      t('history.table.date'),
      t('history.table.crop'),
      `${t('history.table.quantity')} (${t('units.kg')})`,
      t('history.table.trucks'),
      t('history.table.origin'),
      t('history.table.destination'),
      t('history.table.route'),
      t('history.table.totalCost')
    ];

    const rows = filteredHistory.map((item) => {
      const best = item.routes.find((r) => r.id === item.recommendedRouteId) || item.routes[0];
      const corridorName = t(`corridors.${best.corridorKey}`);
      const routeTitle = t('corridors.corridorPrefix', {
        letter: getLocalizedRouteLetter(best.id, i18n.language),
        name: corridorName
      });
      const cropName = getLocalizedCropName(item.cropId);
      const originName = i18n.language === 'ta' && item.origin.name_ta ? item.origin.name_ta : item.origin.name;
      const destName = i18n.language === 'ta' && item.destination.name_ta ? item.destination.name_ta : item.destination.name;

      return [
        `"${formatLocalizedDateTime(item.timestamp, i18n.language)}"`,
        `"${cropName}"`,
        item.totalKg,
        item.trucksNeeded,
        `"${originName}"`,
        `"${destName}"`,
        `"${routeTitle}"`,
        `"₹${best.totalEconomicCostInr}"`
      ].join(',');
    });

    // UTF-8 BOM (\uFEFF) ensures Excel renders Tamil and Hindi characters properly
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `marudhamx_shipments_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {t('history.title')}
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            {t('history.subtitle')}
          </p>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t('history.exportCsv')}</span>
            </button>
          </div>
        )}
      </div>

      {history.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4 max-w-lg mx-auto shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center mx-auto text-stone-500">
            <Truck className="w-6 h-6 text-stone-400" />
          </div>
          <h2 className="text-lg font-bold text-stone-900">{t('history.emptyTitle')}</h2>
          <p className="text-xs text-stone-500">
            {t('history.subtitle')}
          </p>
          <button
            type="button"
            onClick={() => navigate('/plan')}
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
          >
            <span>{t('history.emptyAction')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* History Table */
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-800" role="table">
              <thead className="bg-stone-100 text-stone-700 uppercase tracking-wider font-bold border-b border-stone-200 text-[11px]">
                <tr>
                  <th scope="col" className="p-3.5">{t('history.table.date')}</th>
                  <th scope="col" className="p-3.5">{t('history.table.crop')}</th>
                  <th scope="col" className="p-3.5">{t('history.table.quantity')}</th>
                  <th scope="col" className="p-3.5">{t('history.table.trucks')}</th>
                  <th scope="col" className="p-3.5">{t('history.table.origin')}</th>
                  <th scope="col" className="p-3.5">{t('history.table.destination')}</th>
                  <th scope="col" className="p-3.5">{t('history.table.route')}</th>
                  <th scope="col" className="p-3.5 text-right">{t('history.table.totalCost')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredHistory.map((item) => {
                  const best = item.routes.find((r) => r.id === item.recommendedRouteId) || item.routes[0];
                  const corridorName = t(`corridors.${best.corridorKey}`);
                  const routeTitle = t('corridors.corridorPrefix', {
                    letter: getLocalizedRouteLetter(best.id, i18n.language),
                    name: corridorName
                  });
                  const originName = i18n.language === 'ta' && item.origin.name_ta ? item.origin.name_ta : item.origin.name;
                  const destName = i18n.language === 'ta' && item.destination.name_ta ? item.destination.name_ta : item.destination.name;

                  return (
                    <tr
                      key={item.shipmentId}
                      onClick={() => navigate(`/results/${item.shipmentId}`)}
                      className="hover:bg-stone-50 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-semibold text-stone-900">{formatLocalizedDateTime(item.timestamp, i18n.language)}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{item.shipmentId}</div>
                      </td>

                      <td className="p-3.5 font-bold text-stone-900 whitespace-nowrap">
                        {getLocalizedCropName(item.cropId)}
                      </td>

                      <td className="p-3.5 whitespace-nowrap font-medium text-stone-800">
                        {formatNumber(item.totalKg)} {t('units.kg')}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded text-[11px]">
                          {item.trucksNeeded}
                        </span>
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-stone-800 font-medium">
                        {originName}
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-stone-800 font-medium">
                        {destName}
                      </td>

                      <td className="p-3.5 max-w-xs truncate font-medium text-stone-700" title={routeTitle}>
                        {routeTitle}
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-right font-extrabold text-stone-900">
                        {formatCurrency(best.totalEconomicCostInr, i18n.language)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
