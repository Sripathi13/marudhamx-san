import { describe, it, expect } from 'vitest';
import en from './i18n/locales/en.json' with { type: 'json' };
import ta from './i18n/locales/ta.json' with { type: 'json' };

function getKeyPaths(obj: Record<string, any>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const fullPath = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys.push(...getKeyPaths(obj[k], fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys.sort();
}

function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

describe('Strict Tamil Localization Audits (Part 1.3)', () => {
  it('en.json and ta.json must have strictly identical key hierarchies', () => {
    const enKeys = getKeyPaths(en);
    const taKeys = getKeyPaths(ta);
    expect(taKeys).toEqual(enKeys);
  });

  it('ta.json must contain no identical values to en.json except allowed symbols and native language names', () => {
    const allowedIdenticalPaths = new Set([
      'units.percent',
      'units.rupees',
      'languages.en',
      'languages.ta',
      'languages.hi'
    ]);
    const keys = getKeyPaths(en);

    for (const key of keys) {
      if (allowedIdenticalPaths.has(key)) continue;
      const enVal = String(getValueByPath(en, key));
      const taVal = String(getValueByPath(ta, key));

      expect(taVal, `Key ${key} in ta.json is identical to en.json`).not.toBe(enVal);
    }
  });

  it('ta.json must contain zero Latin letters [A-Za-z] outside language selector native name and variable placeholders', () => {
    const keys = getKeyPaths(ta);
    const allowedEnglishPaths = new Set(['languages.en']);

    for (const key of keys) {
      if (allowedEnglishPaths.has(key)) continue;
      const taVal = String(getValueByPath(ta, key));
      // Remove i18next interpolation placeholders like {{count}}, {{name}}, {{letter}}
      const withoutPlaceholders = taVal.replace(/\{\{[^}]+\}\}/g, '');
      const latinMatches = withoutPlaceholders.match(/[A-Za-z]+/g);

      expect(
        latinMatches,
        `Key ${key} in ta.json contains unlocalized Latin text: "${taVal}"`
      ).toBeNull();
    }
  });
});
