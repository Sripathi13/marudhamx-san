import React from 'react';
import { Truck, MapPin, History, Sliders, Globe, Layers, Sparkles } from 'lucide-react';
import { Language, translations } from '../i18n/locales.ts';

interface NavbarProps {
  activeTab: 'planner' | 'vrp' | 'history' | 'admin';
  setActiveTab: (tab: 'planner' | 'vrp' | 'history' | 'admin') => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onLoadDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  onLoadDemo,
}) => {
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-40 bg-stone-900 border-b border-stone-800 text-stone-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold shadow-inner">
              <Truck className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">{t.appTitle}</span>
                <span className="text-[11px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded">
                  Tamil Nadu Agri Engine
                </span>
              </div>
              <p className="text-xs text-stone-400 hidden sm:block">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('planner')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'planner'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>{t.tabPlanner}</span>
            </button>

            <button
              onClick={() => setActiveTab('vrp')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'vrp'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>{t.tabVrp}</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <History className="w-4 h-4 text-emerald-400" />
              <span>{t.tabHistory}</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors hidden md:flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>{t.tabAdmin}</span>
            </button>
          </nav>

          {/* Actions: Demo Scenario & Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onLoadDemo}
              title="Quickly test the judging scenario: 5 tonnes tomato from Pollachi to Coimbatore"
              className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-stone-950 font-semibold text-xs sm:text-sm px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-stone-950 fill-stone-950" />
              <span className="hidden sm:inline">Demo Scenario</span>
              <span className="sm:hidden">Demo</span>
            </button>

            {/* Language toggle */}
            <div className="flex items-center bg-stone-800 rounded-md p-0.5 border border-stone-700">
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  lang === 'en' ? 'bg-stone-700 text-white' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('ta')}
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  lang === 'ta' ? 'bg-stone-700 text-white' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
