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
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400;1,9..144,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap"
        rel="stylesheet"
      />
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <TelegramProvider>
        <TgTrpcProvider>
          <div style={{ height: "100dvh", overflow: "hidden" }}>{children}</div>
        </TgTrpcProvider>
      </TelegramProvider>
    </>
  );
}
