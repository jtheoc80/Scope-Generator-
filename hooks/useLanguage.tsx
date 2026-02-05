'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Language, TranslationKeys } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language is now fixed to English only
export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always use English - Spanish language feature disabled
  const [language] = useState<Language>("en");

  const setLanguage = (_lang: Language) => {
    // No-op - language switching is disabled
  };

  useEffect(() => {
    document.documentElement.lang = "en";
  }, []);

  const t = translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // During SSR/SSG, provide default English translations
    // This allows the hook to work during static generation
    return {
      language: "en" as Language,
      setLanguage: () => {
        // No-op during SSR
      },
      t: translations.en,
    };
  }
  return context;
}
