import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import { Navigation, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { LocationCoords, RouteCandidate, TrafficSpeed } from '../services/realRoadRouter.ts';
import { getLocalizedRouteLetter } from '../i18n/index.ts';

interface MapPickerProps {
  currentCoords: LocationCoords;
  onConfirmCoords?: (coords: LocationCoords) => void;
  userGpsLocation?: { lat: number; lng: number; accuracy: number } | null;
  onUseGps?: () => void;
  isPickingMode?: boolean;
  routes?: RouteCandidate[];
  selectedRouteId?: string;
  recommendedRouteId?: string;
  onSelectRoute?: (id: string) => void;
  destinationCoords?: LocationCoords;
  trafficIsLive?: boolean;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  currentCoords,
  onConfirmCoords,
  userGpsLocation,
  onUseGps,
  isPickingMode = false,
  routes = [],
  selectedRouteId,
  recommendedRouteId,
  onSelectRoute,
  destinationCoords,
  trafficIsLive = false
}) => {
  const { t, i18n } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [activeLat, setActiveLat] = useState<number>(currentCoords.lat);
  const [activeLng, setActiveLng] = useState<number>(currentCoords.lng);
  const [reverseAddress, setReverseAddress] = useState<string>(
    i18n.language === 'ta' && currentCoords.name_ta
      ? currentCoords.name_ta
      : currentCoords.address || currentCoords.name
  );
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);

  // Reverse geocode with Nominatim respecting active locale
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    const lang = i18n.language || 'en';
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1&accept-language=${lang}`,
        { headers: { 'User-Agent': 'MarudhamX-App/2.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        const displayName = data.display_name || '';

        // In Tamil mode, if the geocoder only returned Latin English letters, fall back to coordinates
        if (lang === 'ta' && /[a-zA-Z]/.test(displayName) && !/[\u0B80-\u0BFF]/.test(displayName)) {
          setReverseAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        } else {
          setReverseAddress(displayName || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
      } else {
        setReverseAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch {
      setReverseAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Custom attribution prefix: false as required by Part 1.2
    const map = L.map(mapContainerRef.current, {
      center: [currentCoords.lat, currentCoords.lng],
      zoom: 11,
      zoomControl: true,
      attributionControl: false
    });

    // Add attribution with localized text
    L.control
      .attribution({
        prefix: false
      })
      .addAttribution(t('map.osmAttribution'))
      .addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layersRef.current = layerGroup;
    mapInstanceRef.current = map;

    // Click handler on map
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (isPickingMode) {
        setActiveLat(e.latlng.lat);
        setActiveLng(e.latlng.lng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync coords
  useEffect(() => {
    setActiveLat(currentCoords.lat);
    setActiveLng(currentCoords.lng);
    const locName = i18n.language === 'ta' && currentCoords.name_ta
      ? currentCoords.name_ta
      : currentCoords.address || currentCoords.name;
    setReverseAddress(locName);
  }, [currentCoords, i18n.language]);

  // Render map layers with live traffic route colouring (Part 2)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersRef.current;
    if (!map || !group) return;

    group.clearLayers();
    const bounds = L.latLngBounds([]);

    // 1. Show user GPS location (blue dot + accuracy circle + "You are here")
    if (userGpsLocation) {
      const gpsDot = L.circleMarker([userGpsLocation.lat, userGpsLocation.lng], {
        radius: 8,
        fillColor: '#2563eb',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1
      });

      const gpsCircle = L.circle([userGpsLocation.lat, userGpsLocation.lng], {
        radius: Math.min(500, userGpsLocation.accuracy || 50),
        color: '#3b82f6',
        fillColor: '#93c5fd',
        fillOpacity: 0.25,
        weight: 1
      });

      const gpsTooltip = L.tooltip({ permanent: true, direction: 'top', className: 'gps-tooltip' })
        .setContent(`<div style="background:#1e3a8a;color:white;font-weight:bold;font-size:10px;padding:2px 6px;border-radius:4px;">📍 ${t('planner.youAreHere')}</div>`);
      gpsDot.bindTooltip(gpsTooltip);

      group.addLayer(gpsCircle);
      group.addLayer(gpsDot);
      bounds.extend([userGpsLocation.lat, userGpsLocation.lng]);
    }

    // 2. Selected Pickup Point Marker
    const pickupPinHtml = `
      <div style="
        background: #065f46;
        color: #ffffff;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: bold;
        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        border: 2px solid white;
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      ">
        <span>🌱</span>
        <span>${t('planner.pickupPoint')}</span>
      </div>
    `;

    const pickupIcon = L.divIcon({
      className: 'pickup-marker',
      html: pickupPinHtml,
      iconSize: [110, 28],
      iconAnchor: [55, 14]
    });

    const marker = L.marker([activeLat, activeLng], {
      icon: pickupIcon,
      draggable: isPickingMode
    });

    if (isPickingMode) {
      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        setActiveLat(pos.lat);
        setActiveLng(pos.lng);
        reverseGeocode(pos.lat, pos.lng);
      });
    }

    group.addLayer(marker);
    markerRef.current = marker;
    bounds.extend([activeLat, activeLng]);

    // 3. Destination Marker if present
    if (destinationCoords) {
      const destName = i18n.language === 'ta' && destinationCoords.name_ta
        ? destinationCoords.name_ta
        : destinationCoords.name;

      const destHtml = `
        <div style="
          background: #991b1b;
          color: #ffffff;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: bold;
          box-shadow: 0 3px 6px rgba(0,0,0,0.3);
          border: 2px solid white;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        ">
          <span>🏬</span>
          <span>${destName}</span>
        </div>
      `;
      const destIcon = L.divIcon({
        className: 'dest-marker',
        html: destHtml,
        iconSize: [120, 28],
        iconAnchor: [60, 14]
      });
      const destMarker = L.marker([destinationCoords.lat, destinationCoords.lng], { icon: destIcon });
      group.addLayer(destMarker);
      bounds.extend([destinationCoords.lat, destinationCoords.lng]);
    }

    // 4. Candidate Route Segments with Traffic Colouring (Part 2)
    if (routes && routes.length > 0) {
      routes.forEach((route) => {
        const isRec = route.id === recommendedRouteId;
        const isSel = route.id === selectedRouteId;
        const routeGroup = L.featureGroup();

        // Segments rendering: solid green for normal, orange for slow, red for jam, grey dashed for unknown
        const segments = route.geometry_segments && route.geometry_segments.length > 0
          ? route.geometry_segments
          : [{ speed: 'NORMAL' as TrafficSpeed, coords: route.geometry }];

        segments.forEach((seg) => {
          let strokeColor = '#16a34a'; // NORMAL (green)
          let dashArray: string | undefined = undefined;

          if (seg.speed === 'SLOW') {
            strokeColor = '#ea580c'; // SLOW (orange)
          } else if (seg.speed === 'TRAFFIC_JAM') {
            strokeColor = '#dc2626'; // TRAFFIC_JAM (red)
          } else if (seg.speed === 'UNKNOWN') {
            strokeColor = '#6b7280'; // UNKNOWN (grey)
            dashArray = '5, 8';
          }

          const weight = isRec ? (isSel ? 8 : 7) : (isSel ? 6 : 4);
          const opacity = isSel ? 1.0 : isRec ? 0.9 : 0.45;

          const polyline = L.polyline(seg.coords, {
            color: strokeColor,
            weight,
            opacity,
            dashArray,
            smoothFactor: 1
          });

          polyline.on('click', () => {
            if (onSelectRoute) onSelectRoute(route.id);
          });

          routeGroup.addLayer(polyline);
        });

        // Click on entire group selects route
        routeGroup.on('click', () => {
          if (onSelectRoute) onSelectRoute(route.id);
        });

        const routeCorridorName = t(`corridors.${route.corridorKey}`);
        const speedLabel = t(`traffic.speeds.${segments[0]?.speed || 'NORMAL'}`);
        const localizedRouteTitle = t('corridors.corridorPrefix', {
          letter: getLocalizedRouteLetter(route.id, i18n.language),
          name: routeCorridorName
        });

        routeGroup.bindTooltip(
          `<b>${localizedRouteTitle}</b><br/>${route.distance_km} ${t('units.km')} • ${route.duration_min} ${t('units.mins')}<br/>${t('results.comparisonTable.transportCost')}: ₹${route.transportCostInr.toLocaleString()}<br/>${t('results.comparisonTable.score')}: ${route.score}/100`,
          { sticky: true }
        );

        group.addLayer(routeGroup);
        route.geometry.forEach(([lat, lng]) => bounds.extend([lat, lng]));
      });
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [activeLat, activeLng, userGpsLocation, isPickingMode, routes, selectedRouteId, recommendedRouteId, destinationCoords, i18n.language]);

  const handleConfirm = () => {
    if (onConfirmCoords) {
      onConfirmCoords({
        name: reverseAddress.split(',')[0] || `${activeLat.toFixed(4)}, ${activeLng.toFixed(4)}`,
        lat: activeLat,
        lng: activeLng,
        address: reverseAddress
      });
    }
  };

  const googleMapsUrl = `https://www.google.com/maps?q=${activeLat},${activeLng}`;

  return (
    <div className="space-y-3">
      {/* Mode B: Estimated Traffic Banner (Part 2.2) */}
      {routes && routes.length > 0 && !trafficIsLive && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-950 font-medium">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>{t('traffic.bannerEstimated')}</div>
        </div>
      )}

      {/* Map view container */}
      <div className="relative w-full h-[400px] sm:h-[480px] bg-stone-200 rounded-xl overflow-hidden border border-stone-300 shadow-2xs">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating actions */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
          {onUseGps && (
            <button
              type="button"
              onClick={onUseGps}
              aria-label={t('planner.useCurrentLocation')}
              className="bg-white/95 hover:bg-white text-stone-900 border border-stone-300 p-2 rounded-lg shadow-sm font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">{t('planner.useCurrentLocation')}</span>
            </button>
          )}

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('map.googleMaps')}
            className="bg-white/95 hover:bg-white text-stone-900 border border-stone-300 p-2 rounded-lg shadow-sm font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">{t('map.googleMaps')}</span>
          </a>
        </div>

        {/* Traffic Legend (Part 2.1) */}
        {routes && routes.length > 0 && (
          <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-lg border border-stone-300 shadow-md text-xs text-stone-800 space-y-1.5 max-w-xs pointer-events-auto">
            <div className="font-bold text-stone-900 flex items-center justify-between pb-1 border-b border-stone-200">
              <span>{t('traffic.legend.title')}</span>
              <span className="text-[10px] text-stone-500 font-normal">{t('traffic.legend.clickInspect')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-1.5 bg-green-600 rounded-full inline-block"></span>
              <span className="font-medium text-stone-900">{t('traffic.legend.normal')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-1.5 bg-orange-500 rounded-full inline-block"></span>
              <span className="text-stone-800">{t('traffic.legend.slow')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-1.5 bg-red-600 rounded-full inline-block"></span>
              <span className="text-stone-800">{t('traffic.legend.heavy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-1 border-t-2 border-dashed border-stone-500 inline-block"></span>
              <span className="text-stone-700">{t('traffic.legend.noData')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Coordinate & Address Readout */}
      <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs text-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900">{t('planner.coordsLabel')}:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-stone-200 font-semibold text-stone-800">
              {activeLat.toFixed(6)}, {activeLng.toFixed(6)}
            </span>
          </div>
          <div className="text-stone-600 mt-1 truncate max-w-lg" title={reverseAddress}>
            {isReverseGeocoding ? t('map.locatingAddress') : reverseAddress}
          </div>
        </div>

        {isPickingMode && onConfirmCoords && (
          <button
            type="button"
            onClick={handleConfirm}
            aria-label={t('planner.confirmLocation')}
            className="bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{t('planner.confirmLocation')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
