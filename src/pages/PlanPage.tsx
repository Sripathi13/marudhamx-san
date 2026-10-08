import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, Map, AlertCircle, Truck, Calendar, Layers, ArrowRight } from 'lucide-react';
import cropsData from '../data/crops.json' with { type: 'json' };
import marketsData from '../data/markets.json' with { type: 'json' };
import { LocationCoords, calculateShipmentPlan, SettingsState } from '../services/realRoadRouter.ts';
import { MapPicker } from '../components/MapPicker.tsx';

interface PlanPageProps {
  settings: SettingsState;
  onSavePlanResult: (result: any) => void;
}

export const PlanPage: React.FC<PlanPageProps> = ({ settings, onSavePlanResult }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Locations state
  const [origin, setOrigin] = useState<LocationCoords>(() => ({
    name: t('defaults.originName'),
    name_ta: 'பொள்ளாச்சி பண்ணை மையம்',
    name_hi: 'पोलाची फार्म हब',
    lat: 10.6586,
    lng: 77.0087,
    address: t('defaults.originAddress')
  }));

  const [destination, setDestination] = useState<LocationCoords>(() => {
    const defaultMkt = marketsData.markets[0];
    return {
      name: defaultMkt.name,
      name_ta: defaultMkt.name_ta,
      name_hi: defaultMkt.name_hi,
      lat: defaultMkt.lat,
      lng: defaultMkt.lng,
      address: defaultMkt.description
    };
  });

  // Map Picker Modal / Section state
  const [activePickerTarget, setActivePickerTarget] = useState<'origin' | 'destination' | null>(null);

  // GPS state
  const [userGps, setUserGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Form Fields
  const [selectedCropId, setSelectedCropId] = useState<string>('tomato');
  const [totalKg, setTotalKg] = useState<number>(5000);
  const [truckCapacityKg, setTruckCapacityKg] = useState<number>(settings.default_truck_capacity_kg || 3000);
  const [isCustomCapacity, setIsCustomCapacity] = useState<boolean>(false);
  const [customCapacityInput, setCustomCapacityInput] = useState<string>('3000');
  const [departureTime, setDepartureTime] = useState<string>(() => new Date().toISOString().slice(0, 16));

  // Search input
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<LocationCoords[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<{ quantity?: string; capacity?: string; origin?: string; destination?: string }>({});
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Update default names when language changes if using defaults
  useEffect(() => {
    if (origin.lat === 10.6586 && origin.lng === 77.0087) {
      setOrigin((prev) => ({
        ...prev,
        name: t('defaults.originName'),
        address: t('defaults.originAddress')
      }));
    }
  }, [i18n.language, t]);

  // Truck allocations preview calculation
  const effectiveCapacity = isCustomCapacity ? Number(customCapacityInput) || 3000 : truckCapacityKg;
  const trucksNeeded = totalKg > 0 && effectiveCapacity > 0 ? Math.ceil(totalKg / effectiveCapacity) : 0;
  const fullTrucks = totalKg > 0 && effectiveCapacity > 0 ? Math.floor(totalKg / effectiveCapacity) : 0;
  const lastTruckLoad = totalKg > 0 && effectiveCapacity > 0 ? totalKg - fullTrucks * effectiveCapacity : 0;

  // Use my current location (Section 5.1 option 1)
  const handleGetCurrentLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError(t('planner.errors.GEO_UNAVAILABLE'));
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        setUserGps({ lat: latitude, lng: longitude, accuracy });

        const lang = i18n.language || 'en';
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${lang}`,
            { headers: { 'User-Agent': 'MarudhamX-App/2.0' } }
          );
          if (res.ok) {
            const data = await res.json();
            const placeName = data.address?.village || data.address?.suburb || data.address?.city;
            // In Tamil mode, if no Tamil text in reverse geocode, fall back to coordinates
            const isLatinOnly = lang === 'ta' && /[a-zA-Z]/.test(placeName || '') && !/[\u0B80-\u0BFF]/.test(placeName || '');
            const finalName = !placeName || isLatinOnly ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : placeName;

            setOrigin({
              name: finalName,
              lat: latitude,
              lng: longitude,
              address: isLatinOnly ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : data.display_name
            });
          } else {
            setOrigin({
              name: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              lat: latitude,
              lng: longitude
            });
          }
        } catch {
          setOrigin({
            name: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            lat: latitude,
            lng: longitude
          });
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(t('planner.errors.GEO_DENIED'));
        } else if (err.code === err.TIMEOUT) {
          setGeoError(t('planner.errors.GEO_TIMEOUT'));
        } else {
          setGeoError(t('planner.errors.GEO_UNAVAILABLE'));
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Search input autocomplete handler
  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 3) {
      setSearchResults([]);
      return;
    }

    const lang = i18n.language || 'en';
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=4&accept-language=${lang}`,
        { headers: { 'User-Agent': 'MarudhamX-App/2.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(
          data.map((item: any) => ({
            name: item.display_name.split(',')[0],
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            address: item.display_name
          }))
        );
      }
    } catch {
      // ignore
    }
  };

  const handleSelectSearchResult = (loc: LocationCoords) => {
    setOrigin(loc);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Submit Handler
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!totalKg || totalKg <= 0) {
      newErrors.quantity = t('planner.errors.QUANTITY_INVALID');
    }
    if (!effectiveCapacity || effectiveCapacity <= 0) {
      newErrors.capacity = t('planner.errors.CAPACITY_INVALID');
    }
    if (!origin.lat || !origin.lng) {
      newErrors.origin = t('planner.errors.ORIGIN_REQUIRED');
    }
    if (!destination.lat || !destination.lng) {
      newErrors.destination = t('planner.errors.DEST_REQUIRED');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsCalculating(true);

    try {
      const result = await calculateShipmentPlan(
        origin,
        destination,
        selectedCropId,
        totalKg,
        effectiveCapacity,
        departureTime,
        settings
      );

      onSavePlanResult(result);
      navigate(`/results/${result.shipmentId}`);
    } catch (err: any) {
      const errKey = err.message in t('planner.errors', { returnObjects: true })
        ? t(`planner.errors.${err.message}`)
        : t('planner.errors.ROUTING_FAILED');
      setErrors({ quantity: errKey });
    } finally {
      setIsCalculating(false);
    }
  };

  // Helper to format market and crop name by language
  const getLocalizedMarketName = (m: any) => {
    if (i18n.language === 'ta' && m.name_ta) return m.name_ta;
    if (i18n.language === 'hi' && m.name_hi) return m.name_hi;
    return m.name;
  };

  const getLocalizedCropName = (c: any) => {
    if (i18n.language === 'ta' && c.name_ta) return c.name_ta;
    if (i18n.language === 'hi' && c.name_hi) return c.name_hi;
    return c.name;
  };

  const currentOriginDisplayName = i18n.language === 'ta' && origin.name_ta ? origin.name_ta : origin.name;
  const currentDestinationDisplayName = i18n.language === 'ta' && destination.name_ta ? destination.name_ta : destination.name;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          {t('planner.title')}
        </h1>
        <p className="text-sm text-stone-600 mt-1">
          {t('planner.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Form (6 Cols) */}
        <form onSubmit={handleCalculate} className="lg:col-span-6 bg-white rounded-2xl border border-stone-200 shadow-2xs p-6 space-y-6">
          {/* Pickup Location ("From") */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              {t('planner.fromLabel')}
            </label>

            {/* Current chosen origin display card */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-stone-900">{currentOriginDisplayName}</div>
                  <div className="text-xs text-stone-500 font-mono mt-0.5">
                    {origin.lat.toFixed(6)}, {origin.lng.toFixed(6)}
                  </div>
                  {origin.address && (
                    <div className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{origin.address}</div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActivePickerTarget('origin')}
                className="text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-50 border border-stone-300 px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                <Map className="w-3.5 h-3.5" />
                <span>{t('planner.pickOnMap')}</span>
              </button>
            </div>

            {/* Use my current location */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 border border-stone-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Navigation className={`w-3.5 h-3.5 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? t('map.locating') : t('planner.useCurrentLocation')}</span>
              </button>
            </div>

            {geoError && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{geoError}</span>
              </p>
            )}

            {/* Autocomplete Search input */}
            <div className="relative pt-1">
              <input
                type="text"
                placeholder={t('planner.searchLocation')}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden text-xs">
                  {searchResults.map((loc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSearchResult(loc)}
                      className="w-full text-left p-2 hover:bg-emerald-50 border-b border-stone-100 truncate"
                    >
                      <strong>{loc.name}</strong> — <span className="text-stone-500">{loc.address}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Destination ("To") */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              {t('planner.toLabel')}
            </label>
            <div className="flex gap-2">
              <select
                value={marketsData.markets.find((m) => m.name === destination.name || m.name_ta === destination.name_ta)?.id || marketsData.markets[0].id}
                onChange={(e) => {
                  const mkt = marketsData.markets.find((m) => m.id === e.target.value);
                  if (mkt) {
                    setDestination({
                      name: mkt.name,
                      name_ta: mkt.name_ta,
                      name_hi: mkt.name_hi,
                      lat: mkt.lat,
                      lng: mkt.lng,
                      address: i18n.language === 'ta' && mkt.description_ta ? mkt.description_ta : mkt.description
                    });
                  }
                }}
                className="grow bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              >
                {marketsData.markets.map((m) => (
                  <option key={m.id} value={m.id}>
                    {getLocalizedMarketName(m)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setActivePickerTarget('destination')}
                className="text-xs font-bold text-stone-800 bg-white hover:bg-stone-100 border border-stone-300 px-3 py-2 rounded-lg flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                <Map className="w-3.5 h-3.5 text-stone-600" />
                <span className="hidden sm:inline">{t('planner.pickOnMap')}</span>
              </button>
            </div>
          </div>

          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              {t('planner.cropLabel')}
            </label>
            <select
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            >
              {cropsData.crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {getLocalizedCropName(c)} ({c.base_rate}/{t('units.hrs')})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity and Truck Capacity Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Quantity */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                {t('planner.totalQuantityLabel')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  step={100}
                  value={totalKg}
                  onChange={(e) => setTotalKg(Number(e.target.value))}
                  className={`w-full bg-stone-50 border rounded-lg px-3 py-2 text-sm font-semibold text-stone-900 focus:outline-hidden focus:ring-2 ${
                    errors.quantity ? 'border-red-500 ring-red-400' : 'border-stone-300 focus:ring-emerald-600'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-stone-500 font-medium">{t('units.kg')}</span>
              </div>
              {errors.quantity && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.quantity}</p>
              )}
            </div>

            {/* Truck Capacity */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                {t('planner.truckCapacityLabel')}
              </label>
              {!isCustomCapacity ? (
                <select
                  value={truckCapacityKg}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomCapacity(true);
                    } else {
                      setTruckCapacityKg(Number(e.target.value));
                    }
                  }}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm font-semibold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                >
                  <option value={1000}>{t('presets.p1000')}</option>
                  <option value={3000}>{t('presets.p3000')}</option>
                  <option value={6000}>{t('presets.p6000')}</option>
                  <option value={10000}>{t('presets.p10000')}</option>
                  <option value="custom">{t('planner.customCapacity')}</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={customCapacityInput}
                    onChange={(e) => setCustomCapacityInput(e.target.value)}
                    placeholder="4500"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm font-semibold text-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomCapacity(false)}
                    className="text-xs text-stone-500 hover:text-stone-900 font-semibold underline shrink-0"
                  >
                    {t('planner.presets')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Truck Calculation Summary */}
          {trucksNeeded > 0 && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                <Truck className="w-4 h-4 text-emerald-800" />
                <span>
                  {t('planner.truckSummary', { trucks: trucksNeeded, totalKg: totalKg.toLocaleString() })}
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                {Array.from({ length: fullTrucks }).map((_, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-emerald-900">
                    <span>{t('planner.truckRow', { index: idx + 1, loadKg: effectiveCapacity.toLocaleString(), utilization: 100 })}</span>
                    <span className="font-semibold text-emerald-800">{t('planner.fullLabel')}</span>
                  </div>
                ))}
                {lastTruckLoad > 0 && (
                  <div className="flex justify-between text-xs text-emerald-900">
                    <span>
                      {t('planner.truckRow', {
                        index: trucksNeeded,
                        loadKg: lastTruckLoad.toLocaleString(),
                        utilization: Math.round((lastTruckLoad / effectiveCapacity) * 100)
                      })}
                    </span>
                    <span className="font-semibold text-amber-800">
                      {t('planner.partialLabel', { percent: Math.round((lastTruckLoad / effectiveCapacity) * 100) })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Departure Time */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              {t('planner.departureTimeLabel')}
            </label>
            <input
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Calculate Button */}
          <button
            type="submit"
            disabled={isCalculating}
            className="w-full bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 disabled:bg-stone-400 text-white font-bold py-3.5 px-4 rounded-xl text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isCalculating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('planner.calculatingButton')}</span>
              </>
            ) : (
              <>
                <span>{t('planner.calculateButton')}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Right: Interactive Leaflet Map for Pickup/Destination */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-stone-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>
                  {activePickerTarget === 'destination' ? t('map.selectMarketOnMap') : t('map.selectPickupOnMap')}
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                {t('map.mapDragHelp')}
              </p>
            </div>

            {activePickerTarget && (
              <button
                type="button"
                onClick={() => setActivePickerTarget(null)}
                className="text-xs text-stone-500 hover:text-stone-900 font-semibold cursor-pointer"
              >
                {t('map.closePicker')}
              </button>
            )}
          </div>

          <MapPicker
            currentCoords={activePickerTarget === 'destination' ? destination : origin}
            isPickingMode={true}
            userGpsLocation={userGps}
            onUseGps={handleGetCurrentLocation}
            destinationCoords={activePickerTarget === 'origin' ? destination : undefined}
            onConfirmCoords={(coords) => {
              if (activePickerTarget === 'destination') {
                setDestination(coords);
              } else {
                setOrigin(coords);
              }
              setActivePickerTarget(null);
            }}
          />
        </div>
      </div>
    </div>
  );
};
