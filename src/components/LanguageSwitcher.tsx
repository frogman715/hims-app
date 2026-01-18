'use client';

import { useCallback, useEffect, useState } from 'react';

type Locale = 'en' | 'id' | 'es' | 'zh';

interface LanguageSwitcherProps {
  className?: string;
}

/**
 * Language Switcher Component
 * Allows users to switch between en/id/es/zh
 */
export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const [currentLocale, setCurrentLocale] = useState<Locale>(() => {
    // Initialize state from localStorage on first render
    if (typeof window === 'undefined') return 'en';
    const saved = localStorage.getItem('hims-locale') as Locale | null;
    if (saved && ['en', 'id', 'es', 'zh'].includes(saved)) return saved;
    const browserLang = navigator.language.split('-')[0];
    return (['en', 'id', 'es', 'zh'].includes(browserLang) ? browserLang : 'en') as Locale;
  });

  const applyLocale = useCallback((locale: Locale) => {
    // Update HTML lang attribute
    document.documentElement.lang = locale;
    
    // Save to localStorage
    localStorage.setItem('hims-locale', locale);
    
    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('localechange', { detail: { locale } }));
  }, []);

  // Apply locale on mount and when it changes
  useEffect(() => {
    applyLocale(currentLocale);
  }, [currentLocale, applyLocale]);

  const handleLocaleChange = (locale: Locale) => {
    setCurrentLocale(locale);
    applyLocale(locale);
  };

  const locales: { code: Locale; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
  ];

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {locales.map((locale) => (
        <button
          key={locale.code}
          onClick={() => handleLocaleChange(locale.code)}
          title={locale.label}
          className={`
            px-3 py-2 rounded-lg font-medium text-sm transition-all
            ${
              currentLocale === locale.code
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }
          `}
        >
          <span className="mr-1">{locale.flag}</span>
          {locale.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/**
 * Hook to use i18n translations in components
 * Loads JSON files dynamically
 */
export function useTranslation() {
  const [locale, setLocale] = useState<Locale>('en');
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    // Get current locale
    const saved = (localStorage.getItem('hims-locale') as Locale) || 'en';
    
    // Load translation file
    const loadTranslations = async () => {
      try {
        const res = await fetch(`/locales/${saved}/common.json`);
        if (!res.ok) throw new Error(`Failed to load locale ${saved}`);
        const data = await res.json();
        setLocale(saved);
        setTranslations(data);
      } catch (err) {
        console.error(`Failed to load locale ${saved}:`, err);
        setLocale('en');
        setTranslations({});
      }
    };

    loadTranslations();

    // Listen for locale changes
    const handleLocaleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ locale: Locale }>;
      const newLocale = customEvent.detail.locale;
      setLocale(newLocale);
      loadTranslations();
    };

    window.addEventListener('localechange', handleLocaleChange);
    return () => window.removeEventListener('localechange', handleLocaleChange);
  }, []);

  const t = (key: string, defaultValue?: string): string => {
    const keys = key.split('.');
    let value: unknown = translations;

    for (const k of keys) {
      if (typeof value === 'object' && value !== null && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return defaultValue || key;
      }
    }

    return typeof value === 'string' ? value : defaultValue || key;
  };

  return { t, locale };
}
