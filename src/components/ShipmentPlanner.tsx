import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Calendar, Clock, DollarSign, AlertCircle, Info, Sparkles, Navigation } from 'lucide-react';
import { Language, translations } from '../i18n/locales.ts';
import cropsData from '../data/crops.json';
import marketsData from '../data/markets.json';
import vehiclesData from '../data/vehicles.json';
import { LocationPoint, OptimizeRequest } from '../services/optimizerEngine.ts';

interface ShipmentPlannerProps {
  lang: Language;
  origin: LocationPoint;
  setOrigin: (origin: LocationPoint) => void;
  destination: LocationPoint;
  setDestination: (dest: LocationPoint) => void;
  onOptimize: (req: OptimizeRequest) => void;
  isLoading: boolean;
  onLoadDemo: () => void;
}

export const ShipmentPlanner: React.FC<ShipmentPlannerProps> = ({
  lang,
  origin,
  setOrigin,
  destination,
  setDestination,
  onOptimize,
  isLoading,
  onLoadDemo,
}) => {
  const t = translations[lang];

  // Form State
  const [selectedCropId, setSelectedCropId] = useState<string>('tomato');
  const [quantityKg, setQuantityKg] = useState<number>(5000);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('reefer_truck');
  const [departureTime, setDepartureTime] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [maxHours, setMaxHours] = useState<string>('');
  const [fuelOverride, setFuelOverride] = useState<string>('94.5');
  const [priceOverride, setPriceOverride] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Village search input
  const [villageSearch, setVillageSearch] = useState<string>('Pollachi Farm Hub');
  const [villageSuggestions, setVillageSuggestions] = useState<LocationPoint[]>([]);
  const [isSearchingVillage, setIsSearchingVillage] = useState<boolean>(false);

  // Errors state
  const [errors, setErrors] = useState<{ quantity?: string; vehicle?: string; origin?: string }>({});

  const currentCrop = cropsData.crops.find((c) => c.id === selectedCropId) || cropsData.crops[0];
  const currentVehicle = vehiclesData.vehicles.find((v) => v.id === selectedVehicleId) || vehiclesData.vehicles[0];

  // Update default price when crop changes
  useEffect(() => {
    if (!priceOverride || priceOverride === '0') {
      setPriceOverride(currentCrop.default_price_inr_per_kg.toString());
    }
  }, [selectedCropId]);

  // Village autocomplete search
  const handleSearchVillage = async (query: string) => {
    setVillageSearch(query);
    if (!query || query.length < 2) {
      setVillageSuggestions([]);
      return;
    }

    setIsSearchingVillage(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setVillageSuggestions(data);
      }
    } catch {
      // ignore
    } finally {
      setIsSearchingVillage(false);
    }
  };

  const handleSelectVillage = (place: LocationPoint) => {
    setOrigin(place);
    setVillageSearch(place.name);
    setVillageSuggestions([]);
    setErrors((prev) => ({ ...prev, origin: undefined }));
  };

  // Destination select
  const handleMarketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const market = marketsData.markets.find((m) => m.id === e.target.value);
    if (market) {
      setDestination({
        name: market.name,
        lat: market.lat,
        lng: market.lng,
      });
    }
  };

  // Validate and submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (quantityKg <= 0 || isNaN(quantityKg)) {
      newErrors.quantity = t.errQuantityZero;
    } else if (quantityKg > currentVehicle.capacity_kg) {
      newErrors.vehicle = `${t.errExceedCapacity} (${currentVehicle.capacity_kg.toLocaleString()} kg max)`;
    }

    if (!origin || !origin.name) {
      newErrors.origin = t.errMissingOrigin;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const req: OptimizeRequest = {
      crop_id: selectedCropId,
      quantity_kg: Number(quantityKg),
      origin,
      destination,
      vehicle_type: selectedVehicleId,
      departure_time: departureTime,
      max_acceptable_hours: maxHours ? parseFloat(maxHours) : undefined,
      fuel_price_override: fuelOverride ? parseFloat(fuelOverride) : undefined,
      price_per_kg_override: priceOverride ? parseFloat(priceOverride) : undefined,
    };

    onOptimize(req);
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 sm:p-6 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div>
          <h2 className="text-lg font-bold text-stone-900">{t.plannerTitle}</h2>
          <p className="text-xs text-stone-500">
            Configure produce parameters and vehicle constraints
          </p>
        </div>
        <button
          type="button"
          onClick={onLoadDemo}
          className="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>Demo 5t Tomato</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Crop Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
            {t.cropLabel}
          </label>
          <select
            value={selectedCropId}
            onChange={(e) => {
              setSelectedCropId(e.target.value);
              const crp = cropsData.crops.find((c) => c.id === e.target.value);
              if (crp) setPriceOverride(crp.default_price_inr_per_kg.toString());
            }}
            className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-medium"
          >
            {cropsData.crops.map((crop) => (
              <option key={crop.id} value={crop.id}>
                {lang === 'ta' ? (crop as any).name_ta || crop.name : crop.name} (Base decay: {crop.base_rate} / hr)
              </option>
            ))}
          </select>
          <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500">
            <span>Perishability: <strong className="text-stone-700">{currentCrop.category.replace('_', ' ')}</strong></span>
            <span>Est. Shelf Life: <strong className="text-stone-700">{currentCrop.shelf_life_hours} hrs</strong></span>
          </div>
        </div>

        {/* Quantity (kg) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
              {t.quantityLabel}
            </label>
            <span className="text-xs text-stone-500">
              Max capacity: <strong className="text-stone-800">{currentVehicle.capacity_kg.toLocaleString()} kg</strong>
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              min={1}
              step={100}
              value={quantityKg}
              onChange={(e) => {
                setQuantityKg(Number(e.target.value));
                setErrors((prev) => ({ ...prev, quantity: undefined, vehicle: undefined }));
              }}
              className={`w-full bg-stone-50 border rounded-lg px-3 py-2 text-sm text-stone-900 font-medium focus:outline-hidden focus:ring-2 ${
                errors.quantity || errors.vehicle
                  ? 'border-red-500 ring-red-400'
                  : 'border-stone-300 focus:ring-emerald-600'
              }`}
            />
            <span className="absolute right-3 top-2.5 text-xs text-stone-500 font-medium">kg</span>
          </div>
          {(errors.quantity || errors.vehicle) && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.quantity || errors.vehicle}</span>
            </p>
          )}
        </div>

        {/* Farm Origin (Village Search & Map Pin) */}
        <div className="relative">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
            {t.originLabel}
          </label>
          <div className="relative">
            <input
              type="text"
              value={villageSearch}
              onChange={(e) => handleSearchVillage(e.target.value)}
              placeholder={t.originPlaceholder}
              className={`w-full bg-stone-50 border rounded-lg pl-9 pr-3 py-2 text-sm text-stone-900 focus:outline-hidden focus:ring-2 ${
                errors.origin ? 'border-red-500 ring-red-400' : 'border-stone-300 focus:ring-emerald-600'
              }`}
            />
            <MapPin className="w-4 h-4 text-emerald-700 absolute left-3 top-2.5" />
          </div>

          {/* Autocomplete suggestions */}
          {villageSuggestions.length > 0 && (
            <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {villageSuggestions.map((place, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectVillage(place)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 hover:text-emerald-950 border-b border-stone-100 flex items-center justify-between"
                >
                  <span className="font-semibold text-stone-800">{place.name}</span>
                  <span className="text-[10px] text-stone-400">{place.lat.toFixed(3)}, {place.lng.toFixed(3)}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500">
            <span>Coordinates: <strong className="text-stone-700">{origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}</strong></span>
            <span className="text-emerald-700 font-medium">Or click map directly</span>
          </div>
        </div>

        {/* Destination Market */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
            {t.destinationLabel}
          </label>
          <select
            onChange={handleMarketChange}
            value={marketsData.markets.find((m) => m.name === destination.name)?.id || marketsData.markets[0].id}
            className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          >
            {marketsData.markets.map((m) => (
              <option key={m.id} value={m.id}>
                {lang === 'ta' ? (m as any).name_ta || m.name : m.name} ({m.city})
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-stone-500">
            Peak wholesale auction: <strong className="text-stone-700">{(marketsData.markets.find((m) => m.name === destination.name) || marketsData.markets[0]).peak_auction_time}</strong>
          </p>
        </div>

        {/* Vehicle Specification */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
            {t.vehicleLabel}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {vehiclesData.vehicles.map((v) => {
              const isSelected = selectedVehicleId === v.id;
              return (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => {
                    setSelectedVehicleId(v.id);
                    setErrors((prev) => ({ ...prev, vehicle: undefined }));
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-700'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800'
                  }`}
                >
                  <div className="font-bold text-xs">{lang === 'ta' ? (v as any).name_ta?.split(' ')[0] || v.name.split(' ')[0] : v.name.split(' ')[0]}</div>
                  <div className="text-[11px] text-stone-600 mt-0.5">{v.capacity_kg / 1000} tonnes cap</div>
                  <div className="text-[10px] font-semibold mt-1 text-emerald-800">
                    {v.id === 'reefer_truck' ? '❄️ Active Cooling' : v.id === 'closed_truck' ? '📦 Insulated' : '🌬️ Open Canvas'}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[11px] text-stone-500">
            {currentVehicle.description} (Insulation/Cooling factor: <strong>{currentVehicle.temp_factor}×</strong>)
          </p>
        </div>

        {/* Departure Time */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
            {t.departureTimeLabel}
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <p className="mt-1 text-[11px] text-stone-500">
            Affects daytime solar heat buildup and Coimbatore urban peak congestion.
          </p>
        </div>

        {/* Advanced Options Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1"
          >
            <span>{showAdvanced ? '− Hide Rate & Market Overrides' : '+ Custom Rates & Deadlines'}</span>
          </button>
        </div>

        {showAdvanced && (
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-3 text-xs">
            <div>
              <label className="block font-medium text-stone-700 mb-1">{t.maxHoursLabel}</label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 3.5"
                value={maxHours}
                onChange={(e) => setMaxHours(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 text-stone-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-stone-700 mb-1">{t.priceOverrideLabel}</label>
                <input
                  type="number"
                  value={priceOverride}
                  onChange={(e) => setPriceOverride(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 text-stone-900"
                />
              </div>
              <div>
                <label className="block font-medium text-stone-700 mb-1">{t.fuelOverrideLabel}</label>
                <input
                  type="number"
                  step="0.5"
                  value={fuelOverride}
                  onChange={(e) => setFuelOverride(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 text-stone-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-bold text-sm sm:text-base text-white shadow-sm transition-all flex items-center justify-center gap-2 ${
            isLoading
              ? 'bg-stone-400 cursor-not-allowed'
              : 'bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t.optimizingBtn}</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              <span>{t.optimizeBtn}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
