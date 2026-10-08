import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Route, Truck, TrendingDown, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

interface LandingPageProps {
  onRunDemo?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onRunDemo }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handlePlanShipment = () => {
    navigate('/plan');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Hero Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>{t('landing.badge')}</span>
        </div>

        {/* Headline stating what MarudhamX does */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight leading-tight max-w-4xl mx-auto">
          {t('landing.headline')}
        </h1>

        {/* Outcome Line */}
        <p className="text-base sm:text-xl text-stone-700 max-w-2xl mx-auto leading-relaxed">
          {t('landing.subline')}
        </p>

        {/* CTAs */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={handlePlanShipment}
            className="bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-bold px-6 py-3.5 rounded-xl text-base shadow-sm hover:shadow-md transition-all flex items-center gap-2.5 cursor-pointer"
          >
            <span>{t('landing.ctaPlan')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          {onRunDemo && (
            <button
              type="button"
              onClick={onRunDemo}
              className="bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-900 font-bold px-6 py-3.5 rounded-xl text-base border border-stone-300 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-700 fill-amber-700" />
              <span>{t('landing.ctaDemo')}</span>
            </button>
          )}
        </div>
      </section>

      {/* 3 Feature Cards (Section 1) */}
      <section className="py-12 bg-stone-200/50 border-t border-stone-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Route on real roads */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Route className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              {t('landing.features.card1.title')}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {t('landing.features.card1.description')}
            </p>
          </div>

          {/* Card 2: Truck count */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              {t('landing.features.card2.title')}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {t('landing.features.card2.description')}
            </p>
          </div>

          {/* Card 3: Loss estimate */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
              <TrendingDown className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              {t('landing.features.card3.title')}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {t('landing.features.card3.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-6 px-4 text-center border-t border-stone-800">
        <p>{t('brand.name')} — {t('brand.subtitle')}</p>
      </footer>
    </div>
  );
};
