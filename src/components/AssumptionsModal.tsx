import React from 'react';
import { Info, AlertCircle, X, Check } from 'lucide-react';

interface AssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assumptions: {
    crop_base_rate: number;
    vehicle_temp_factor: number;
    effective_k: number;
    heat_factor: number;
    price_per_kg_used: number;
    ambient_temp_c?: number;
    notice?: string;
  };
}

export const AssumptionsModal: React.FC<AssumptionsModalProps> = ({
  isOpen,
  onClose,
  assumptions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-stone-200 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-800" />
            <h3 className="font-bold text-base text-stone-900">
              Assumptions & Mathematical Model
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
          <div>
            <strong>Demonstration Assumption Notice:</strong> The spoilage decay rates, ambient temperature adjustments, and road congestion multipliers presented in AgriRoute are algorithmic assumptions designed for hackathon demonstration. They are not validated laboratory biological research values.
          </div>
        </div>

        <div className="space-y-3 text-xs text-stone-700">
          <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 font-mono text-[11px] space-y-1">
            <div className="font-bold text-stone-900">Decay Formula (Part D5):</div>
            <div>spoilage_fraction(t) = 1 − exp(−k × travel_time_hours)</div>
            <div>k = base_rate × vehicle_cooling_factor × ambient_heat_factor</div>
          </div>

          <table className="w-full text-left border border-stone-200 rounded-lg overflow-hidden">
            <tbody className="divide-y divide-stone-200">
              <tr className="bg-stone-50">
                <td className="p-2 font-medium text-stone-600">Crop Base Decay Rate:</td>
                <td className="p-2 font-bold text-stone-900">{assumptions.crop_base_rate} / hr</td>
              </tr>
              <tr>
                <td className="p-2 font-medium text-stone-600">Vehicle Insulation/Cooling:</td>
                <td className="p-2 font-bold text-stone-900">{assumptions.vehicle_temp_factor}× factor</td>
              </tr>
              <tr className="bg-stone-50">
                <td className="p-2 font-medium text-stone-600">Ambient Temperature (Tamil Nadu):</td>
                <td className="p-2 font-bold text-stone-900">{assumptions.ambient_temp_c || 28}°C (Heat factor: {assumptions.heat_factor}×)</td>
              </tr>
              <tr>
                <td className="p-2 font-medium text-stone-600">Effective Decay Constant (k):</td>
                <td className="p-2 font-bold text-stone-900">{assumptions.effective_k}</td>
              </tr>
              <tr className="bg-stone-50">
                <td className="p-2 font-medium text-stone-600">Wholesale Crop Price Used:</td>
                <td className="p-2 font-bold text-stone-900">₹{assumptions.price_per_kg_used} / kg</td>
              </tr>
              <tr>
                <td className="p-2 font-medium text-stone-600">Traffic Source:</td>
                <td className="p-2 font-bold text-stone-900">Time-of-day deterministic multiplier (Estimated)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
