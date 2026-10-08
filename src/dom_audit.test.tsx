// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import i18n from './i18n/index.ts';
import { LandingPage } from './pages/LandingPage.tsx';
import { PlanPage } from './pages/PlanPage.tsx';
import { ResultsPage } from './pages/ResultsPage.tsx';
import { HistoryPage } from './pages/HistoryPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { TopBar } from './components/TopBar.tsx';
import { defaultSettings, ShipmentPlanResult } from './services/realRoadRouter.ts';

// Mock Leaflet map to avoid canvas/CSS rendering errors in JSDOM
vi.mock('leaflet', () => {
  const mockLayerGroup = () => ({
    addTo: vi.fn().mockReturnThis(),
    clearLayers: vi.fn(),
    addLayer: vi.fn(),
    on: vi.fn(),
    bindTooltip: vi.fn()
  });

  return {
    default: {
      map: vi.fn().mockReturnValue({
        remove: vi.fn(),
        on: vi.fn(),
        fitBounds: vi.fn(),
        addControl: vi.fn()
      }),
      tileLayer: vi.fn().mockReturnValue({ addTo: vi.fn() }),
      layerGroup: vi.fn().mockImplementation(mockLayerGroup),
      featureGroup: vi.fn().mockImplementation(mockLayerGroup),
      latLngBounds: vi.fn().mockReturnValue({
        isValid: vi.fn().mockReturnValue(true),
        extend: vi.fn()
      }),
      divIcon: vi.fn().mockReturnValue({}),
      marker: vi.fn().mockReturnValue({
        addTo: vi.fn(),
        bindPopup: vi.fn(),
        on: vi.fn()
      }),
      circle: vi.fn().mockReturnValue({ addTo: vi.fn() }),
      circleMarker: vi.fn().mockReturnValue({
        addTo: vi.fn(),
        bindTooltip: vi.fn()
      }),
      tooltip: vi.fn().mockReturnValue({ setContent: vi.fn() }),
      polyline: vi.fn().mockReturnValue({
        addTo: vi.fn(),
        bindTooltip: vi.fn(),
        on: vi.fn()
      }),
      control: {
        attribution: vi.fn().mockReturnValue({
          addAttribution: vi.fn().mockReturnThis(),
          addTo: vi.fn()
        })
      }
    }
  };
});

const sampleShipmentResult: ShipmentPlanResult = {
  shipmentId: '101',
  timestamp: '2026-10-08T08:00:00Z',
  origin: {
    name: 'பொள்ளாச்சி பண்ணை மையம்',
    name_ta: 'பொள்ளாச்சி பண்ணை மையம்',
    lat: 10.6586,
    lng: 77.0087,
    address: 'பொள்ளாச்சி, கோயம்புத்தூர் மாவட்டம், தமிழ்நாடு'
  },
  destination: {
    name: 'கோயம்புத்தூர் எம்.ஜி.ஆர் மொத்த காய்கறி சந்தை',
    name_ta: 'கோயம்புத்தூர் எம்.ஜி.ஆர் மொத்த காய்கறி சந்தை',
    lat: 10.9982,
    lng: 76.9634,
    address: 'கொங்கு மண்டலத்தின் முதன்மை காய்கறி மொத்த விற்பனை முனையம்.'
  },
  cropId: 'tomato',
  totalKg: 5000,
  truckCapacityKg: 3000,
  trucksNeeded: 2,
  fullTrucks: 1,
  lastTruckLoad: 2000,
  truckAllocations: [
    { truckIndex: 1, loadKg: 3000, capacityKg: 3000, utilizationPct: 100 },
    { truckIndex: 2, loadKg: 2000, capacityKg: 3000, utilizationPct: 67 }
  ],
  recommendedRouteId: 'A',
  dataSource: 'osrm_estimated',
  trafficIsLive: false,
  routes: [
    {
      id: 'A',
      corridorKey: 'corridorA',
      data_source: 'osrm_estimated',
      geometry: [[10.6586, 77.0087], [10.9982, 76.9634]],
      geometry_segments: [
        { speed: 'NORMAL', coords: [[10.6586, 77.0087], [10.9982, 76.9634]] }
      ],
      distance_km: 48.5,
      duration_min: 75,
      duration_no_traffic_min: 65,
      traffic_delay_min: 10,
      traffic_is_live: false,
      travelTimeHours: 1.25,
      transportCostInr: 2840,
      spoilageFraction: 0.035,
      expectedLossInr: 5600,
      totalEconomicCostInr: 8440,
      score: 95,
      trafficLevel: 'moderate',
      steps: [
        { instruction: 'நேராக செல்லவும்', roadName: 'தேசிய நெடுஞ்சாலை', distanceMeters: 48500, durationSeconds: 4500 }
      ],
      tollInr: 110,
      fuelCostInr: 1200,
      driverCostInr: 500,
      weightsBreakdown: { timePct: 40, spoilagePct: 35, costPct: 15, trafficPct: 10 },
      googleMapsUrl: 'https://maps.google.com',
      tradeoffInfo: {
        templateKey: 'cheapest',
        params: { route: 'A', cost: '₹2,840', spoilage: 3.5 }
      }
    }
  ],
  assumptions: {
    cropBaseRate: 0.035,
    effectiveK: 0.028,
    fuelPriceInr: 94.5,
    trafficMultiplier: 1.15
  }
};

function extractAllStrings(container: HTMLElement): string[] {
  const strings: string[] = [];

  // textContent
  if (container.textContent) {
    strings.push(container.textContent);
  }

  // Attributes: aria-label, placeholder, title, alt
  const elements = container.querySelectorAll('*');
  elements.forEach((el) => {
    ['aria-label', 'placeholder', 'title', 'alt'].forEach((attr) => {
      const val = el.getAttribute(attr);
      if (val) strings.push(val);
    });
  });

  return strings;
}

// Allowlist: The language selector option "English" is explicitly allowed by spec:
// "Make the language selector in the top bar show each language in its own script (English, தமிழ், हिन्दी). This label is the one allowed exception"
function assertZeroLatinLetters(container: HTMLElement, routeName: string) {
  const allTexts = extractAllStrings(container);

  for (let text of allTexts) {
    // Remove the allowed language native name "English"
    text = text.replace(/English/g, '');

    const latinMatches = text.match(/[A-Za-z]+/g);
    if (latinMatches && latinMatches.length > 0) {
      throw new Error(
        `Route "${routeName}" contains unlocalized English Latin text in Tamil mode: ${JSON.stringify(latinMatches)} in string: "${text}"`
      );
    }
  }
}

describe('DOM Language Audit in Tamil (Part 1.3)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('ta');
  });

  it('Route "/" (Landing Page + TopBar) has zero Latin letters in Tamil mode', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <TopBar />
        <LandingPage />
      </MemoryRouter>
    );
    assertZeroLatinLetters(container, '/');
  });

  it('Route "/plan" (Plan Page + TopBar) has zero Latin letters in Tamil mode', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/plan']}>
        <TopBar />
        <PlanPage settings={defaultSettings} onSavePlanResult={vi.fn()} />
      </MemoryRouter>
    );
    assertZeroLatinLetters(container, '/plan');
  });

  it('Route "/results/:id" (Results Page + TopBar) has zero Latin letters in Tamil mode', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/results/101']}>
        <TopBar />
        <ResultsPage currentResult={sampleShipmentResult} settings={defaultSettings} />
      </MemoryRouter>
    );
    assertZeroLatinLetters(container, '/results/:id');
  });

  it('Route "/history" (History Page + TopBar) has zero Latin letters in Tamil mode', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/history']}>
        <TopBar />
        <HistoryPage history={[sampleShipmentResult]} />
      </MemoryRouter>
    );
    assertZeroLatinLetters(container, '/history');
  });

  it('Route "/settings" (Settings Page + TopBar) has zero Latin letters in Tamil mode', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/settings']}>
        <TopBar />
        <SettingsPage settings={defaultSettings} onUpdateSettings={vi.fn()} />
      </MemoryRouter>
    );
    assertZeroLatinLetters(container, '/settings');
  });
});
