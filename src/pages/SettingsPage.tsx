import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, RotateCcw, Check, Sliders, Activity } from 'lucide-react';
import { SettingsState, defaultSettings } from '../services/realRoadRouter.ts';
import { supportedLanguages } from '../i18n/index.ts';
import cropsData from '../data/crops.json' with { type: 'json' };

interface SettingsPageProps {
  settings: SettingsState;
  onUpdateSettings: (newSettings: SettingsState) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onUpdateSettings }) => {
  const { t, i18n } = useTranslation();

  const [formState, setFormState] = useState<SettingsState>({ ...settings });
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);

  const isLiveTrafficKeyActive = Boolean(
    formState.google_maps_api_key ||
      (typeof process !== 'undefined' && (process.env?.GOOGLE_MAPS_API_KEY || process.env?.VITE_GOOGLE_MAPS_API_KEY))
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formState);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handleReset = () => {
    setFormState({ ...defaultSettings });
    onUpdateSettings({ ...defaultSettings });
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handleCropPriceChange = (cropId: string, val: number) => {
    setFormState((prev) => ({
      ...prev,
      crop_prices: {
        ...prev.crop_prices,
        [cropId]: val
      }
    }));
  };

  const getLocalizedCropName = (c: any) => {
    if (i18n.language === 'ta' && c.name_ta) return c.name_ta;
    if (i18n.language === 'hi' && c.name_hi) return c.name_hi;
    return c.name;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {t('settings.title')}
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            {t('settings.subtitle')}
          </p>
        </div>

        {showSavedToast && (
          <div className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <Check className="w-4 h-4 text-emerald-700" />
            <span>{t('settings.saved')}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Traffic Data Section (Part 3) */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-700" />
              <span>{t('settings.trafficSectionTitle')}</span>
            </h2>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                isLiveTrafficKeyActive
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-stone-100 text-stone-800 border-stone-300'
              }`}
            >
              {isLiveTrafficKeyActive ? t('settings.trafficStatusLive') : t('settings.trafficStatusEstimated')}
            </span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            {isLiveTrafficKeyActive ? t('settings.trafficDescLive') : t('settings.trafficDescEstimated')}
          </p>
        </div>

        {/* Core Calculation Parameters */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-6 space-y-5">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-700" />
            <span>{t('settings.operationalRatesTitle')}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Language Setting */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                {t('settings.language')}
              </label>
              <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 font-semibold"
              >
                {supportedLanguages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Units Setting */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                {t('settings.units')}
              </label>
              <select
                value={formState.units}
                onChange={(e) => setFormState({ ...formState, units: e.target.value as 'km' | 'miles' })}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 font-semibold"
              >
                <option value="km">{t('settings.unitKm')}</option>
                <option value="miles">{t('settings.unitMiles')}</option>
              </select>
            </div>

            {/* Fuel Price */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                {t('settings.fuelPrice')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={formState.fuel_price_inr}
                  onChange={(e) => setFormState({ ...formState, fuel_price_inr: Number(e.target.value) })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm font-semibold text-stone-900"
                />
                <span className="absolute right-3 top-2.5 text-xs text-stone-500 font-bold">{t('units.perLitre')}</span>
              </div>
            </div>

            {/* Fuel Efficiency */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                {t('settings.fuelEfficiency')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formState.fuel_efficiency_kmpl}
                  onChange={(e) => setFormState({ ...formState, fuel_efficiency_kmpl: Number(e.target.value) })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm font-semibold text-stone-900"
                />
                <span className="absolute right-3 top-2.5 text-xs text-stone-500 font-bold">
                  {formState.units === 'miles' ? t('units.mpg') : t('units.kmPerLitre')}
                </span>
              </div>
            </div>

            {/* Default Truck Capacity */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                {t('settings.defaultCapacity')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="100"
                  value={formState.default_truck_capacity_kg}
                  onChange={(e) => setFormState({ ...formState, default_truck_capacity_kg: Number(e.target.value) })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm font-semibold text-stone-900"
                />
                <span className="absolute right-3 top-2.5 text-xs text-stone-500 font-bold">{t('units.kg')}</span>
              </div>
            </div>

            {/* Traffic Profile */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                {t('settings.trafficProfile')}
              </label>
              <select
                value={formState.traffic_profile}
                onChange={(e) => setFormState({ ...formState, traffic_profile: e.target.value as any })}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 font-semibold"
              >
                <option value="off_peak">{t('settings.trafficOffPeak')}</option>
                <option value="typical">{t('settings.trafficTypical')}</option>
                <option value="heavy">{t('settings.trafficHeavy')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Crop Wholesale Tariffs */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-6 space-y-4">
          <h2 className="text-base font-bold text-stone-900">
            {t('settings.cropBenchmarksTitle')}
          </h2>
          <p className="text-xs text-stone-500">
            {t('settings.cropBenchmarksDesc')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
            {cropsData.crops.map((c) => {
              const currentPrice = formState.crop_prices[c.id] ?? c.default_price_inr_per_kg;
              return (
                <div key={c.id} className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1">
                  <div className="text-xs font-bold text-stone-800 truncate" title={getLocalizedCropName(c)}>
                    {getLocalizedCropName(c)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-500">₹</span>
                    <input
                      type="number"
                      value={currentPrice}
                      onChange={(e) => handleCropPriceChange(c.id, Number(e.target.value))}
                      className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-xs font-bold text-stone-900"
                    />
                    <span className="text-[11px] text-stone-500">/{t('units.kg')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('settings.reset')}</span>
          </button>

          <button
            type="submit"
            className="bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{t('settings.save')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
