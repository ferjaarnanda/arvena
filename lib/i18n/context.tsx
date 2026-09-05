"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";
import { dictionaries, type Dictionary, type Locale } from "./dictionary";

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: Dictionary;
  isId: boolean;
  isEn: boolean;
  isDefault: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "arvena_language_preference";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("arvena-locale-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("arvena-locale-change", callback);
  };
}

function getClientSnapshot(): Locale {
  if (typeof window === "undefined") return "default";
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === "default" || saved === "id" || saved === "en") {
      return saved;
    }
  } catch {
    // ignore
  }
  return "default";
}

function getServerSnapshot(): Locale {
  return "default";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  const setLocale = (newLocale: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.cookie = `arvena_locale=${newLocale}; path=/; max-age=31536000`;
      window.dispatchEvent(new Event("arvena-locale-change"));
    } catch {
      // ignore
    }
  };

  const toggleLocale = () => {
    if (locale === "id") {
      setLocale("en");
    } else if (locale === "en") {
      setLocale("default");
    } else {
      setLocale("id");
    }
  };

  const t: Dictionary = dictionaries[locale] || dictionaries.default;

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        toggleLocale,
        t,
        isId: locale === "id",
        isEn: locale === "en",
        isDefault: locale === "default",
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      locale: "default" as Locale,
      setLocale: () => {},
      toggleLocale: () => {},
      t: dictionaries.default,
      isId: false,
      isEn: false,
      isDefault: true,
    };
  }
  return context;
}
