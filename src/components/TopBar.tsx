import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Truck, MapPin, History, Settings, Globe, Sparkles } from 'lucide-react';
import { supportedLanguages } from '../i18n/index.ts';

interface TopBarProps {
  onRunDemo?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onRunDemo }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <header className="sticky top-0 z-50 bg-stone-900 border-b border-stone-800 text-stone-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-inner">
              <Truck className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-tight">{t('brand.name')}</span>
                <span className="text-[10px] uppercase font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded">
                  {t('brand.badge')}
                </span>
              </div>
              <div className="text-[11px] text-stone-400 hidden sm:block leading-none">
                {t('brand.subtitle')}
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink
              to="/plan"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`
              }
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>{t('nav.plan')}</span>
            </NavLink>

            <NavLink
              to="/history"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`
              }
            >
              <History className="w-4 h-4 text-emerald-400" />
              <span>{t('nav.history')}</span>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`
              }
            >
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>{t('nav.settings')}</span>
            </NavLink>
          </nav>

          {/* Right: Demo button & Language selector */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onRunDemo && (
              <button
                type="button"
                onClick={onRunDemo}
                className="hidden lg:flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-stone-950 font-bold text-xs px-2.5 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer"
                title={t('nav.demo')}
              >
                <Sparkles className="w-3.5 h-3.5 fill-stone-950" />
                <span>{t('nav.demo')}</span>
              </button>
            )}

            {/* Language Dropdown showing native names */}
            <div className="relative flex items-center bg-stone-800 border border-stone-700 rounded-lg px-2 py-1">
              <Globe className="w-3.5 h-3.5 text-stone-400 mr-1.5 shrink-0" />
              <select
                value={i18n.language}
                onChange={handleLanguageChange}
                aria-label={t('settings.language')}
                className="bg-transparent text-xs font-semibold text-stone-200 focus:outline-hidden cursor-pointer"
              >
                {supportedLanguages.map((l) => (
                  <option key={l.code} value={l.code} className="bg-stone-900 text-stone-100">
                    {l.nativeName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
