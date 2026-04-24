"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// Telegram WebApp types (subset of the full API)
interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

interface TelegramMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText: (text: string) => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
  showProgress: (leaveActive?: boolean) => void;
  hideProgress: () => void;
  setParams: (params: {
    text?: string;
    color?: string;
    text_color?: string;
    is_active?: boolean;
    is_visible?: boolean;
    has_shine_effect?: boolean;
  }) => void;
}

interface TelegramBackButton {
  isVisible: boolean;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
  show: () => void;
  hide: () => void;
}

interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  bottom_bar_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  section_separator_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramWebAppUser;
    chat_instance?: string;
    chat_type?: string;
    auth_date: number;
    hash: string;
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: TelegramThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  bottomBarColor: string;
  MainButton: TelegramMainButton;
  BackButton: TelegramBackButton;
  isVersionAtLeast: (version: string) => boolean;
  setHeaderColor: (color: "bg_color" | "secondary_bg_color" | string) => void;
  setBackgroundColor: (color: "bg_color" | "secondary_bg_color" | string) => void;
  setBottomBarColor: (color: "bg_color" | "secondary_bg_color" | string) => void;
  expand: () => void;
  close: () => void;
  ready: () => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  onEvent: (eventType: string, callback: () => void) => void;
  offEvent: (eventType: string, callback: () => void) => void;
  sendData: (data: string) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  HapticFeedback: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface TelegramAuthUser {
  id: string;
  name: string;
  role: string;
  telegramId: string;
}

interface TelegramContextValue {
  isTelegram: boolean;
  webApp: TelegramWebApp | null;
  user: TelegramAuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isNew: boolean;
  setAuth: (token: string, role: string) => void;
}

const TelegramContext = createContext<TelegramContextValue>({
  isTelegram: false,
  webApp: null,
  user: null,
  token: null,
  isLoading: true,
  error: null,
  isNew: false,
  setAuth: () => {},
});

export function useTelegram() {
  return useContext(TelegramContext);
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [user, setUser] = useState<TelegramAuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);

  const setAuth = useCallback((newToken: string, role: string) => {
    setToken(newToken);
    setUser((prev) => prev ? { ...prev, role } : null);
    setIsNew(false);
  }, []);

  const authenticate = useCallback(async (tgWebApp: TelegramWebApp) => {
    try {
      const res = await fetch("/api/telegram/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: tgWebApp.initData }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Authentication failed");
      }

      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      setIsNew(data.isNew ?? false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Auth error";
      setError(message);
      console.error("[TelegramProvider] Auth error:", message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (!tg) {
      setIsTelegram(false);
      setIsLoading(false);
      return;
    }

    // Initialize Telegram WebApp
    setWebApp(tg);
    setIsTelegram(true);

    tg.expand();
    tg.ready();

    // Match Telegram theme
    const isDark = tg.colorScheme === "dark";
    const headerColor = tg.themeParams.header_bg_color || (isDark ? "#1a1a2e" : "#ffffff");
    const bgColor = tg.themeParams.bg_color || (isDark ? "#0f0f23" : "#f8f9fa");

    tg.setHeaderColor(headerColor);
    tg.setBackgroundColor(bgColor);

    if (tg.isVersionAtLeast("7.10")) {
      const bottomColor = tg.themeParams.bottom_bar_bg_color || headerColor;
      tg.setBottomBarColor(bottomColor);
    }

    // Authenticate with backend
    if (tg.initData) {
      authenticate(tg);
    } else {
      setIsLoading(false);
      setError("No init data from Telegram");
    }
  }, [authenticate]);

  return (
    <TelegramContext.Provider
      value={{ isTelegram, webApp, user, token, isLoading, error, isNew, setAuth }}
    >
      {children}
    </TelegramContext.Provider>
  );
}

export type { TelegramWebApp, TelegramWebAppUser, TelegramAuthUser, TelegramContextValue };
