"use client";

import { useState, useRef, useEffect } from "react";
import { useTelegram } from "@/components/telegram/tg-provider";
import { trpc } from "@/lib/trpc";

// ─── Design tokens ────────────────────────────────────────────────────────────

const P = {
  bg:       "#17140F",
  surface:  "#211D17",
  surface2: "#2A251D",
  line:     "rgba(237,230,215,0.08)",
  lineSoft: "rgba(237,230,215,0.05)",
  text:     "#EDE6D7",
  textDim:  "rgba(237,230,215,0.58)",
  textMute: "rgba(237,230,215,0.36)",
  sand:     "#C9A574",
  sandSoft: "rgba(201,165,116,0.14)",
  stone:    "#8A7F6E",
  success:  "#7D9575",
} as const;

const serif = "'Fraunces', Georgia, serif";
const sans  = "'Inter', system-ui, sans-serif";
const mono  = "'JetBrains Mono', ui-monospace, monospace";

type Tab = "chat" | "balance" | "profile";
type Tone = "sand" | "stone" | "sage" | "dark";
const TONES: Tone[] = ["sand", "sage", "stone", "dark"];

function getInitials(name?: string | null) {
  if (!name) return "TC";
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ initials, size = 40, tone = "sand" }: { initials: string; size?: number; tone?: Tone }) {
  const grad: Record<Tone, string> = {
    sand:  "linear-gradient(135deg,#C9A574,#8A6A3E)",
    stone: "linear-gradient(135deg,#8A7F6E,#5B5248)",
    sage:  "linear-gradient(135deg,#8AA082,#5C7257)",
    dark:  "linear-gradient(135deg,#6B6458,#403A30)",
  };
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2, background: grad[tone],
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#FFF8EA", fontFamily: serif, fontWeight: 500,
      fontSize: size * 0.38, letterSpacing: 0.5, flexShrink: 0,
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.3)",
    }}>{initials}</div>
  );
}

// ─── TabBar ───────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const items: { id: Tab; label: string; icon: (c: string) => React.ReactNode }[] = [
    { id: "chat", label: "Розмова", icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a8 8 0 0 1-11.4 7.2L4 21l1.8-5.6A8 8 0 1 1 21 12z"/>
      </svg>
    )},
    { id: "balance", label: "Баланс", icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/>
        <circle cx="16.5" cy="14.5" r="1.2" fill={c}/>
      </svg>
    )},
    { id: "profile", label: "Профіль", icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="3.8"/><path d="M4 21c1.5-4 4.6-6 8-6s6.5 2 8 6"/>
      </svg>
    )},
  ];
  return (
    <div style={{
      display: "flex", justifyContent: "space-around", alignItems: "center",
      padding: "10px 8px 6px", borderTop: `1px solid ${P.line}`,
      background: P.bg, flexShrink: 0,
    }}>
      {items.map((it) => {
        const on = it.id === active;
        const c = on ? P.sand : P.textMute;
        return (
          <div key={it.id} onClick={() => onChange(it.id)} style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 4, flex: 1, padding: "6px 0", cursor: "pointer",
          }}>
            {it.icon(c)}
            <span style={{ fontSize: 10, letterSpacing: 0.4, textTransform: "uppercase", color: c, fontWeight: 500 }}>
              {it.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── CoachesListScreen ────────────────────────────────────────────────────────

type CoachItem = {
  id: string;
  user: { name?: string | null };
  _count: { methodologyRules: number; knowledgeBase: number };
};

function CoachesListScreen({ coaches, isLoading, onSelect }: {
  coaches: CoachItem[];
  isLoading: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "20px 24px 8px", flexShrink: 0 }}>
        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase", marginBottom: 20 }}>
          Бібліотека тренерів
        </div>
        <div style={{ fontFamily: serif, fontSize: 36, lineHeight: 1, fontWeight: 400, letterSpacing: -0.8, color: P.text }}>
          Обери, з ким<br/>
          <span style={{ fontStyle: "italic", color: P.stone }}>говорити.</span>
        </div>
        <div style={{ fontSize: 13, color: P.textDim, marginTop: 10 }}>
          {isLoading
            ? "Завантаження..."
            : coaches.length > 0
            ? `${coaches.length} активних методологій. Кожна пройшла 7 раундів AI-інтерв'ю.`
            : "Активних тренерів поки немає."}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
        {isLoading && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 32 }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, border: `2px solid ${P.sand}`, borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
          </div>
        )}

        {coaches.map((coach, i) => (
          <div key={coach.id} onClick={() => onSelect(coach.id)} style={{
            background: P.surface, borderRadius: 16, padding: "16px",
            border: `1px solid ${P.line}`, display: "flex", alignItems: "center", gap: 14,
            position: "relative", overflow: "hidden", cursor: "pointer",
          }}>
            {i === 0 && (
              <div style={{ position: "absolute", top: 10, right: 12, fontFamily: mono, fontSize: 9, color: P.sand, letterSpacing: 1 }}>
                ⸻ РЕКОМЕНДОВАНО
              </div>
            )}
            <Avatar initials={getInitials(coach.user.name)} size={48} tone={TONES[i % TONES.length]} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: P.text }}>{coach.user.name || "Тренер"}</div>
              <div style={{ display: "flex", gap: 12, marginTop: 8, fontFamily: mono, fontSize: 10, color: P.textMute }}>
                <span>{coach._count.methodologyRules} правил</span>
                <span style={{ opacity: 0.3 }}>·</span>
                <span>{coach._count.knowledgeBase} записів</span>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </div>
        ))}

        {!isLoading && coaches.length === 0 && (
          <p style={{ textAlign: "center", color: P.textDim, fontSize: 13, marginTop: 40 }}>
            Активних тренерів поки немає
          </p>
        )}
      </div>
    </div>
  );
}

// ─── ChatView ─────────────────────────────────────────────────────────────────

type Msg = { id: string; role: string; content: string };

const EMPTY_PROMPTS = [
  "Склади розминку перед присідом",
  "Чи варто тренуватись при болю в спині?",
  "Як харчуватись у день змагань?",
  "Поясни, що таке авторегуляція",
];

const QUICK_REPLIES = ["Скільки підходів?", "Що їсти після?", "Ще питання"];

function ChatView({ coach, messages, input, onInputChange, onSend, onBack, isPending, error, onPromptSend }: {
  coach: CoachItem;
  messages: Msg[];
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onBack: () => void;
  isPending: boolean;
  error: string | null;
  onPromptSend: (p: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const isEmpty = messages.length === 0 && !isPending;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isPending]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "10px 20px 12px", display: "flex", alignItems: "center", gap: 12,
        borderBottom: `1px solid ${P.line}`, flexShrink: 0,
      }}>
        <div onClick={onBack} style={{ cursor: "pointer", display: "flex", alignItems: "center", padding: "4px 4px 4px 0" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.textDim} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </div>
        <Avatar initials={getInitials(coach.user.name)} size={36} tone="sand" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{coach.user.name || "Тренер"}</div>
          <div style={{ fontSize: 11, color: P.textDim, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 5, height: 5, borderRadius: 3, background: P.success, display: "inline-block" }} />
            AI-методологія · {coach._count.methodologyRules} правил
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {isEmpty && (
          <div style={{ display: "flex", flexDirection: "column", paddingTop: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 32, background: P.sandSoft,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={P.sand} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a8 8 0 0 1-11.4 7.2L4 21l1.8-5.6A8 8 0 1 1 21 12z"/>
              </svg>
            </div>
            <div style={{ fontFamily: serif, fontSize: 26, lineHeight: 1.1, fontWeight: 400, letterSpacing: -0.5, color: P.text, maxWidth: 260 }}>
              Спитай те, що давно<br/>
              <span style={{ fontStyle: "italic", color: P.stone }}>не наважувався.</span>
            </div>
            <div style={{ fontSize: 13, color: P.textDim, marginTop: 10, maxWidth: 270 }}>
              Я відповідаю так, як мій тренер. Мої правила — його методика, не гугл.
            </div>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
              {EMPTY_PROMPTS.map((p, i) => (
                <div key={p} onClick={() => onPromptSend(p)} style={{
                  padding: "13px 14px", borderRadius: 12,
                  background: P.surface, border: `1px solid ${P.line}`,
                  display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                }}>
                  <span style={{ fontFamily: mono, fontSize: 10, color: P.sand, width: 18 }}>0{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{p}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P.stone} strokeWidth="1.6" strokeLinecap="round">
                    <path d="M7 17L17 7M7 7h10v10"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} style={{ alignSelf: "flex-end", maxWidth: "78%" }}>
              <div style={{
                background: P.sand, color: "#17140F",
                padding: "10px 14px", borderRadius: "16px 16px 4px 16px",
                fontSize: 13.5, lineHeight: 1.45, fontWeight: 500,
              }}>{m.content}</div>
            </div>
          ) : (
            <div key={m.id} style={{ alignSelf: "flex-start", maxWidth: "84%" }}>
              <div style={{
                background: P.surface, color: P.text,
                padding: "10px 14px", borderRadius: "16px 16px 16px 4px",
                fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap",
                border: `1px solid ${P.line}`,
              }}>{m.content}</div>
            </div>
          )
        )}

        {isPending && (
          <div style={{ alignSelf: "flex-start" }}>
            <div style={{
              background: P.surface, border: `1px solid ${P.line}`,
              padding: "12px 16px", borderRadius: "16px 16px 16px 4px",
              display: "flex", gap: 5, alignItems: "center",
            }}>
              {[0, 150, 300].map((d) => (
                <span key={d} style={{
                  width: 6, height: 6, borderRadius: 3, background: P.textDim,
                  display: "inline-block", animation: `bounce 1.2s ${d}ms ease-in-out infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <p style={{ textAlign: "center", fontSize: 12, color: "#C99B85" }}>
            {error.includes("no messages remaining")
              ? "Недостатньо повідомлень. Поповніть баланс."
              : "Помилка. Спробуй ще раз."}
          </p>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestion chips (only when there are messages) */}
      {!isEmpty && (
        <div style={{ padding: "4px 20px 8px", display: "flex", gap: 6, overflowX: "auto", flexShrink: 0 }}>
          {QUICK_REPLIES.map((s) => (
            <div key={s} onClick={() => onPromptSend(s)} style={{
              padding: "7px 12px", borderRadius: 999, fontSize: 11.5, color: P.textDim,
              border: `1px solid ${P.line}`, background: P.surface, whiteSpace: "nowrap",
              cursor: "pointer", flexShrink: 0,
            }}>{s}</div>
          ))}
        </div>
      )}

      {/* Composer */}
      <div style={{
        padding: "10px 16px 14px", borderTop: `1px solid ${P.line}`,
        display: "flex", gap: 10, alignItems: "center", flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder="Запитай тренера…"
          style={{
            flex: 1, background: P.surface, borderRadius: 22, padding: "10px 16px",
            fontSize: 13.5, color: P.text, border: `1px solid ${P.line}`,
            outline: "none", fontFamily: sans,
          }}
        />
        <div onClick={onSend} style={{
          width: 44, height: 44, borderRadius: 22, flexShrink: 0,
          background: input.trim() ? P.sand : P.surface,
          border: input.trim() ? "none" : `1px solid ${P.line}`,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          boxShadow: input.trim() ? "0 4px 12px rgba(201,165,116,0.25)" : "none",
          transition: "background 0.15s, box-shadow 0.15s",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? "#17140F" : P.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── ChatTab ──────────────────────────────────────────────────────────────────

function ChatTab() {
  const { token, webApp } = useTelegram();
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");

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
  const messages = (conversationQuery.data?.messages ?? []) as Msg[];
  const selectedCoach = coaches.find((c) => c.id === selectedCoachId);

  function sendMessage(text: string) {
    if (!text.trim() || !selectedCoachId || askMutation.isPending) return;
    webApp?.HapticFeedback?.impactOccurred("light");
    askMutation.mutate({ coachId: selectedCoachId, content: text.trim(), conversationId: conversationId ?? undefined });
  }

  if (!selectedCoachId) {
    return (
      <CoachesListScreen
        coaches={coaches}
        isLoading={coachesQuery.isLoading}
        onSelect={(id) => {
          setSelectedCoachId(id);
          setConversationId(null);
          setInput("");
          webApp?.HapticFeedback?.selectionChanged();
        }}
      />
    );
  }

  if (!selectedCoach) return null;

  return (
    <ChatView
      coach={selectedCoach}
      messages={messages}
      input={input}
      onInputChange={setInput}
      onSend={() => sendMessage(input)}
      onBack={() => { setSelectedCoachId(null); setConversationId(null); setInput(""); }}
      isPending={askMutation.isPending}
      error={askMutation.error?.message ?? null}
      onPromptSend={(p) => sendMessage(p)}
    />
  );
}

// ─── BalanceTab ───────────────────────────────────────────────────────────────

function BalanceTab() {
  const { token } = useTelegram();
  const balanceQuery = trpc.athlete.getBalance.useQuery(undefined, { enabled: !!token });
  const subscriptionQuery = trpc.billing.getSubscription.useQuery(undefined, { enabled: !!token });
  const balance = balanceQuery.data;
  const sub = subscriptionQuery.data;

  const free      = balance?.freeRemaining ?? 0;
  const weekly    = balance?.weeklyRemaining ?? 0;
  const purchased = balance?.purchasedRemaining ?? 0;
  const total     = balance?.total ?? free + weekly + purchased;

  const PACKS = [
    { n: 50,  price: "$5",  label: "Для розминки",  hot: false },
    { n: 200, price: "$15", label: "Популярний",     hot: true  },
    { n: 500, price: "$30", label: "Найвигідніше",  hot: false },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 24px" }}>
      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase", marginBottom: 18 }}>
        Баланс
      </div>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(180deg, ${P.surface2} 0%, ${P.surface} 100%)`,
        borderRadius: 20, padding: "22px 22px 20px",
        border: `1px solid ${P.line}`, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, right: 0, fontFamily: mono, fontSize: 9, color: P.textMute, padding: "10px 14px", letterSpacing: 1 }}>
          ВСЬОГО / ЗАЛИШОК
        </div>
        <div style={{ fontFamily: serif, fontSize: 80, lineHeight: 0.9, fontWeight: 400, color: P.text, letterSpacing: -2.5 }}>
          {balanceQuery.isLoading ? "·" : total}
        </div>
        <div style={{ fontSize: 12, color: P.textDim, marginTop: 6 }}>повідомлень до тренера</div>

        <div style={{ marginTop: 20, display: "flex", height: 6, borderRadius: 3, overflow: "hidden", gap: 2 }}>
          <div style={{ flex: Math.max(free, 1), background: P.success, opacity: 0.7 }} />
          <div style={{ flex: Math.max(weekly, 1), background: "#7A8BA0", opacity: 0.7 }} />
          <div style={{ flex: Math.max(purchased, 1), background: P.sand }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: mono, fontSize: 10, color: P.textMute }}>
          <span>● {free} безкоштовних</span>
          <span>● {weekly} тижневих</span>
          <span>● {purchased} куплених</span>
        </div>
      </div>

      {/* Subscription */}
      {sub && (
        <div style={{
          marginTop: 14, padding: "14px 16px", background: P.surface,
          borderRadius: 14, border: `1px solid ${P.line}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: P.sandSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.sand} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>
              {sub.plan} · {sub.status === "ACTIVE" ? "активна" : "неактивна"}
            </div>
            {sub.currentPeriodEnd && (
              <div style={{ fontSize: 11.5, color: P.textDim, marginTop: 1 }}>
                Продовжиться {new Date(sub.currentPeriodEnd).toLocaleDateString("uk")} · $30
              </div>
            )}
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.stone} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6"/>
          </svg>
        </div>
      )}

      {/* Packs */}
      <div style={{ marginTop: 22 }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase", marginBottom: 10 }}>
          — Пакети повідомлень
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PACKS.map((it) => (
            <div key={it.n} style={{
              padding: "14px 16px", borderRadius: 14,
              background: it.hot ? P.surface2 : P.surface,
              border: `1px solid ${it.hot ? P.sand + "44" : P.line}`,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 400, color: P.text, letterSpacing: -0.5, width: 58 }}>
                {it.n}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{it.label}</div>
                <div style={{ fontSize: 11, color: P.textDim, marginTop: 1 }}>
                  ≈ ${(parseFloat(it.price.slice(1)) / it.n * 100).toFixed(1)} / 100 повідомл.
                </div>
              </div>
              <div style={{
                padding: "8px 14px", borderRadius: 10,
                background: it.hot ? P.sand : "transparent",
                color: it.hot ? "#17140F" : P.text,
                border: it.hot ? "none" : `1px solid ${P.line}`,
                fontSize: 13, fontWeight: 600,
              }}>{it.price}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ProfileTab ───────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, token } = useTelegram();
  const subscriptionQuery = trpc.billing.getSubscription.useQuery(undefined, { enabled: !!token });
  const sub = subscriptionQuery.data;
  const initials = getInitials(user?.name);

  const rows: [string, string][] = [
    ["Підписка", sub?.plan ?? (subscriptionQuery.isLoading ? "..." : "Немає")],
    ["Сповіщення", "Увімкнено"],
    ["Мова", "Українська"],
    ["Зв'язатись з підтримкою", ""],
    ["Вийти з акаунту", ""],
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 24px" }}>
      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase", marginBottom: 20 }}>
        Профіль
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Avatar initials={initials} size={68} tone="stone" />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 400, letterSpacing: -0.3 }}>{user?.name || "..."}</div>
          <div style={{ fontSize: 12, color: P.textDim, marginTop: 2 }}>
            {user?.role === "ATHLETE" ? "Спортсмен" : user?.role || "Атлет"}
          </div>
          {sub?.status === "ACTIVE" && (
            <div style={{
              marginTop: 8, display: "inline-flex", gap: 6, alignItems: "center",
              padding: "4px 10px", borderRadius: 999,
              background: P.sandSoft, color: P.sand,
              fontFamily: mono, fontSize: 10, letterSpacing: 1,
            }}>● {sub.plan}</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase", marginBottom: 10 }}>
          — Налаштування
        </div>
        <div style={{ background: P.surface, borderRadius: 14, border: `1px solid ${P.line}`, overflow: "hidden" }}>
          {rows.map(([label, value], i) => (
            <div key={label} style={{
              padding: "14px 16px", display: "flex", alignItems: "center",
              borderBottom: i < rows.length - 1 ? `1px solid ${P.lineSoft}` : "none",
            }}>
              <div style={{ flex: 1, fontSize: 13.5, color: i === rows.length - 1 ? "#C99B85" : P.text }}>{label}</div>
              {value && <span style={{ fontSize: 12, color: P.textDim, marginRight: 8 }}>{value}</span>}
              {i < rows.length - 1 && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P.stone} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20, fontFamily: mono, fontSize: 10, color: P.textMute, textAlign: "center" }}>
        POWERINSIDE · V 0.1 · TELEGRAM MINI APP
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TelegramMainPage() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const { isLoading, error, webApp } = useTelegram();

  if (isLoading) {
    return (
      <div style={{
        height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 14, background: P.bg, fontFamily: sans,
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 16, border: `2px solid ${P.sand}`, borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
        <p style={{ fontSize: 13, color: P.textDim }}>Завантаження…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 8, background: P.bg, padding: "0 24px", fontFamily: sans,
      }}>
        <p style={{ fontSize: 14, color: "#C99B85" }}>Помилка авторизації</p>
        <p style={{ fontSize: 12, color: P.textDim, textAlign: "center" }}>{error}</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        input { background: transparent; }
        input::placeholder { color: ${P.textMute}; }
        ::-webkit-scrollbar { display: none; }
        scrollbar-width: none;
      `}</style>
      <div style={{
        height: "100dvh", display: "flex", flexDirection: "column",
        background: P.bg, color: P.text, fontFamily: sans, overflow: "hidden",
      }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {activeTab === "chat"    && <ChatTab />}
          {activeTab === "balance" && <BalanceTab />}
          {activeTab === "profile" && <ProfileTab />}
        </div>
        <TabBar
          active={activeTab}
          onChange={(t) => {
            setActiveTab(t);
            webApp?.HapticFeedback?.selectionChanged();
          }}
        />
      </div>
    </>
  );
}
