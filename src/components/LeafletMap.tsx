import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RouteOption, LocationPoint } from '../services/optimizerEngine.ts';

interface LeafletMapProps {
  origin: LocationPoint;
  destination: LocationPoint;
  routes: RouteOption[];
  selectedRouteId: string | null;
  recommendedRouteId: string | null;
  onSelectRoute: (id: string) => void;
  onMapClickOrigin?: (lat: number, lng: number) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  origin,
  destination,
  routes,
  selectedRouteId,
  recommendedRouteId,
  onSelectRoute,
  onMapClickOrigin,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [10.85, 77.1],
      zoom: 10,
      zoomControl: true,
    });

    // OpenStreetMap standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    // Map click handler for origin placement
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClickOrigin) {
        onMapClickOrigin(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers and Route Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    // Custom Origin Marker (Farm)
    const originIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          background-color: #065f46;
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        ">
          <span>🌱</span>
          <span>${origin.name || 'Farm Origin'}</span>
        </div>
      `,
      iconSize: [120, 28],
      iconAnchor: [60, 14],
    });

    const originMarker = L.marker([origin.lat, origin.lng], { icon: originIcon });
    originMarker.bindPopup(`<b>Farm Origin:</b> ${origin.name}<br/>Lat: ${origin.lat.toFixed(4)}, Lng: ${origin.lng.toFixed(4)}`);
    layerGroup.addLayer(originMarker);
    bounds.extend([origin.lat, origin.lng]);

    // Custom Destination Marker (Market)
    const destIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          background-color: #991b1b;
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        ">
          <span>🏬</span>
          <span>${destination.name || 'Destination Market'}</span>
        </div>
      `,
      iconSize: [130, 28],
      iconAnchor: [65, 14],
    });

    const destMarker = L.marker([destination.lat, destination.lng], { icon: destIcon });
    destMarker.bindPopup(`<b>Destination Market:</b> ${destination.name}<br/>Lat: ${destination.lat.toFixed(4)}, Lng: ${destination.lng.toFixed(4)}`);
    layerGroup.addLayer(destMarker);
    bounds.extend([destination.lat, destination.lng]);

    // Render Polylines for each route
    routes.forEach((route) => {
      const isSelected = route.id === selectedRouteId;
      const isRecommended = route.id === recommendedRouteId;

      let color = '#78716c'; // neutral stone for muted
      let weight = 4;
      let opacity = 0.6;
      let dashArray: string | undefined = '4, 6';

      if (isRecommended) {
        color = '#047857'; // vibrant emerald
        weight = isSelected ? 7 : 6;
        opacity = 0.95;
        dashArray = undefined;
      } else if (isSelected) {
        color = '#b45309'; // warm amber
        weight = 6;
        opacity = 0.9;
        dashArray = undefined;
      } else if (route.id === 'B') {
        color = '#0284c7'; // sky blue
        weight = 4;
        opacity = 0.7;
      }

      const polyline = L.polyline(route.geometry, {
        color,
        weight,
        opacity,
        dashArray,
      });

      polyline.on('click', () => {
        onSelectRoute(route.id);
      });

      // Tooltip
      polyline.bindTooltip(
        `<b>${route.name}</b><br/>${route.distance_km} km • ${route.eta_minutes} mins<br/>Transport: ₹${route.transport_cost_inr.toLocaleString()} • Spoilage Loss: ₹${route.expected_loss_inr.toLocaleString()}<br/><b>Score: ${route.score}/100</b>`,
        { sticky: true }
      );

      layerGroup.addLayer(polyline);

      route.geometry.forEach(([lat, lng]) => {
        bounds.extend([lat, lng]);
      });
    });

    // Fit bounds with padding
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [origin, destination, routes, selectedRouteId, recommendedRouteId]);

  return (
    <div className="relative w-full h-[460px] lg:h-[580px] bg-stone-200 rounded-xl overflow-hidden border border-stone-300 shadow-xs">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Map Legend */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-lg border border-stone-300 shadow-md text-xs text-stone-800 space-y-1.5 max-w-xs pointer-events-auto">
        <div className="font-bold text-stone-900 flex items-center justify-between pb-1 border-b border-stone-200">
          <span>Map Legend</span>
          <span className="text-[10px] text-stone-500 font-normal">Click line to inspect</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-emerald-700 rounded-full inline-block"></span>
          <span className="font-medium text-emerald-950">Recommended Route (Score Winner)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-amber-600 rounded-full inline-block"></span>
          <span className="text-stone-700">Alternative Bypass Highway</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 border-t-2 border-dashed border-stone-500 inline-block"></span>
          <span className="text-stone-700">Toll-Free Feeder / Rural Road</span>
        </div>
        <div className="pt-1 border-t border-stone-200 text-[11px] text-stone-500">
          💡 Click anywhere on map to reposition farm origin pin.
        </div>
      </div>
    </div>
  );
};
