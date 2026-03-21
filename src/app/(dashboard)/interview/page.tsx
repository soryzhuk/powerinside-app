"use client";

import { useState, useRef, useEffect } from "react";
import {
  CheckCircle,
  Circle,
  Lock,
  Send,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const ROUNDS = [
  { key: "TARGET_ATHLETE", label: "Цільовий атлет", description: "Хто ваш ідеальний учень?" },
  { key: "LOAD_MANAGEMENT", label: "Управління навантаженням", description: "Як ви плануєте обсяги та інтенсивність?" },
  { key: "AUTOREGULATION", label: "Авторегуляція", description: "Як ви адаптуєте план під стан атлета?" },
  { key: "PROGRESSION_DELOAD", label: "Прогресія та розвантаження", description: "Стратегія прогресу та відновлення" },
  { key: "EXERCISE_SELECTION", label: "Підбір вправ", description: "Критерії вибору та варіації вправ" },
  { key: "TECHNIQUE_STANDARDS", label: "Стандарти техніки", description: "Вимоги до техніки виконання" },
  { key: "LIFESTYLE_RECOVERY", label: "Спосіб життя та відновлення", description: "Сон, харчування, стрес-менеджмент" },
] as const;

type RoundKey = (typeof ROUNDS)[number]["key"];

interface InterviewMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function InterviewPage() {
  const [activeRound, setActiveRound] = useState<RoundKey | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const profileQuery = trpc.coach.getProfile.useQuery();

  const sessionQuery = trpc.coach.getInterviewSession.useQuery(
    { round: activeRound! },
    { enabled: !!activeRound }
  );

  const sendMessageMutation = trpc.coach.sendInterviewMessage.useMutation();

  const completedSessions = profileQuery.data?._count.interviewSessions ?? 0;

  // Load session messages when round is selected
  useEffect(() => {
    if (sessionQuery.data) {
      setSessionId(sessionQuery.data.id);
      setMessages(
        sessionQuery.data.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
    }
  }, [sessionQuery.data]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function getRoundStatus(index: number): "completed" | "in-progress" | "locked" {
    // Simple heuristic: rounds are sequential; completed count determines status
    if (index < completedSessions) return "completed";
    if (index === completedSessions) return "in-progress";
    return "locked";
  }

  function handleSelectRound(round: RoundKey, index: number) {
    const status = getRoundStatus(index);
    if (status === "locked") return;
    setActiveRound(round);
    setMessages([]);
    setSessionId(null);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !sessionId || sending) return;

    const userMsg: InterviewMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const result = await sendMessageMutation.mutateAsync({
        sessionId,
        content: userMsg.content,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: result.id,
          role: "assistant",
          content: result.content,
        },
      ]);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Помилка при відправці";
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Помилка: ${errorMessage}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100dvh-5rem)]">
      {/* Rounds sidebar */}
      <div className="w-full lg:w-80 shrink-0">
        <Card className="h-auto lg:h-full">
          <CardHeader>
            <h2 className="text-lg font-semibold">Раунди інтерв'ю</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Пройдено {completedSessions} з 7
            </p>
            {/* Progress bar */}
            <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(completedSessions / 7) * 100}%` }}
              />
            </div>
          </CardHeader>
          <CardBody className="space-y-1 p-3 overflow-y-auto">
            {ROUNDS.map((round, index) => {
              const status = getRoundStatus(index);
              const isActive = activeRound === round.key;

              return (
                <button
                  key={round.key}
                  onClick={() => handleSelectRound(round.key, index)}
                  disabled={status === "locked"}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all cursor-pointer disabled:cursor-not-allowed ${
                    isActive
                      ? "bg-primary/10 border border-primary/30"
                      : status === "locked"
                        ? "opacity-50"
                        : "hover:bg-secondary/50"
                  }`}
                >
                  <div className="shrink-0">
                    {status === "completed" ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : status === "in-progress" ? (
                      <Circle className="w-5 h-5 text-primary" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{round.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {round.description}
                    </p>
                  </div>
                  {status !== "locked" && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              );
            })}
          </CardBody>
        </Card>
      </div>

      {/* Chat area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {!activeRound ? (
          <CardBody className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="p-4 rounded-2xl bg-primary/10 inline-block mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Оберіть раунд</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Натисніть на доступний раунд зліва, щоб почати або продовжити
                інтерв'ю.
              </p>
            </div>
          </CardBody>
        ) : (
          <>
            <CardHeader>
              <h3 className="font-semibold">
                {ROUNDS.find((r) => r.key === activeRound)?.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {ROUNDS.find((r) => r.key === activeRound)?.description}
              </p>
            </CardHeader>

            <CardBody className="flex-1 overflow-y-auto space-y-4 p-4">
              {messages.length === 0 && !sessionQuery.isLoading && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Починайте діалог. AI задасть вам питання про вашу методологію.
                  </p>
                </div>
              )}

              {sessionQuery.isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-secondary border border-border text-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="bg-secondary border border-border rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardBody>

            <div className="border-t border-border p-4">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Ваша відповідь..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={sending || !sessionId}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!input.trim() || !sessionId || sending}
                  loading={sending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
