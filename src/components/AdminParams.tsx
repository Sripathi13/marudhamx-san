import React, { useState } from 'react';
import { Sliders, Save, RotateCcw, AlertCircle, Check } from 'lucide-react';
import cropsData from '../data/crops.json';
import vehiclesData from '../data/vehicles.json';
import { Language } from '../i18n/locales.ts';

interface AdminParamsProps {
  lang: Language;
}

export const AdminParams: React.FC<AdminParamsProps> = ({ lang }) => {
  const [crops, setCrops] = useState(cropsData.crops);
  const [fuelPrice, setFuelPrice] = useState(vehiclesData.default_fuel_price_inr);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleBaseRateChange = (index: number, val: number) => {
    const updated = [...crops];
    updated[index].base_rate = val;
    setCrops(updated);
  };

  const handlePriceChange = (index: number, val: number) => {
    const updated = [...crops];
    updated[index].default_price_inr_per_kg = val;
    setCrops(updated);
  };

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Crop Parameters & Rate Overrides</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Calibrate biological respiration decay factors, default wholesale tariffs, and diesel fuel prices.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
        >
          {savedNotice ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{savedNotice ? 'Parameters Saved' : 'Save Parameters'}</span>
        </button>
      </div>

      {/* Global Diesel Rate */}
      <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 max-w-sm space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
          Base Commercial Diesel Price (₹ / Litre)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.5"
            value={fuelPrice}
            onChange={(e) => setFuelPrice(Number(e.target.value))}
            className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-sm font-semibold text-stone-900"
          />
          <span className="text-xs text-stone-500 font-bold">₹/L</span>
        </div>
        <p className="text-[11px] text-stone-500">
          Tamil Nadu state standard retail benchmark: ₹94.50/L.
        </p>
      </div>

      {/* Crops Table */}
      <div className="overflow-x-auto border border-stone-200 rounded-xl">
        <table className="w-full text-left text-xs text-stone-800">
          <thead className="bg-stone-100 text-stone-700 uppercase tracking-wider font-bold border-b border-stone-200 text-[11px]">
            <tr>
              <th className="p-3">Crop Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Base Decay Rate (k/hr)</th>
              <th className="p-3">Wholesale Price (₹/kg)</th>
              <th className="p-3">Weight Vector [Time, Spoilage, Cost, Traffic]</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {crops.map((crop, idx) => (
              <tr key={crop.id} className="hover:bg-stone-50">
                <td className="p-3 font-bold text-stone-900 whitespace-nowrap">
                  {crop.name}
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                    crop.category === 'highly_perishable'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : crop.category === 'medium'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {crop.category.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <input
                    type="number"
                    step="0.001"
                    value={crop.base_rate}
                    onChange={(e) => handleBaseRateChange(idx, Number(e.target.value))}
                    className="w-24 bg-white border border-stone-300 rounded px-2 py-1 text-xs font-mono font-medium"
                  />
                </td>
                <td className="p-3 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span>₹</span>
                    <input
                      type="number"
                      value={crop.default_price_inr_per_kg}
                      onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                      className="w-20 bg-white border border-stone-300 rounded px-2 py-1 text-xs font-semibold"
                    />
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap font-mono text-[11px] text-stone-600">
                  [{crop.weights.time}, {crop.weights.spoilage}, {crop.weights.cost}, {crop.weights.traffic}]
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
