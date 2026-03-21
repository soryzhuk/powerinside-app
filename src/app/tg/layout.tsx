import Script from "next/script";
import { TelegramProvider } from "@/components/telegram/tg-provider";
import { TgTrpcProvider } from "@/components/telegram/tg-trpc-provider";
import type { ReactNode } from "react";

export const metadata = {
  title: "PowerInside — Telegram",
  description: "PowerInside Mini App для Telegram",
};

export default function TelegramLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      <TelegramProvider>
        <TgTrpcProvider>
          <div className="min-h-screen bg-[var(--tg-theme-bg-color,#0f0f23)] text-[var(--tg-theme-text-color,#e0e0e0)]">
            {children}
          </div>
        </TgTrpcProvider>
      </TelegramProvider>
    </>
  );
}
