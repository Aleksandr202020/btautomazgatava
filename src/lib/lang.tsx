import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { htmlLang, t, type Lang, type Msg } from "./i18n";

const KEY = "bta-lang";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Msg) => string;
};

const LangCtx = createContext<Ctx | null>(null);

function readLang(): Lang {
  if (typeof window === "undefined") return "lv";
  const stored = window.localStorage.getItem(KEY);
  if (stored === "lv" || stored === "ru" || stored === "en") return stored;
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith("ru")) return "ru";
  if (nav.startsWith("en")) return "en";
  return "lv";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("lv");

  useEffect(() => {
    setLangState(readLang());
  }, []);

  useEffect(() => {
    document.documentElement.lang = htmlLang[lang];
    window.localStorage.setItem(KEY, lang);
  }, [lang]);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang: setLangState,
      t: (key) => t(lang, key),
    }),
    [lang],
  );

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang() {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useLang");
  return ctx;
}
