"use client";

import { useEffect, useCallback, useRef } from "react";
import { useTelegram } from "./tg-provider";

interface TgBackButtonProps {
  /** Whether the back button should be visible */
  visible?: boolean;
  /** Callback when back button is pressed */
  onClick: () => void;
}

/**
 * Wraps the Telegram WebApp BackButton API.
 * Shows/hides the native Telegram back button based on navigation depth.
 * No fallback rendered outside Telegram — the web app uses its own nav.
 */
export function TgBackButton({ visible = true, onClick }: TgBackButtonProps) {
  const { isTelegram, webApp } = useTelegram();
  const callbackRef = useRef(onClick);

  useEffect(() => {
    callbackRef.current = onClick;
  }, [onClick]);

  const stableOnClick = useCallback(() => {
    callbackRef.current();
  }, []);

  useEffect(() => {
    if (!isTelegram || !webApp) return;

    const backButton = webApp.BackButton;

    if (visible) {
      backButton.show();
      backButton.onClick(stableOnClick);
    } else {
      backButton.hide();
    }

    return () => {
      backButton.offClick(stableOnClick);
      backButton.hide();
    };
  }, [isTelegram, webApp, visible, stableOnClick]);

  // No fallback render — Telegram BackButton is native UI.
  // Outside Telegram, navigation uses standard web UI.
  return null;
}
