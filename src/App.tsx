import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopBar } from './components/TopBar.tsx';
import { ScrollToTop } from './components/ScrollToTop.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { PlanPage } from './pages/PlanPage.tsx';
import { ResultsPage } from './pages/ResultsPage.tsx';
import { HistoryPage } from './pages/HistoryPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import {
  ShipmentPlanResult,
  SettingsState,
  defaultSettings,
  calculateShipmentPlan
} from './services/realRoadRouter.ts';
import marketsData from './data/markets.json' with { type: 'json' };

function AppContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Settings state persisted in localStorage
  const [settings, setSettings] = useState<SettingsState>(() => {
    try {
      const saved = localStorage.getItem('marudhamx_settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const handleUpdateSettings = (newSettings: SettingsState) => {
    setSettings(newSettings);
    localStorage.setItem('marudhamx_settings', JSON.stringify(newSettings));
  };

  // Shipment History state
  const [history, setHistory] = useState<ShipmentPlanResult[]>(() => {
    try {
      const saved = localStorage.getItem('marudhamx_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Current active result
  const [currentResult, setCurrentResult] = useState<ShipmentPlanResult | null>(null);

  // Seed default demo shipment if history is empty
  useEffect(() => {
    if (history.length === 0) {
      calculateShipmentPlan(
        {
          name: t('defaults.originName'),
          name_ta: 'பொள்ளாச்சி பண்ணை மையம்',
          name_hi: 'पोलाची फार्म हब',
          lat: 10.6586,
          lng: 77.0087,
          address: t('defaults.originAddress')
        },
        {
          name: marketsData.markets[0].name,
          name_ta: marketsData.markets[0].name_ta,
          name_hi: marketsData.markets[0].name_hi,
          lat: marketsData.markets[0].lat,
          lng: marketsData.markets[0].lng,
          address: marketsData.markets[0].description
        },
        'tomato',
        5000,
        3000,
        new Date().toISOString(),
        settings
      ).then((res) => {
        setHistory([res]);
        setCurrentResult(res);
        localStorage.setItem('marudhamx_history', JSON.stringify([res]));
      }).catch(() => {});
    } else if (!currentResult && history.length > 0) {
      setCurrentResult(history[0]);
    }
  }, []);

  const handleSavePlanResult = (result: ShipmentPlanResult) => {
    setCurrentResult(result);
    setHistory((prev) => {
      const updated = [result, ...prev.filter((h) => h.shipmentId !== result.shipmentId)];
      localStorage.setItem('marudhamx_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Demo Runner: 5,000 kg tomato from Pollachi to Coimbatore (Judging demo)
  const handleRunDemo = async () => {
    const demoOrigin = {
      name: t('defaults.originName'),
      name_ta: 'பொள்ளாச்சி பண்ணை மையம்',
      name_hi: 'पोलाची फार्म हब',
      lat: 10.6586,
      lng: 77.0087,
      address: t('defaults.originAddress')
    };
    const demoDest = {
      name: marketsData.markets[0].name,
      name_ta: marketsData.markets[0].name_ta,
      name_hi: marketsData.markets[0].name_hi,
      lat: marketsData.markets[0].lat,
      lng: marketsData.markets[0].lng,
      address: marketsData.markets[0].description
    };

    const result = await calculateShipmentPlan(
      demoOrigin,
      demoDest,
      'tomato',
      5000,
      3000,
      new Date().toISOString(),
      settings
    );

    handleSavePlanResult(result);
    navigate(`/results/${result.shipmentId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900 font-sans selection:bg-emerald-200">
      <ScrollToTop />
      <TopBar onRunDemo={handleRunDemo} />

      <main className="grow">
        <Routes>
          <Route path="/" element={<LandingPage onRunDemo={handleRunDemo} />} />
          <Route
            path="/plan"
            element={
              <PlanPage
                settings={settings}
                onSavePlanResult={handleSavePlanResult}
              />
            }
          />
          <Route
            path="/results/:shipmentId"
            element={
              <ResultsPage
                currentResult={currentResult}
                settings={settings}
              />
            }
          />
          <Route path="/history" element={<HistoryPage history={history} />} />
          <Route
            path="/settings"
            element={
              <SettingsPage
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
