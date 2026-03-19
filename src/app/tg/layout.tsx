import { TelegramProvider } from "@/components/telegram/tg-provider";
import type { ReactNode } from "react";

export const metadata = {
  title: "PowerInside — Telegram",
  description: "PowerInside Mini App для Telegram",
};

export default function TelegramLayout({ children }: { children: ReactNode }) {
  return (
    <TelegramProvider>
      <div className="min-h-screen bg-[var(--tg-theme-bg-color,#0f0f23)] text-[var(--tg-theme-text-color,#e0e0e0)]">
        {children}
      </div>
    </TelegramProvider>
  );
}
