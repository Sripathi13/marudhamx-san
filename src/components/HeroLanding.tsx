import React from 'react';
import { Route, Clock, Scale, ArrowRight, ShieldCheck, TrendingDown } from 'lucide-react';
import { Language, translations } from '../i18n/locales.ts';

interface HeroLandingProps {
  lang: Language;
  onStartPlanning: () => void;
  onLoadDemo: () => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({
  lang,
  onStartPlanning,
  onLoadDemo,
}) => {
  const t = translations[lang];

  return (
    <section className="bg-stone-100 border-b border-stone-200 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Main Pitch */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Agricultural Edge Weight Dijkstra & VRP Engine</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
            {t.heroTitle}
          </h1>

          <p className="text-stone-700 text-base sm:text-lg leading-relaxed">
            {t.heroDesc}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onStartPlanning}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-5 py-2.5 rounded-lg text-sm sm:text-base flex items-center gap-2 shadow-sm transition-all"
            >
              <span>{t.planShipmentCta}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onLoadDemo}
              className="bg-stone-200 hover:bg-stone-300 text-stone-900 font-semibold px-5 py-2.5 rounded-lg text-sm sm:text-base border border-stone-300 flex items-center gap-2 transition-all"
            >
              <TrendingDown className="w-4 h-4 text-emerald-700" />
              <span>{t.demoScenarioCta}</span>
            </button>
          </div>
        </div>

        {/* 3 Core Value Cards (Part E1) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
          {/* Card 1 */}
          <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center mb-3 text-stone-800">
                <Route className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="font-bold text-stone-900 text-base mb-1.5">{t.card1Title}</h3>
              <p className="text-stone-600 text-sm leading-relaxed">{t.card1Desc}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-xs font-semibold text-emerald-800">
              Corridor bypasses vs. congested short links
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center mb-3 text-stone-800">
                <Clock className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="font-bold text-stone-900 text-base mb-1.5">{t.card2Title}</h3>
              <p className="text-stone-600 text-sm leading-relaxed">{t.card2Desc}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-xs font-semibold text-emerald-800">
              Exponential decay: 1 - exp(-k × t)
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center mb-3 text-stone-800">
                <Scale className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="font-bold text-stone-900 text-base mb-1.5">{t.card3Title}</h3>
              <p className="text-stone-600 text-sm leading-relaxed">{t.card3Desc}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-xs font-semibold text-emerald-800">
              Clear trade-off sentences in ₹ and minutes
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
