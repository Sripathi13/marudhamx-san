import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Check, Clock, TrendingUp } from 'lucide-react';
import { Language, translations } from '../i18n/locales.ts';

interface HistoryItem {
  id: string;
  timestamp: string;
  crop_name: string;
  quantity_kg: number;
  origin_name: string;
  dest_name: string;
  recommended_route: string;
  transport_cost_inr: number;
  expected_loss_inr: number;
  total_economic_cost_inr: number;
  actual_loss_inr?: number | null;
}

interface ShipmentHistoryProps {
  lang: Language;
}

export const ShipmentHistory: React.FC<ShipmentHistoryProps> = ({ lang }) => {
  const t = translations[lang];
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actualInput, setActualInput] = useState<string>('');

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/shipments/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSaveActualLoss = async (id: string) => {
    if (!actualInput) return;
    try {
      await fetch('/api/shipments/actual-loss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, actual_loss_inr: Number(actualInput) }),
      });
      setEditingId(null);
      setActualInput('');
      fetchHistory();
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-bold text-stone-900">{t.historyTitle}</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Audit historical shipments and benchmark algorithmic expected decay against actual recorded field loss.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            className="p-2 border border-stone-300 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            title="Refresh history"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <a
            href="/api/shipments/export"
            download="agriroute_shipments.csv"
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{t.exportCsv}</span>
          </a>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 text-stone-500 text-sm">
          {t.noHistory}
        </div>
      ) : (
        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left text-xs text-stone-800">
            <thead className="bg-stone-100 text-stone-700 uppercase tracking-wider font-bold border-b border-stone-200 text-[11px]">
              <tr>
                <th className="p-3">Shipment Date / ID</th>
                <th className="p-3">Crop & Payload</th>
                <th className="p-3">Origin → Market</th>
                <th className="p-3">Optimal Route</th>
                <th className="p-3">Transport Cost</th>
                <th className="p-3">Expected Loss</th>
                <th className="p-3">Actual Loss (Recorded)</th>
                <th className="p-3 text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {history.map((item) => {
                const hasActual = item.actual_loss_inr !== null && item.actual_loss_inr !== undefined;
                const diff = hasActual ? Number(item.actual_loss_inr) - item.expected_loss_inr : null;

                return (
                  <tr key={item.id} className="hover:bg-stone-50">
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-semibold text-stone-900">{item.timestamp}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{item.id}</div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <div className="font-bold text-stone-900">{item.crop_name}</div>
                      <div className="text-stone-500">{item.quantity_kg.toLocaleString()} kg</div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <div className="text-stone-900 font-medium">{item.origin_name}</div>
                      <div className="text-[11px] text-stone-500">→ {item.dest_name}</div>
                    </td>

                    <td className="p-3 max-w-xs">
                      <div className="font-medium text-stone-900 truncate" title={item.recommended_route}>
                        {item.recommended_route}
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      ₹{item.transport_cost_inr.toLocaleString()}
                    </td>

                    <td className="p-3 whitespace-nowrap font-semibold text-amber-900">
                      ₹{item.expected_loss_inr.toLocaleString()}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            placeholder="₹ Loss"
                            value={actualInput}
                            onChange={(e) => setActualInput(e.target.value)}
                            className="w-20 px-2 py-1 text-xs border border-stone-300 rounded"
                          />
                          <button
                            onClick={() => handleSaveActualLoss(item.id)}
                            className="p-1 bg-emerald-700 text-white rounded hover:bg-emerald-800"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : hasActual ? (
                        <div className="font-bold text-stone-900">
                          ₹{Number(item.actual_loss_inr).toLocaleString()}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setActualInput('');
                          }}
                          className="text-emerald-800 hover:text-emerald-950 font-semibold underline text-[11px]"
                        >
                          + Record Actual
                        </button>
                      )}
                    </td>

                    <td className="p-3 whitespace-nowrap text-right">
                      {diff !== null ? (
                        <span className={`inline-block font-bold text-xs ${
                          Math.abs(diff) < 300 ? 'text-emerald-700' : diff > 0 ? 'text-red-700' : 'text-blue-700'
                        }`}>
                          {diff > 0 ? `+₹${diff.toLocaleString()}` : `-₹${Math.abs(diff).toLocaleString()}`}
                        </span>
                      ) : (
                        <span className="text-stone-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
