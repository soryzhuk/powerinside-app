"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useTransition } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { locales, localeNames, type Locale } from "@/i18n/config";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const t = useTranslations("language");
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function change(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    }).then(() => {
      startTransition(() => router.refresh());
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer text-sm"
        aria-label={t("select")}
      >
        <Globe className="w-4 h-4 text-muted-foreground" />
        {!compact && (
          <span className="text-sm font-medium">{localeNames[locale]}</span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-card border border-border shadow-xl shadow-black/20 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-80 overflow-y-auto">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => change(l)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-secondary transition-colors cursor-pointer text-left"
            >
              <span>{localeNames[l]}</span>
              {l === locale && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
