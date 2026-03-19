"use client";

import { useState, useCallback } from "react";
import { useTelegram } from "@/components/telegram/tg-provider";
import { TgMainButton } from "@/components/telegram/tg-main-button";
import { MessageCircle, Wallet, User } from "lucide-react";

type Tab = "chat" | "balance" | "profile";

function ChatTab() {
  const { user } = useTelegram();

  return (
    <div className="flex flex-col h-full px-4 pt-4 pb-20">
      <h2 className="text-lg font-semibold mb-4">AI-Тренер</h2>
      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
        <MessageCircle className="w-12 h-12 mb-3" />
        <p className="text-sm">
          {user
            ? `${user.name}, задай питання своєму AI-тренеру`
            : "Завантаження..."}
        </p>
        <p className="text-xs mt-1 opacity-60">
          Персональні рекомендації для твоїх тренувань
        </p>
      </div>
    </div>
  );
}

function BalanceTab() {
  return (
    <div className="px-4 pt-4 pb-20">
      <h2 className="text-lg font-semibold mb-4">Баланс</h2>

      <div className="rounded-xl p-4 mb-3 bg-[var(--tg-theme-secondary-bg-color,#1a1a2e)]">
        <div className="text-xs uppercase tracking-wide opacity-60 mb-1">
          Безкоштовні повідомлення
        </div>
        <div className="text-2xl font-bold">50</div>
      </div>

      <div className="rounded-xl p-4 mb-3 bg-[var(--tg-theme-secondary-bg-color,#1a1a2e)]">
        <div className="text-xs uppercase tracking-wide opacity-60 mb-1">
          Тижневий ліміт
        </div>
        <div className="text-2xl font-bold">0</div>
        <div className="text-xs opacity-60 mt-1">
          Доступний з підпискою INDIVIDUAL або вище
        </div>
      </div>

      <div className="rounded-xl p-4 bg-[var(--tg-theme-secondary-bg-color,#1a1a2e)]">
        <div className="text-xs uppercase tracking-wide opacity-60 mb-1">
          Куплені повідомлення
        </div>
        <div className="text-2xl font-bold">0</div>
      </div>
    </div>
  );
}

function ProfileTab() {
  const { user, webApp } = useTelegram();

  return (
    <div className="px-4 pt-4 pb-20">
      <h2 className="text-lg font-semibold mb-4">Профіль</h2>

      <div className="rounded-xl p-4 mb-3 bg-[var(--tg-theme-secondary-bg-color,#1a1a2e)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[var(--tg-theme-button-color,#6c5ce7)] flex items-center justify-center text-lg font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="font-semibold">{user?.name || "Завантаження..."}</div>
            <div className="text-xs opacity-60">
              {user?.role === "ATHLETE" ? "Спортсмен" : user?.role || ""}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4 mb-3 bg-[var(--tg-theme-secondary-bg-color,#1a1a2e)]">
        <div className="text-sm font-medium mb-2">Підписка</div>
        <div className="flex items-center justify-between">
          <span className="text-sm opacity-80">BASIC</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--tg-theme-button-color,#6c5ce7)]/20 text-[var(--tg-theme-button-color,#6c5ce7)]">
            Активна
          </span>
        </div>
      </div>

      <div className="rounded-xl p-4 bg-[var(--tg-theme-secondary-bg-color,#1a1a2e)]">
        <div className="text-sm font-medium mb-2">Платформа</div>
        <div className="text-xs opacity-60">
          Telegram {webApp?.version || ""} / {webApp?.platform || ""}
        </div>
      </div>
    </div>
  );
}

const tabs: Array<{ key: Tab; label: string; Icon: typeof MessageCircle }> = [
  { key: "chat", label: "Чат", Icon: MessageCircle },
  { key: "balance", label: "Баланс", Icon: Wallet },
  { key: "profile", label: "Профіль", Icon: User },
];

export default function TelegramMainPage() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const { isLoading, error, webApp } = useTelegram();

  const handleMainButtonClick = useCallback(() => {
    // Haptic feedback
    webApp?.HapticFeedback.impactOccurred("light");
  }, [webApp]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <div className="w-10 h-10 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm opacity-60">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center">
          <p className="text-sm text-[var(--tg-theme-destructive-text-color,#e74c3c)] mb-2">
            Помилка авторизації
          </p>
          <p className="text-xs opacity-60">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Content area */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "chat" && <ChatTab />}
        {activeTab === "balance" && <BalanceTab />}
        {activeTab === "profile" && <ProfileTab />}
      </main>

      {/* Main button — shows contextually per tab */}
      {activeTab === "chat" && (
        <TgMainButton
          text="Написати тренеру"
          onClick={handleMainButtonClick}
          isVisible={activeTab === "chat"}
        />
      )}

      {activeTab === "balance" && (
        <TgMainButton
          text="Купити повідомлення"
          onClick={handleMainButtonClick}
          isVisible={activeTab === "balance"}
        />
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around h-14 bg-[var(--tg-theme-bottom-bar-bg-color,var(--tg-theme-secondary-bg-color,#1a1a2e))] border-t border-[var(--tg-theme-section-separator-color,rgba(255,255,255,0.08))]">
        {tabs.map(({ key, label, Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                webApp?.HapticFeedback.selectionChanged();
              }}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive
                  ? "text-[var(--tg-theme-button-color,#6c5ce7)]"
                  : "text-[var(--tg-theme-hint-color,rgba(255,255,255,0.4))]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
