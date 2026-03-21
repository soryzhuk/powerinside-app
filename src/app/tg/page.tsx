"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Wallet, User, Send, ArrowLeft, Crown, Gift, Calendar, ShoppingCart } from "lucide-react";
import { useTelegram } from "@/components/telegram/tg-provider";
import { TgMainButton } from "@/components/telegram/tg-main-button";
import { trpc } from "@/lib/trpc";

type Tab = "chat" | "balance" | "profile";

// ─── CHAT TAB ────────────────────────────────────────────────────────────────

function ChatTab() {
  const { token, webApp } = useTelegram();
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const coachesQuery = trpc.coach.listActive.useQuery(undefined, { enabled: !!token });
  const conversationQuery = trpc.athlete.getConversation.useQuery(
    { conversationId: conversationId! },
    { enabled: !!conversationId && !!token, refetchInterval: false }
  );
  const askMutation = trpc.athlete.askQuestion.useMutation({
    onSuccess: (data) => {
      setConversationId(data.conversationId);
      conversationQuery.refetch();
      setInput("");
    },
  });

  const coaches = coachesQuery.data ?? [];
  const messages = conversationQuery.data?.messages ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    if (!input.trim() || !selectedCoachId || askMutation.isPending) return;
    webApp?.HapticFeedback.impactOccurred("light");
    askMutation.mutate({
      coachId: selectedCoachId,
      content: input.trim(),
      conversationId: conversationId ?? undefined,
    });
  }

  // Coach selection screen
  if (!selectedCoachId) {
    return (
      <div className="px-4 pt-4 pb-20">
        <h2 className="text-lg font-semibold mb-1">Оберіть тренера</h2>
        <p className="text-xs opacity-60 mb-4">AI відповідатиме на основі методики тренера</p>

        {coachesQuery.isLoading && (
          <p className="text-sm opacity-60 text-center py-8">Завантаження...</p>
        )}

        {!coachesQuery.isLoading && coaches.length === 0 && (
          <p className="text-sm opacity-60 text-center py-8">Активних тренерів поки немає</p>
        )}

        <div className="space-y-2">
          {coaches.map((coach) => (
            <button
              key={coach.id}
              onClick={() => {
                setSelectedCoachId(coach.id);
                webApp?.HapticFeedback.selectionChanged();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#1a1a2e)] text-left active:opacity-70 transition-opacity"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-button-color,#6c5ce7)] flex items-center justify-center text-white font-bold shrink-0">
                {coach.user.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{coach.user.name || "Тренер"}</p>
                <p className="text-xs opacity-60">
                  {coach._count.methodologyRules} правил · {coach._count.knowledgeBase} записів
                </p>
              </div>
              <span className="text-xs opacity-40">→</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const selectedCoach = coaches.find((c) => c.id === selectedCoachId);

  // Chat screen
  return (
    <div className="flex flex-col h-screen pb-14">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[var(--tg-theme-secondary-bg-color,#1a1a2e)] border-b border-white/10">
        <button
          onClick={() => { setSelectedCoachId(null); setConversationId(null); }}
          className="p-1 opacity-60 hover:opacity-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-[var(--tg-theme-button-color,#6c5ce7)] flex items-center justify-center text-white text-sm font-bold">
          {selectedCoach?.user.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div>
          <p className="text-sm font-medium">{selectedCoach?.user.name || "Тренер"}</p>
          <p className="text-xs opacity-50">AI-асистент</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !conversationQuery.isLoading && (
          <div className="text-center opacity-50 mt-12">
            <MessageCircle className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm">Постав запитання тренеру</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[var(--tg-theme-button-color,#6c5ce7)] text-white rounded-br-sm"
                  : "bg-[var(--tg-theme-secondary-bg-color,#1a1a2e)] rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {askMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-[var(--tg-theme-secondary-bg-color,#1a1a2e)] px-4 py-2 rounded-2xl rounded-bl-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        {askMutation.error && (
          <p className="text-xs text-center text-red-400">
            {askMutation.error.message.includes("no messages remaining")
              ? "Недостатньо повідомлень. Поповніть баланс."
              : "Помилка. Спробуй ще раз."}
          </p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-14 left-0 right-0 px-3 py-2 bg-[var(--tg-theme-bg-color,#0f0f23)] border-t border-white/10">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Напиши запитання..."
            className="flex-1 px-3 py-2 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#1a1a2e)] text-sm outline-none placeholder:opacity-40"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || askMutation.isPending}
            className="w-9 h-9 rounded-xl bg-[var(--tg-theme-button-color,#6c5ce7)] flex items-center justify-center disabled:opacity-40"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BALANCE TAB ─────────────────────────────────────────────────────────────

function BalanceTab() {
  const { token } = useTelegram();
  const balanceQuery = trpc.athlete.getBalance.useQuery(undefined, { enabled: !!token });
  const balance = balanceQuery.data;

  const items = [
    { label: "Безкоштовні", value: balance?.freeRemaining, icon: Gift, color: "text-green-400" },
    { label: "Тижневі", value: balance?.weeklyRemaining, icon: Calendar, color: "text-blue-400" },
    { label: "Куплені", value: balance?.purchasedRemaining, icon: ShoppingCart, color: "text-[var(--tg-theme-button-color,#6c5ce7)]" },
  ];

  return (
    <div className="px-4 pt-4 pb-20 space-y-3">
      <h2 className="text-lg font-semibold mb-4">Баланс повідомлень</h2>

      {items.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#1a1a2e)]">
          <Icon className={`w-5 h-5 ${color} shrink-0`} />
          <div className="flex-1">
            <p className="text-xs opacity-60">{label}</p>
            <p className="text-2xl font-bold">{balanceQuery.isLoading ? "..." : (value ?? 0)}</p>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#1a1a2e)] border border-[var(--tg-theme-button-color,#6c5ce7)]/30">
        <MessageCircle className="w-5 h-5 text-[var(--tg-theme-button-color,#6c5ce7)] shrink-0" />
        <div>
          <p className="text-xs opacity-60">Загалом</p>
          <p className="text-2xl font-bold">{balanceQuery.isLoading ? "..." : (balance?.total ?? 0)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE TAB ─────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, webApp, token } = useTelegram();
  const subscriptionQuery = trpc.billing.getSubscription.useQuery(undefined, { enabled: !!token });
  const sub = subscriptionQuery.data;
  const hasActiveSub = sub?.status === "ACTIVE";

  return (
    <div className="px-4 pt-4 pb-20 space-y-3">
      <h2 className="text-lg font-semibold mb-4">Профіль</h2>

      {/* User info */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#1a1a2e)]">
        <div className="w-12 h-12 rounded-full bg-[var(--tg-theme-button-color,#6c5ce7)] flex items-center justify-center text-lg font-bold text-white shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div>
          <p className="font-semibold">{user?.name || "..."}</p>
          <p className="text-xs opacity-60">
            {user?.role === "ATHLETE" ? "Спортсмен" : user?.role || ""}
          </p>
        </div>
      </div>

      {/* Subscription */}
      <div className="p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#1a1a2e)]">
        <div className="flex items-center gap-2 mb-2">
          <Crown className={`w-4 h-4 ${hasActiveSub ? "text-yellow-400" : "opacity-40"}`} />
          <p className="text-sm font-medium">Підписка</p>
          {hasActiveSub && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[var(--tg-theme-button-color,#6c5ce7)]/20 text-[var(--tg-theme-button-color,#6c5ce7)]">
              Активна
            </span>
          )}
        </div>

        {subscriptionQuery.isLoading ? (
          <p className="text-xs opacity-60">Завантаження...</p>
        ) : hasActiveSub ? (
          <div>
            <p className="text-sm">{sub?.plan} — $30 / місяць</p>
            {sub?.currentPeriodEnd && (
              <p className="text-xs opacity-60 mt-0.5">
                До: {new Date(sub.currentPeriodEnd).toLocaleDateString("uk")}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs opacity-60">Немає активної підписки</p>
        )}
      </div>

      {/* Platform info */}
      <div className="p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#1a1a2e)]">
        <p className="text-xs opacity-40">
          Telegram {webApp?.version || ""} · {webApp?.platform || ""}
        </p>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const TABS: Array<{ key: Tab; label: string; Icon: typeof MessageCircle }> = [
  { key: "chat", label: "Чат", Icon: MessageCircle },
  { key: "balance", label: "Баланс", Icon: Wallet },
  { key: "profile", label: "Профіль", Icon: User },
];

export default function TelegramMainPage() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const { isLoading, error, webApp, isTelegram } = useTelegram();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-3 opacity-60" />
          <p className="text-sm opacity-60">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (!isTelegram) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium mb-1">Відкрийте у Telegram</p>
          <p className="text-xs opacity-60">Цей додаток доступний лише в Telegram Mini App</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center">
          <p className="text-sm text-red-400 mb-1">Помилка авторизації</p>
          <p className="text-xs opacity-60">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 overflow-y-auto">
        {activeTab === "chat" && <ChatTab />}
        {activeTab === "balance" && <BalanceTab />}
        {activeTab === "profile" && <ProfileTab />}
      </main>

      {activeTab === "chat" && (
        <TgMainButton
          text="Обрати тренера"
          onClick={() => webApp?.HapticFeedback.impactOccurred("light")}
          isVisible={false}
        />
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around h-14 bg-[var(--tg-theme-bottom-bar-bg-color,var(--tg-theme-secondary-bg-color,#1a1a2e))] border-t border-white/8">
        {TABS.map(({ key, label, Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                webApp?.HapticFeedback.selectionChanged();
              }}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors cursor-pointer ${
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
