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

type Tab = "chat" | "balance" | "profile" | "admin";
type CoachTab = "interview" | "profile";
type Tone = "sand" | "stone" | "sage" | "dark";
const TONES: Tone[] = ["sand", "sage", "stone", "dark"];

function getInitials(name?: string | null) {
  if (!name) return "TC";
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

// ─── ROUNDS config ────────────────────────────────────────────────────────────

const ROUNDS = [
  { key: "TARGET_ATHLETE",     label: "Цільовий атлет",              desc: "Для кого розроблена система тренувань" },
  { key: "LOAD_MANAGEMENT",    label: "Управління навантаженням",     desc: "Як підбираються робочі ваги" },
  { key: "AUTOREGULATION",     label: "Авторегуляція",                desc: "Як тренування змінюється при втомі та недовідновленні" },
  { key: "PROGRESSION_DELOAD", label: "Прогресія та розвантаження",   desc: "Як зростає навантаження з часом" },
  { key: "EXERCISE_SELECTION", label: "Підбір вправ",                 desc: "Логіка підбору вправ" },
  { key: "TECHNIQUE_STANDARDS",label: "Стандарти техніки",            desc: "Технічні стандарти та вимоги" },
  { key: "LIFESTYLE_RECOVERY", label: "Спосіб життя та відновлення",  desc: "Зовнішні фактори, що впливають на тренування" },
] as const;

type RoundKey = (typeof ROUNDS)[number]["key"];

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

// ─── TabBar (athlete) ─────────────────────────────────────────────────────────

function TabBar({ active, onChange, isAdmin = false }: { active: Tab; onChange: (t: Tab) => void; isAdmin?: boolean }) {
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
    ...(isAdmin ? [{ id: "admin" as Tab, label: "Адмін", icon: (c: string) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
      </svg>
    )}] : []),
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

// ─── CoachTabBar ──────────────────────────────────────────────────────────────

function CoachTabBar({ active, onChange }: { active: CoachTab; onChange: (t: CoachTab) => void }) {
  const items: { id: CoachTab; label: string; icon: (c: string) => React.ReactNode }[] = [
    { id: "interview", label: "Інтерв'ю", icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/>
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

// ─── OnboardingScreen ─────────────────────────────────────────────────────────

function OnboardingScreen({ onSelect, isPending }: {
  onSelect: (role: "ATHLETE" | "COACH") => void;
  isPending: boolean;
}) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top label */}
      <div style={{ padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase" }}>
          Powerinside · Est 2026
        </div>
      </div>

      {/* Editorial frame */}
      <div style={{ flex: 1, overflow: "hidden", padding: "20px 28px 0" }}>
        <div style={{
          position: "relative", height: 260, borderRadius: 18,
          background: "linear-gradient(180deg,#2A251D 0%,#1B1812 100%)",
          overflow: "hidden", border: `1px solid ${P.line}`,
        }}>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "repeating-linear-gradient(45deg, rgba(201,165,116,0.06) 0 10px, transparent 10px 20px)",
          }} />
          <div style={{
            position: "absolute", left: 24, top: 24, right: 24,
            display: "flex", justifyContent: "space-between",
            fontFamily: mono, fontSize: 10, color: P.textMute, letterSpacing: 1,
          }}>
            <span>N° 001</span><span>— METHODOLOGY —</span><span>∞</span>
          </div>
          <div style={{
            position: "absolute", left: 24, right: 24, bottom: 80,
            fontFamily: serif, fontSize: 66, lineHeight: 0.88, color: P.text,
            fontWeight: 400, letterSpacing: -2,
          }}>
            Power<span style={{ fontStyle: "italic", color: P.sand }}>Inside</span>
            <sup style={{ fontSize: 14, fontFamily: sans, fontStyle: "normal", color: P.textMute, verticalAlign: "super", lineHeight: 0 }}>™</sup>
          </div>
          <div style={{
            position: "absolute", left: 24, right: 24, bottom: 20,
            fontSize: 12.5, lineHeight: 1.5, color: P.textDim,
          }}>
            Розмова з методикою тренера. Без шаблонів — тільки те, що він сам би сказав.
          </div>
        </div>

        {/* Role selection */}
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase", marginBottom: 4 }}>
            — Обери свою роль
          </div>

          {/* Athlete card */}
          <div onClick={() => !isPending && onSelect("ATHLETE")} style={{
            background: P.surface, borderRadius: 16, padding: "18px 20px",
            border: `1px solid ${P.line}`, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 16,
            opacity: isPending ? 0.6 : 1,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 22, background: P.sandSoft,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.sand} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="3.8"/><path d="M4 21c1.5-4 4.6-6 8-6s6.5 2 8 6"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: P.text }}>Я атлет</div>
              <div style={{ fontSize: 12, color: P.textDim, marginTop: 2 }}>
                Задаю питання тренерам і отримую відповіді з їх методики
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </div>

          {/* Coach card */}
          <div onClick={() => !isPending && onSelect("COACH")} style={{
            background: P.surface2, borderRadius: 16, padding: "18px 20px",
            border: `1px solid ${P.sand}44`, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 16,
            opacity: isPending ? 0.6 : 1,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 22, background: P.sandSoft,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.sand} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: P.text }}>Я тренер</div>
              <div style={{ fontSize: 12, color: P.textDim, marginTop: 2 }}>
                Проходжу інтерв'ю з 7 раундів — моя методика стає базою для атлетів
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 28px 20px" }}>
        <div style={{ textAlign: "center", fontSize: 11.5, color: P.textMute, fontFamily: mono, letterSpacing: 0.5 }}>
          {isPending ? "Зберігаємо вибір…" : "Вибір можна змінити через підтримку"}
        </div>
      </div>
    </div>
  );
}

// ─── CoachInterviewList ───────────────────────────────────────────────────────

function CoachInterviewList({ onSelect, completedRounds }: {
  onSelect: (round: RoundKey) => void;
  completedRounds: Set<string>;
}) {
  const done = completedRounds.size;
  const pct = Math.round((done / ROUNDS.length) * 100);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase", marginBottom: 16 }}>
          Інтерв'ю з методики
        </div>
        <div style={{ fontFamily: serif, fontSize: 30, lineHeight: 1.05, fontWeight: 400, letterSpacing: -0.5, color: P.text }}>
          Розкажи, як ти<br/>
          <span style={{ fontStyle: "italic", color: P.stone }}>тренуєш.</span>
        </div>
        <div style={{ fontSize: 13, color: P.textDim, marginTop: 8, marginBottom: 16 }}>
          {done === 0
            ? "7 раундів питань. Твої відповіді — основа методики."
            : done < ROUNDS.length
            ? `${done} з ${ROUNDS.length} раундів завершено. Продовжуй.`
            : "Всі раунди завершено! Методика записана."}
        </div>

        {/* Progress bar */}
        <div style={{ background: P.surface2, borderRadius: 4, height: 6, overflow: "hidden", marginBottom: 4 }}>
          <div style={{ height: "100%", background: P.sand, width: `${pct}%`, transition: "width 0.4s", borderRadius: 4 }} />
        </div>
        <div style={{ fontFamily: mono, fontSize: 10, color: P.textMute, marginBottom: 16 }}>
          {done} / {ROUNDS.length} раундів · {pct}%
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {ROUNDS.map((r, i) => {
          const isDone = completedRounds.has(r.key);
          return (
            <div key={r.key} onClick={() => onSelect(r.key as RoundKey)} style={{
              background: isDone ? P.surface : P.surface,
              borderRadius: 14, padding: "14px 16px",
              border: `1px solid ${isDone ? P.sand + "33" : P.line}`,
              display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 16, flexShrink: 0,
                background: isDone ? P.sandSoft : P.surface2,
                border: `1px solid ${isDone ? P.sand + "66" : P.line}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.sand} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                ) : (
                  <span style={{ fontFamily: mono, fontSize: 10, color: P.textMute }}>0{i + 1}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: isDone ? P.textDim : P.text }}>{r.label}</div>
                <div style={{ fontSize: 11.5, color: P.textMute, marginTop: 2 }}>{r.desc}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.stone} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6"/>
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CoachInterviewChat ───────────────────────────────────────────────────────

type IMsg = { id: string; role: string; content: string };

async function playTTS(text: string) {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
  } catch { /* ignore */ }
}

function CoachInterviewChat({ roundKey, onBack, onComplete }: {
  roundKey: RoundKey;
  onBack: () => void;
  onComplete: () => void;
}) {
  const { token, webApp } = useTelegram();
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<IMsg[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const round = ROUNDS.find((r) => r.key === roundKey)!;

  const sessionQuery = trpc.coach.getInterviewSession.useQuery(
    { round: roundKey },
    { enabled: !!token }
  );

  const sendMutation = trpc.coach.sendInterviewMessage.useMutation({
    onSuccess: (result) => {
      setLocalMessages((prev) => [...prev, { id: result.message.id, role: "assistant", content: result.message.content }]);
      if (voiceMode) playTTS(result.message.content);
    },
  });

  const completeMutation = trpc.coach.completeRound.useMutation({
    onSuccess: () => onComplete(),
  });

  useEffect(() => {
    if (sessionQuery.data) {
      setSessionId(sessionQuery.data.id);
      setLocalMessages(sessionQuery.data.messages.map((m) => ({
        id: m.id, role: m.role, content: m.content,
      })));
    }
  }, [sessionQuery.data]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages.length, sendMutation.isPending]);

  function sendText(text: string) {
    if (!text.trim() || !sessionId || sendMutation.isPending) return;
    webApp?.HapticFeedback?.impactOccurred("light");
    setLocalMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: text.trim() }]);
    sendMutation.mutate({ sessionId, content: text.trim() });
    setInput("");
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setTranscribing(true);
        try {
          const fd = new FormData();
          fd.append("audio", blob, "audio.webm");
          const res = await fetch("/api/stt", { method: "POST", body: fd });
          const data = await res.json() as { text?: string };
          if (data.text?.trim()) sendText(data.text.trim());
        } catch { /* ignore */ } finally {
          setTranscribing(false);
        }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      webApp?.HapticFeedback?.impactOccurred("medium");
    } catch { /* mic denied */ }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
    webApp?.HapticFeedback?.impactOccurred("light");
  }

  const isCompleted = sessionQuery.data?.status === "COMPLETED";
  const isBusy = sendMutation.isPending || transcribing;

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
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{round.label}</div>
          <div style={{ fontSize: 11, color: isCompleted ? P.success : P.textDim, fontFamily: mono }}>
            {isCompleted ? "✓ Завершено" : "Дай розгорнуту відповідь"}
          </div>
        </div>
        {/* Voice/Text toggle */}
        {!isCompleted && (
          <div onClick={() => setVoiceMode((v) => !v)} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
            borderRadius: 20, cursor: "pointer", flexShrink: 0,
            background: voiceMode ? P.sandSoft : P.surface,
            border: `1px solid ${voiceMode ? P.sand : P.line}`,
          }}>
            {voiceMode ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={P.sand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={P.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            )}
            <span style={{ fontSize: 10, fontFamily: mono, color: voiceMode ? P.sand : P.textDim, letterSpacing: 0.5 }}>
              {voiceMode ? "ГОЛОС" : "ТЕКСТ"}
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {localMessages.length === 0 && !sessionQuery.isLoading && (
          <div style={{ padding: "20px 0" }}>
            <div style={{ fontFamily: serif, fontSize: 22, lineHeight: 1.15, fontWeight: 400, color: P.text, marginBottom: 10 }}>
              {round.desc}
            </div>
            <div style={{ fontSize: 13, color: P.textDim, lineHeight: 1.5 }}>
              Розкажи докладно — чим більше деталей, тим точніше твоя методика буде представлена атлетам.
            </div>
          </div>
        )}

        {localMessages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} style={{ alignSelf: "flex-end", maxWidth: "78%" }}>
              <div style={{
                background: P.sand, color: "#17140F", padding: "10px 14px",
                borderRadius: "16px 16px 4px 16px", fontSize: 13.5, lineHeight: 1.45, fontWeight: 500,
              }}>{m.content}</div>
            </div>
          ) : (
            <div key={m.id} style={{ alignSelf: "flex-start", maxWidth: "88%" }}>
              <div style={{
                background: P.surface, color: P.text, padding: "10px 14px",
                borderRadius: "16px 16px 16px 4px", fontSize: 13.5, lineHeight: 1.5,
                whiteSpace: "pre-wrap", border: `1px solid ${P.line}`,
              }}>{m.content}</div>
            </div>
          )
        )}

        {isBusy && (
          <div style={{ alignSelf: "flex-start" }}>
            <div style={{
              background: P.surface, border: `1px solid ${P.line}`,
              padding: "12px 16px", borderRadius: "16px 16px 16px 4px",
              display: "flex", gap: 5, alignItems: "center",
            }}>
              {transcribing
                ? <span style={{ fontSize: 11, color: P.textDim, fontFamily: mono }}>Розпізнаю…</span>
                : [0, 150, 300].map((d) => (
                    <span key={d} style={{
                      width: 6, height: 6, borderRadius: 3, background: P.textDim,
                      display: "inline-block", animation: `bounce 1.2s ${d}ms ease-in-out infinite`,
                    }} />
                  ))
              }
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      {!isCompleted && (
        <div style={{
          padding: "10px 16px 14px", borderTop: `1px solid ${P.line}`,
          display: "flex", gap: 10, alignItems: "center", flexShrink: 0,
        }}>
          {voiceMode ? (
            /* Voice composer */
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div
                onPointerDown={startRecording}
                onPointerUp={stopRecording}
                onPointerLeave={stopRecording}
                style={{
                  width: 72, height: 72, borderRadius: 36, flexShrink: 0,
                  background: recording ? "#C9A574" : P.surface,
                  border: `2px solid ${recording ? P.sand : P.line}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", touchAction: "none",
                  boxShadow: recording ? "0 0 0 8px rgba(201,165,116,0.18)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={recording ? "#17140F" : P.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                </svg>
              </div>
            </div>
          ) : (
            /* Text composer */
            <>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(input); } }}
                placeholder="Відповідай докладно…"
                style={{
                  flex: 1, background: P.surface, borderRadius: 22, padding: "10px 16px",
                  fontSize: 13.5, color: P.text, border: `1px solid ${P.line}`,
                  outline: "none", fontFamily: sans,
                }}
              />
              <div onClick={() => sendText(input)} style={{
                width: 44, height: 44, borderRadius: 22, flexShrink: 0,
                background: input.trim() ? P.sand : P.surface,
                border: input.trim() ? "none" : `1px solid ${P.line}`,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                boxShadow: input.trim() ? "0 4px 12px rgba(201,165,116,0.25)" : "none",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? "#17140F" : P.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SportSelectionScreen ─────────────────────────────────────────────────────

function SportSelectionScreen({ onDone }: { onDone: () => void }) {
  const { token } = useTelegram();
  const sportsQuery = trpc.sport.list.useQuery(undefined, { enabled: !!token });
  const selectMutation = trpc.coach.selectSport.useMutation({ onSuccess: onDone });
  const proposeMutation = trpc.coach.proposeCustomSport.useMutation({
    onSuccess: (res) => { if (res.approved) onDone(); else setStep("pending"); },
  });
  const [step, setStep] = useState<"list" | "custom" | "pending">("list");
  const [customName, setCustomName] = useState("");

  const sports = sportsQuery.data ?? [];

  if (step === "pending") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
        <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 400, color: P.text, marginBottom: 12 }}>На модерації</div>
        <div style={{ fontSize: 13.5, color: P.textDim, lineHeight: 1.6 }}>
          Твій вид спорту відправлено адміністратору. Після схвалення ти отримаєш повідомлення в Telegram і зможеш пройти інтерв&apos;ю.
        </div>
      </div>
    );
  }

  if (step === "custom") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 24px" }}>
        <div onClick={() => setStep("list")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 28, color: P.textDim }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={P.textDim} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          <span style={{ fontSize: 13 }}>Назад</span>
        </div>
        <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 400, color: P.text, marginBottom: 8 }}>Свій вид спорту</div>
        <div style={{ fontSize: 13, color: P.textDim, marginBottom: 24, lineHeight: 1.5 }}>Напиши назву — адміністратор розгляне та схвалить.</div>
        <input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="Назва виду спорту…"
          style={{
            background: P.surface, borderRadius: 14, padding: "14px 16px",
            fontSize: 15, color: P.text, border: `1px solid ${P.line}`,
            outline: "none", fontFamily: sans, marginBottom: 16,
          }}
        />
        <div
          onClick={() => { if (customName.trim()) proposeMutation.mutate({ name: customName.trim() }); }}
          style={{
            background: customName.trim() ? P.sand : P.surface,
            color: customName.trim() ? "#17140F" : P.textMute,
            borderRadius: 14, padding: "14px", textAlign: "center",
            fontSize: 14, fontWeight: 600, cursor: customName.trim() ? "pointer" : "default",
            border: `1px solid ${customName.trim() ? P.sand : P.line}`,
            opacity: proposeMutation.isPending ? 0.6 : 1,
          }}
        >
          {proposeMutation.isPending ? "Відправляю…" : "Відправити на модерацію"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "24px 24px 16px", flexShrink: 0 }}>
        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase", marginBottom: 8 }}>
          Powerinside · Крок 2
        </div>
        <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 400, color: P.text, marginBottom: 6 }}>Твій вид спорту</div>
        <div style={{ fontSize: 13, color: P.textDim, lineHeight: 1.5 }}>Обери дисципліну, в якій ти тренуєш атлетів.</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
        {sportsQuery.isLoading
          ? <div style={{ textAlign: "center", color: P.textDim, fontSize: 13, paddingTop: 32 }}>Завантаження…</div>
          : sports.map((s) => (
              <div key={s.id} onClick={() => selectMutation.mutate({ sportId: s.id })} style={{
                background: P.surface, borderRadius: 14, padding: "16px 18px",
                border: `1px solid ${P.line}`, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                opacity: selectMutation.isPending ? 0.6 : 1,
              }}>
                <span style={{ fontSize: 15, color: P.text, fontWeight: 500 }}>{s.name}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.stone} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
              </div>
            ))
        }
        <div onClick={() => setStep("custom")} style={{
          background: "transparent", borderRadius: 14, padding: "16px 18px",
          border: `1px dashed ${P.line}`, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={P.textDim} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          <span style={{ fontSize: 14, color: P.textDim }}>Додати свій вид спорту</span>
        </div>
      </div>
    </div>
  );
}

// ─── CoachProfileScreen ───────────────────────────────────────────────────────

function CoachProfileScreen() {
  const { user, token } = useTelegram();
  const profileQuery = trpc.coach.getProfile.useQuery(undefined, { enabled: !!token });
  const profile = profileQuery.data;
  const initials = getInitials(user?.name);
  const isActive = profile?.status === "ACTIVE";

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 24px" }}>
      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase", marginBottom: 20 }}>
        Профіль тренера
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <Avatar initials={initials} size={68} tone="sand" />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, letterSpacing: -0.3 }}>{user?.name || "..."}</div>
          <div style={{
            marginTop: 8, display: "inline-flex", gap: 6, alignItems: "center",
            padding: "4px 10px", borderRadius: 999, fontFamily: mono, fontSize: 10, letterSpacing: 1,
            background: isActive ? "rgba(125,149,117,0.15)" : P.sandSoft,
            color: isActive ? P.success : P.sand,
          }}>
            {isActive ? "● АКТИВНИЙ" : "● ОЧІКУЄ АКТИВАЦІЇ"}
          </div>
        </div>
      </div>

      {/* Stats */}
      {profile && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0,
          background: P.surface, borderRadius: 16, border: `1px solid ${P.line}`,
          overflow: "hidden", marginBottom: 20,
        }}>
          {[
            [profile._count.methodologyRules, "Правил"],
            [profile._count.knowledgeBase,    "Записів"],
            [profile._count.interviewSessions, "/ 7 раундів"],
          ].map(([n, l], i) => (
            <div key={String(l)} style={{
              padding: "16px 10px", textAlign: "center",
              borderRight: i < 2 ? `1px solid ${P.line}` : "none",
            }}>
              <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 400, color: P.text, letterSpacing: -0.5 }}>{n}</div>
              <div style={{ fontSize: 10.5, color: P.textDim, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {!isActive && (
        <div style={{
          background: P.surface, borderRadius: 14, padding: "16px 18px",
          border: `1px solid ${P.line}`,
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: P.text, marginBottom: 6 }}>
            Що далі?
          </div>
          <div style={{ fontSize: 12.5, color: P.textDim, lineHeight: 1.6 }}>
            Після завершення інтерв'ю адміністратор перевірить твою методику і активує профіль. Після активації атлети зможуть ставити тобі запитання.
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, fontFamily: mono, fontSize: 10, color: P.textMute, textAlign: "center" }}>
        POWERINSIDE · ТРЕНЕР · V 0.1
      </div>
    </div>
  );
}

// ─── CoachPage ────────────────────────────────────────────────────────────────

function CoachInterviewTabContent() {
  const { token } = useTelegram();
  const [activeRound, setActiveRound] = useState<RoundKey | null>(null);

  const statusesQuery = trpc.coach.listSessionStatuses.useQuery(undefined, { enabled: !!token });
  const completedRounds = new Set<string>(
    (statusesQuery.data ?? []).filter((s) => s.status === "COMPLETED").map((s) => s.round)
  );

  if (activeRound !== null) {
    return (
      <CoachInterviewChat
        roundKey={activeRound}
        onBack={() => setActiveRound(null)}
        onComplete={() => { setActiveRound(null); statusesQuery.refetch(); }}
      />
    );
  }
  return <CoachInterviewList onSelect={(r) => setActiveRound(r)} completedRounds={completedRounds} />;
}

function CoachPage() {
  const { token } = useTelegram();
  const [activeTab, setActiveTab] = useState<CoachTab>("interview");
  const [sportSelected, setSportSelected] = useState<boolean | null>(null);
  const sportInfoQuery = trpc.coach.getSportInfo.useQuery(undefined, { enabled: !!token });

  useEffect(() => {
    if (sportInfoQuery.data !== undefined) {
      const d = sportInfoQuery.data;
      if (!d) { setSportSelected(false); return; }
      const hasSport = !!d.sportId || (!!d.customSport && !d.customSportApproved);
      setSportSelected(hasSport);
    }
  }, [sportInfoQuery.data]);

  if (sportInfoQuery.isLoading || sportSelected === null) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: P.bg }}>
        <div style={{ width: 28, height: 28, borderRadius: 14, border: `2px solid ${P.sand}`, borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  // custom sport pending moderation
  if (sportInfoQuery.data?.customSport && !sportInfoQuery.data?.customSportApproved && !sportInfoQuery.data?.sportId) {
    return (
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: P.bg, color: P.text, fontFamily: sans }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
          <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 400, color: P.text, marginBottom: 12 }}>На модерації</div>
          <div style={{ fontSize: 13.5, color: P.textDim, lineHeight: 1.6 }}>
            Твій вид спорту <b style={{ color: P.sand }}>{sportInfoQuery.data.customSport}</b> відправлено адміністратору. Після схвалення ти отримаєш повідомлення в Telegram.
          </div>
        </div>
      </div>
    );
  }

  if (!sportSelected) {
    return (
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: P.bg, color: P.text, fontFamily: sans, overflow: "hidden" }}>
        <SportSelectionScreen onDone={() => sportInfoQuery.refetch().then(() => setSportSelected(true))} />
      </div>
    );
  }

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeTab === "interview" && <CoachInterviewTabContent />}
        {activeTab === "profile"   && <CoachProfileScreen />}
      </div>
      <CoachTabBar active={activeTab} onChange={(t) => setActiveTab(t)} />
    </div>
  );
}

// ─── ATHLETE TABS ─────────────────────────────────────────────────────────────

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
          {isLoading ? "Завантаження..." : coaches.length > 0
            ? `${coaches.length} активних методологій.`
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
            Методологія · {coach._count.methodologyRules} правил
          </div>
        </div>
      </div>

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
              Я відповідаю так, як мій тренер. Мої правила — його методика.
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
              <div style={{ background: P.sand, color: "#17140F", padding: "10px 14px", borderRadius: "16px 16px 4px 16px", fontSize: 13.5, lineHeight: 1.45, fontWeight: 500 }}>{m.content}</div>
            </div>
          ) : (
            <div key={m.id} style={{ alignSelf: "flex-start", maxWidth: "84%" }}>
              <div style={{ background: P.surface, color: P.text, padding: "10px 14px", borderRadius: "16px 16px 16px 4px", fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap", border: `1px solid ${P.line}` }}>{m.content}</div>
            </div>
          )
        )}
        {isPending && (
          <div style={{ alignSelf: "flex-start" }}>
            <div style={{ background: P.surface, border: `1px solid ${P.line}`, padding: "12px 16px", borderRadius: "16px 16px 16px 4px", display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 150, 300].map((d) => (
                <span key={d} style={{ width: 6, height: 6, borderRadius: 3, background: P.textDim, display: "inline-block", animation: `bounce 1.2s ${d}ms ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}
        {error && (
          <p style={{ textAlign: "center", fontSize: 12, color: "#C99B85" }}>
            {error.includes("no messages remaining") ? "Недостатньо повідомлень. Поповніть баланс." : "Помилка. Спробуй ще раз."}
          </p>
        )}
        <div ref={endRef} />
      </div>

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

      <div style={{ padding: "10px 16px 14px", borderTop: `1px solid ${P.line}`, display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder="Запитай тренера…"
          style={{ flex: 1, background: P.surface, borderRadius: 22, padding: "10px 16px", fontSize: 13.5, color: P.text, border: `1px solid ${P.line}`, outline: "none", fontFamily: sans }}
        />
        <div onClick={onSend} style={{
          width: 44, height: 44, borderRadius: 22, flexShrink: 0,
          background: input.trim() ? P.sand : P.surface,
          border: input.trim() ? "none" : `1px solid ${P.line}`,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          boxShadow: input.trim() ? "0 4px 12px rgba(201,165,116,0.25)" : "none",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? "#17140F" : P.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

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
        onSelect={(id) => { setSelectedCoachId(id); setConversationId(null); setInput(""); webApp?.HapticFeedback?.selectionChanged(); }}
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

function BalanceTab() {
  const { token } = useTelegram();
  const balanceQuery = trpc.athlete.getBalance.useQuery(undefined, { enabled: !!token });
  const subscriptionQuery = trpc.billing.getSubscription.useQuery(undefined, { enabled: !!token });
  const balance = balanceQuery.data;
  const sub = subscriptionQuery.data;
  const free = balance?.freeRemaining ?? 0;
  const weekly = balance?.weeklyRemaining ?? 0;
  const purchased = balance?.purchasedRemaining ?? 0;
  const total = balance?.total ?? free + weekly + purchased;
  const PACKS = [
    { n: 50, price: "$5", label: "Для розминки", hot: false },
    { n: 200, price: "$15", label: "Популярний", hot: true },
    { n: 500, price: "$30", label: "Найвигідніше", hot: false },
  ];
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 24px" }}>
      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase", marginBottom: 18 }}>Баланс</div>
      <div style={{ background: `linear-gradient(180deg, ${P.surface2} 0%, ${P.surface} 100%)`, borderRadius: 20, padding: "22px 22px 20px", border: `1px solid ${P.line}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, fontFamily: mono, fontSize: 9, color: P.textMute, padding: "10px 14px", letterSpacing: 1 }}>ВСЬОГО / ЗАЛИШОК</div>
        <div style={{ fontFamily: serif, fontSize: 80, lineHeight: 0.9, fontWeight: 400, color: P.text, letterSpacing: -2.5 }}>{balanceQuery.isLoading ? "·" : total}</div>
        <div style={{ fontSize: 12, color: P.textDim, marginTop: 6 }}>повідомлень до тренера</div>
        <div style={{ marginTop: 20, display: "flex", height: 6, borderRadius: 3, overflow: "hidden", gap: 2 }}>
          <div style={{ flex: Math.max(free, 1), background: P.success, opacity: 0.7 }} />
          <div style={{ flex: Math.max(weekly, 1), background: "#7A8BA0", opacity: 0.7 }} />
          <div style={{ flex: Math.max(purchased, 1), background: P.sand }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: mono, fontSize: 10, color: P.textMute }}>
          <span>● {free} безкоштовних</span><span>● {weekly} тижневих</span><span>● {purchased} куплених</span>
        </div>
      </div>
      {sub && (
        <div style={{ marginTop: 14, padding: "14px 16px", background: P.surface, borderRadius: 14, border: `1px solid ${P.line}`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: P.sandSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.sand} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>{sub.plan} · {sub.status === "ACTIVE" ? "активна" : "неактивна"}</div>
            {sub.currentPeriodEnd && <div style={{ fontSize: 11.5, color: P.textDim, marginTop: 1 }}>Продовжиться {new Date(sub.currentPeriodEnd).toLocaleDateString("uk")} · $30</div>}
          </div>
        </div>
      )}
      <div style={{ marginTop: 22 }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase", marginBottom: 10 }}>— Пакети повідомлень</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PACKS.map((it) => (
            <div key={it.n} style={{ padding: "14px 16px", borderRadius: 14, background: it.hot ? P.surface2 : P.surface, border: `1px solid ${it.hot ? P.sand + "44" : P.line}`, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 400, color: P.text, letterSpacing: -0.5, width: 58 }}>{it.n}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{it.label}</div>
                <div style={{ fontSize: 11, color: P.textDim, marginTop: 1 }}>≈ ${(parseFloat(it.price.slice(1)) / it.n * 100).toFixed(1)} / 100 повідомл.</div>
              </div>
              <div style={{ padding: "8px 14px", borderRadius: 10, background: it.hot ? P.sand : "transparent", color: it.hot ? "#17140F" : P.text, border: it.hot ? "none" : `1px solid ${P.line}`, fontSize: 13, fontWeight: 600 }}>{it.price}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  const { user, token } = useTelegram();
  const subscriptionQuery = trpc.billing.getSubscription.useQuery(undefined, { enabled: !!token });
  const sub = subscriptionQuery.data;
  const rows: [string, string][] = [
    ["Підписка", sub?.plan ?? (subscriptionQuery.isLoading ? "..." : "Немає")],
    ["Сповіщення", "Увімкнено"],
    ["Мова", "Українська"],
    ["Зв'язатись з підтримкою", ""],
    ["Вийти з акаунту", ""],
  ];
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 24px" }}>
      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase", marginBottom: 20 }}>Профіль</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Avatar initials={getInitials(user?.name)} size={68} tone="stone" />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 400, letterSpacing: -0.3 }}>{user?.name || "..."}</div>
          <div style={{ fontSize: 12, color: P.textDim, marginTop: 2 }}>{user?.role === "ATHLETE" ? "Спортсмен" : user?.role || "Атлет"}</div>
          {sub?.status === "ACTIVE" && <div style={{ marginTop: 8, display: "inline-flex", gap: 6, alignItems: "center", padding: "4px 10px", borderRadius: 999, background: P.sandSoft, color: P.sand, fontFamily: mono, fontSize: 10, letterSpacing: 1 }}>● {sub.plan}</div>}
        </div>
      </div>
      <div style={{ marginTop: 28 }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase", marginBottom: 10 }}>— Налаштування</div>
        <div style={{ background: P.surface, borderRadius: 14, border: `1px solid ${P.line}`, overflow: "hidden" }}>
          {rows.map(([label, value], i) => (
            <div key={label} style={{ padding: "14px 16px", display: "flex", alignItems: "center", borderBottom: i < rows.length - 1 ? `1px solid ${P.lineSoft}` : "none" }}>
              <div style={{ flex: 1, fontSize: 13.5, color: i === rows.length - 1 ? "#C99B85" : P.text }}>{label}</div>
              {value && <span style={{ fontSize: 12, color: P.textDim, marginRight: 8 }}>{value}</span>}
              {i < rows.length - 1 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P.stone} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 20, fontFamily: mono, fontSize: 10, color: P.textMute, textAlign: "center" }}>POWERINSIDE · V 0.1 · TELEGRAM MINI APP</div>
    </div>
  );
}

// ─── AdminTab ─────────────────────────────────────────────────────────────────

type AdminSection = "stats" | "coaches" | "users" | "sports";
type AdminCoach = { id: string; status: string; user: { name?: string | null; email: string; createdAt: Date }; _count: { interviewSessions: number; knowledgeBase: number; methodologyRules: number } };
type AdminUser = { id: string; name?: string | null; email: string; role: string; createdAt: Date; _count: { conversations: number } };
const ROLE_LABEL: Record<string, string> = { ATHLETE: "Атлет", COACH: "Тренер", INVESTOR: "Інвестор", ADMIN: "Адмін", OWNER: "Власник" };
const STATUS_LABEL: Record<string, string> = { PENDING: "Очікує", ACTIVE: "Активний", SUSPENDED: "Призупинений" };
const STATUS_COLOR: Record<string, string> = { PENDING: "#C9A574", ACTIVE: "#7D9575", SUSPENDED: "#C99B85" };

function AdminTab() {
  const { token } = useTelegram();
  const [section, setSection] = useState<AdminSection>("stats");
  const [newSportName, setNewSportName] = useState("");
  const utils = trpc.useUtils();
  const statsQuery   = trpc.admin.getStats.useQuery(undefined, { enabled: !!token });
  const coachesQuery = trpc.admin.getCoaches.useQuery(undefined, { enabled: !!token && section === "coaches" });
  const usersQuery   = trpc.admin.getUsers.useQuery({ page: 1, perPage: 30 }, { enabled: !!token && section === "users" });
  const sportsQuery  = trpc.sport.list.useQuery(undefined, { enabled: !!token && section === "sports" });
  const pendingSportsQuery = trpc.sport.listPending.useQuery(undefined, { enabled: !!token && section === "sports" });
  const activateMutation       = trpc.admin.activateCoach.useMutation({ onSuccess: () => utils.admin.getCoaches.invalidate() });
  const suspendMutation        = trpc.admin.suspendCoach.useMutation({ onSuccess: () => utils.admin.getCoaches.invalidate() });
  const resetInterviewMutation = trpc.admin.resetCoachInterview.useMutation();
  const createSportMutation    = trpc.sport.create.useMutation({ onSuccess: () => { utils.sport.list.invalidate(); setNewSportName(""); } });
  const deleteSportMutation    = trpc.sport.delete.useMutation({ onSuccess: () => utils.sport.list.invalidate() });
  const approveSportMutation   = trpc.sport.approveCustomSport.useMutation({ onSuccess: () => { utils.sport.listPending.invalidate(); utils.sport.list.invalidate(); } });
  const rejectSportMutation    = trpc.sport.rejectCustomSport.useMutation({ onSuccess: () => utils.sport.listPending.invalidate() });
  const stats   = statsQuery.data;
  const coaches = (coachesQuery.data ?? []) as AdminCoach[];
  const users   = (usersQuery.data?.users ?? []) as AdminUser[];
  const sports  = sportsQuery.data ?? [];
  const pendingSports = (pendingSportsQuery.data ?? []) as { id: string; customSport: string | null; user: { name?: string | null } }[];
  const sections: { id: AdminSection; label: string }[] = [
    { id: "stats", label: "Аналітика" },
    { id: "coaches", label: "Тренери" },
    { id: "users", label: "Юзери" },
    { id: "sports", label: "Спорти" },
  ];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase", marginBottom: 14 }}>Адміністрування</div>
        <div style={{ display: "flex", gap: 6, background: P.surface, borderRadius: 12, padding: 4, border: `1px solid ${P.line}`, marginBottom: 16 }}>
          {sections.map((s) => (
            <div key={s.id} onClick={() => setSection(s.id)} style={{ flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 9, cursor: "pointer", background: section === s.id ? P.sand : "transparent", color: section === s.id ? "#17140F" : P.textDim, fontSize: 12, fontWeight: section === s.id ? 600 : 400 }}>{s.label}</div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px" }}>
        {section === "stats" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[["Всього юзерів", stats?.totalUsers], ["Всього тренерів", stats?.totalCoaches], ["Активних тренерів", stats?.activeCoaches], ["Активних підписок", stats?.activeSubscriptions], ["Всього підписок", stats?.totalSubscriptions], ["Виручка (пакети)", stats !== undefined ? `$${(stats.totalRevenue / 100).toFixed(2)}` : undefined]].map(([label, value]) => (
              <div key={String(label)} style={{ background: P.surface, borderRadius: 14, padding: "16px 18px", border: `1px solid ${P.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: P.textDim }}>{label}</span>
                <span style={{ fontFamily: serif, fontSize: 26, fontWeight: 400, color: P.text, letterSpacing: -0.5 }}>{statsQuery.isLoading ? "·" : (value ?? 0)}</span>
              </div>
            ))}
          </div>
        )}
        {section === "coaches" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {coaches.map((coach) => (
              <div key={coach.id} style={{ background: P.surface, borderRadius: 14, padding: "14px 16px", border: `1px solid ${P.line}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: P.text }}>{coach.user.name || "Без імені"}</div>
                  <span style={{ fontFamily: mono, fontSize: 10, color: STATUS_COLOR[coach.status] || P.textDim }}>{STATUS_LABEL[coach.status] || coach.status}</span>
                </div>
                <div style={{ fontFamily: mono, fontSize: 10, color: P.textMute, marginBottom: 10 }}>{coach._count.methodologyRules} правил · {coach._count.knowledgeBase} записів · {coach._count.interviewSessions}/7</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {coach.status !== "ACTIVE" && <div onClick={() => activateMutation.mutate({ coachId: coach.id })} style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: 10, background: P.success, color: "#17140F", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: activateMutation.isPending ? 0.5 : 1 }}>Активувати</div>}
                  {coach.status !== "SUSPENDED" && <div onClick={() => suspendMutation.mutate({ coachId: coach.id })} style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: 10, background: "transparent", color: "#C99B85", fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1px solid rgba(201,155,133,0.3)", opacity: suspendMutation.isPending ? 0.5 : 1 }}>Призупинити</div>}
                  <div onClick={() => { if (confirm(`Скинути інтерв'ю для ${coach.user.name || coach.user.email}?`)) resetInterviewMutation.mutate({ coachId: coach.id }); }} style={{ width: "100%", textAlign: "center", padding: "8px", borderRadius: 10, background: "transparent", color: P.textDim, fontSize: 12, fontWeight: 500, cursor: "pointer", border: `1px solid ${P.line}`, opacity: resetInterviewMutation.isPending && resetInterviewMutation.variables?.coachId === coach.id ? 0.5 : 1 }}>↺ Скинути інтерв&apos;ю</div>
                </div>
              </div>
            ))}
            {!coachesQuery.isLoading && coaches.length === 0 && <p style={{ textAlign: "center", color: P.textDim, fontSize: 13, paddingTop: 32 }}>Тренерів немає</p>}
          </div>
        )}
        {section === "users" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {users.map((u) => (
              <div key={u.id} style={{ background: P.surface, borderRadius: 14, padding: "14px 16px", border: `1px solid ${P.line}`, display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar initials={getInitials(u.name)} size={36} tone="dark" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: P.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || "Без імені"}</div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: P.textMute, marginTop: 2 }}>{u._count.conversations} розмов · {new Date(u.createdAt).toLocaleDateString("uk")}</div>
                </div>
                <span style={{ padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 500, fontFamily: mono, background: P.sandSoft, color: P.sand }}>{ROLE_LABEL[u.role] || u.role}</span>
              </div>
            ))}
            {!usersQuery.isLoading && users.length === 0 && <p style={{ textAlign: "center", color: P.textDim, fontSize: 13, paddingTop: 32 }}>Юзерів немає</p>}
          </div>
        )}
        {section === "sports" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Pending custom sports */}
            {pendingSports.length > 0 && (
              <div>
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.5, color: "#C9A574", textTransform: "uppercase", marginBottom: 8 }}>
                  На модерації ({pendingSports.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pendingSports.map((p) => (
                    <div key={p.id} style={{ background: P.surface, borderRadius: 14, padding: "14px 16px", border: "1px solid rgba(201,165,116,0.3)" }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: P.text, marginBottom: 4 }}>{p.customSport}</div>
                      <div style={{ fontSize: 11, color: P.textDim, marginBottom: 10 }}>від {p.user.name || "Невідомо"}</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div onClick={() => approveSportMutation.mutate({ coachProfileId: p.id })} style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: 10, background: P.success, color: "#17140F", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Схвалити</div>
                        <div onClick={() => rejectSportMutation.mutate({ coachProfileId: p.id })} style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: 10, background: "transparent", color: "#C99B85", fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1px solid rgba(201,155,133,0.3)" }}>Відхилити</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Add new sport */}
            <div>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase", marginBottom: 8 }}>Додати вид спорту</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={newSportName}
                  onChange={(e) => setNewSportName(e.target.value)}
                  placeholder="Назва…"
                  style={{ flex: 1, background: P.surface, borderRadius: 12, padding: "10px 14px", fontSize: 13, color: P.text, border: `1px solid ${P.line}`, outline: "none", fontFamily: sans }}
                />
                <div onClick={() => { if (newSportName.trim()) createSportMutation.mutate({ name: newSportName.trim() }); }} style={{ padding: "10px 16px", borderRadius: 12, background: newSportName.trim() ? P.sand : P.surface, color: newSportName.trim() ? "#17140F" : P.textMute, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${newSportName.trim() ? P.sand : P.line}`, flexShrink: 0 }}>
                  Додати
                </div>
              </div>
            </div>
            {/* Sports list */}
            <div>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase", marginBottom: 8 }}>Всі види спорту ({sports.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {sports.map((s) => (
                  <div key={s.id} style={{ background: P.surface, borderRadius: 12, padding: "12px 16px", border: `1px solid ${P.line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13.5, color: P.text }}>{s.name}</span>
                    <div onClick={() => { if (confirm(`Видалити «${s.name}»?`)) deleteSportMutation.mutate({ id: s.id }); }} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, color: "#C99B85", cursor: "pointer", border: "1px solid rgba(201,155,133,0.25)" }}>
                      Видалити
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AdminTabBar (5 tabs) ─────────────────────────────────────────────────────

type AdminTab5 = "chat" | "balance" | "interview" | "admin" | "profile";

function AdminTabBar({ active, onChange }: { active: AdminTab5; onChange: (t: AdminTab5) => void }) {
  const items: { id: AdminTab5; label: string; icon: (c: string) => React.ReactNode }[] = [
    { id: "chat", label: "Чат", icon: (c) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a8 8 0 0 1-11.4 7.2L4 21l1.8-5.6A8 8 0 1 1 21 12z"/>
      </svg>
    )},
    { id: "balance", label: "Баланс", icon: (c) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.2" fill={c}/>
      </svg>
    )},
    { id: "interview", label: "Інтерв'ю", icon: (c) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/>
      </svg>
    )},
    { id: "admin", label: "Адмін", icon: (c) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
      </svg>
    )},
    { id: "profile", label: "Профіль", icon: (c) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="3.8"/><path d="M4 21c1.5-4 4.6-6 8-6s6.5 2 8 6"/>
      </svg>
    )},
  ];
  return (
    <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "8px 4px 6px", borderTop: `1px solid ${P.line}`, background: P.bg, flexShrink: 0 }}>
      {items.map((it) => {
        const on = it.id === active;
        const c = on ? P.sand : P.textMute;
        return (
          <div key={it.id} onClick={() => onChange(it.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1, padding: "4px 0", cursor: "pointer" }}>
            {it.icon(c)}
            <span style={{ fontSize: 9, letterSpacing: 0.3, textTransform: "uppercase", color: c, fontWeight: 500 }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── AdminProfileTab (with preview mode) ─────────────────────────────────────

function AdminProfileTab() {
  const { user } = useTelegram();
  const [preview, setPreview] = useState<"none" | "athlete" | "coach">("none");

  if (preview === "athlete") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div onClick={() => setPreview("none")} style={{
          padding: "10px 20px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          background: P.surface2, borderBottom: `1px solid ${P.line}`, flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.sand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          <span style={{ fontSize: 11, color: P.sand, fontFamily: mono, letterSpacing: 1 }}>PREVIEW: РЕЖИМ АТЛЕТА</span>
        </div>
        <ChatTab />
      </div>
    );
  }

  if (preview === "coach") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div onClick={() => setPreview("none")} style={{
          padding: "10px 20px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          background: P.surface2, borderBottom: `1px solid ${P.line}`, flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.sand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          <span style={{ fontSize: 11, color: P.sand, fontFamily: mono, letterSpacing: 1 }}>PREVIEW: РЕЖИМ ТРЕНЕРА</span>
        </div>
        <CoachInterviewTabContent />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 24px" }}>
      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase", marginBottom: 20 }}>Профіль адміна</div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <Avatar initials={getInitials(user?.name)} size={68} tone="sand" />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, letterSpacing: -0.3 }}>{user?.name || "..."}</div>
          <div style={{ marginTop: 8, display: "inline-flex", gap: 6, alignItems: "center", padding: "4px 10px", borderRadius: 999, background: P.sandSoft, color: P.sand, fontFamily: mono, fontSize: 10, letterSpacing: 1 }}>
            ● АДМІН
          </div>
        </div>
      </div>

      {/* Preview mode buttons */}
      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.5, color: P.textMute, textTransform: "uppercase", marginBottom: 10 }}>— Перегляд інтерфейсів</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div onClick={() => setPreview("athlete")} style={{
          background: P.surface, borderRadius: 14, padding: "14px 16px",
          border: `1px solid ${P.line}`, display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: P.sandSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.sand} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.8"/><path d="M4 21c1.5-4 4.6-6 8-6s6.5 2 8 6"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: P.text }}>Режим атлета</div>
            <div style={{ fontSize: 11.5, color: P.textDim, marginTop: 1 }}>Переглянути як виглядає інтерфейс атлета</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P.stone} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
        </div>

        <div onClick={() => setPreview("coach")} style={{
          background: P.surface, borderRadius: 14, padding: "14px 16px",
          border: `1px solid ${P.line}`, display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: P.sandSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.sand} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: P.text }}>Режим тренера</div>
            <div style={{ fontSize: 11.5, color: P.textDim, marginTop: 1 }}>Переглянути інтерфейс тренера та інтерв'ю</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P.stone} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
        </div>
      </div>

      <div style={{ marginTop: 20, fontFamily: mono, fontSize: 10, color: P.textMute, textAlign: "center" }}>POWERINSIDE · ADMIN · V 0.1</div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TelegramMainPage() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [adminTab, setAdminTab] = useState<AdminTab5>("chat");
  const { isLoading, error, webApp, user, isNew, setAuth } = useTelegram();
  const isAdminUser = user?.role === "ADMIN" || user?.role === "OWNER";
  const isCoachUser = user?.role === "COACH";

  const selectRoleMutation = trpc.auth.selectRole.useMutation({
    onSuccess: (data) => setAuth(data.token, data.role),
  });

  const globalStyle = (
    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      input { background: transparent; }
      input::placeholder { color: ${P.textMute}; }
      ::-webkit-scrollbar { display: none; }
      scrollbar-width: none;
    `}</style>
  );

  if (isLoading) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, background: P.bg, fontFamily: sans }}>
        {globalStyle}
        <div style={{ width: 32, height: 32, borderRadius: 16, border: `2px solid ${P.sand}`, borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
        <p style={{ fontSize: 13, color: P.textDim }}>Завантаження…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, background: P.bg, padding: "0 24px", fontFamily: sans }}>
        {globalStyle}
        <p style={{ fontSize: 14, color: "#C99B85" }}>Помилка авторизації</p>
        <p style={{ fontSize: 12, color: P.textDim, textAlign: "center" }}>{error}</p>
      </div>
    );
  }

  const shell = (children: React.ReactNode, bottomBar: React.ReactNode) => (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: P.bg, color: P.text, fontFamily: sans, overflow: "hidden" }}>
      {globalStyle}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>{children}</div>
      {bottomBar}
    </div>
  );

  // ── NEW USER: onboarding role selection ──
  if (isNew) {
    return shell(
      <OnboardingScreen onSelect={(role) => selectRoleMutation.mutate({ role })} isPending={selectRoleMutation.isPending} />,
      null
    );
  }

  // ── ADMIN: 5-tab combined interface ──
  if (isAdminUser) {
    return shell(
      <>
        {adminTab === "chat"      && <ChatTab />}
        {adminTab === "balance"   && <BalanceTab />}
        {adminTab === "interview" && <CoachInterviewTabContent />}
        {adminTab === "admin"     && <AdminTab />}
        {adminTab === "profile"   && <AdminProfileTab />}
      </>,
      <AdminTabBar active={adminTab} onChange={(t) => { setAdminTab(t); webApp?.HapticFeedback?.selectionChanged(); }} />
    );
  }

  // ── COACH: interview + profile ──
  if (isCoachUser) {
    return <CoachPage />;
  }

  // ── ATHLETE: chat + balance + profile ──
  return shell(
    <>
      {activeTab === "chat"    && <ChatTab />}
      {activeTab === "balance" && <BalanceTab />}
      {activeTab === "profile" && <ProfileTab />}
    </>,
    <TabBar active={activeTab} onChange={(t) => { setActiveTab(t); webApp?.HapticFeedback?.selectionChanged(); }} />
  );
}
