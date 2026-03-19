"use client";

import { useEffect, useCallback, useRef } from "react";
import { useTelegram } from "./tg-provider";
import { Button } from "@/components/ui/button";

interface TgMainButtonProps {
  text: string;
  onClick: () => void;
  isLoading?: boolean;
  isVisible?: boolean;
  color?: string;
  textColor?: string;
}

/**
 * Wraps the Telegram WebApp MainButton API.
 * Falls back to a regular Button when not running inside Telegram.
 */
export function TgMainButton({
  text,
  onClick,
  isLoading = false,
  isVisible = true,
  color,
  textColor,
}: TgMainButtonProps) {
  const { isTelegram, webApp } = useTelegram();
  const callbackRef = useRef(onClick);

  // Keep callback ref up to date without re-subscribing
  useEffect(() => {
    callbackRef.current = onClick;
  }, [onClick]);

  const stableOnClick = useCallback(() => {
    callbackRef.current();
  }, []);

  useEffect(() => {
    if (!isTelegram || !webApp) return;

    const btn = webApp.MainButton;

    // Set button params
    btn.setParams({
      text,
      ...(color ? { color } : {}),
      ...(textColor ? { text_color: textColor } : {}),
      is_active: !isLoading,
    });

    // Loading state
    if (isLoading) {
      btn.showProgress(true);
    } else {
      btn.hideProgress();
    }

    // Visibility
    if (isVisible) {
      btn.show();
    } else {
      btn.hide();
    }

    // Click handler
    btn.onClick(stableOnClick);

    return () => {
      btn.offClick(stableOnClick);
      btn.hide();
    };
  }, [isTelegram, webApp, text, isLoading, isVisible, color, textColor, stableOnClick]);

  // Fallback: render a regular button when not in Telegram
  if (isTelegram) {
    return null; // Telegram handles the MainButton natively
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border-light">
      <Button
        onClick={onClick}
        loading={isLoading}
        fullWidth
        size="lg"
        variant="primary"
      >
        {text}
      </Button>
    </div>
  );
}
