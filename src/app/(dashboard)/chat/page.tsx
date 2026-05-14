"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Send, MessageSquare, ChevronDown } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date | string;
}

function MessageContent({ text, isUser }: { text: string; isUser: boolean }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline break-all ${isUser ? "text-white/90 hover:text-white" : "text-primary hover:text-primary/80"}`}
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

export default function ChatPage() {
  const t = useTranslations("chat");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get("conversation");

  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId
  );
  const [selectedCoachId, setSelectedCoachId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const questionCount = (input.match(/\?/g) ?? []).length;
  const hasMultipleQuestions = questionCount > 1;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const balanceQuery = trpc.athlete.getBalance.useQuery();
  const coachesQuery = trpc.admin.getCoaches.useQuery(undefined, {
    retry: false,
  });
  const conversationQuery = trpc.athlete.getConversation.useQuery(
    { conversationId: conversationId! },
    { enabled: !!conversationId }
  );

  const askMutation = trpc.athlete.askQuestion.useMutation();

  const balance = balanceQuery.data;
  const coaches = coachesQuery.data?.filter((c) => c.status === "ACTIVE") ?? [];

  useEffect(() => {
    if (conversationQuery.data) {
      setMessages(
        conversationQuery.data.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          createdAt: m.createdAt,
        }))
      );
    }
  }, [conversationQuery.data]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedCoachId && coaches.length > 0) {
      setSelectedCoachId(coaches[0].id);
    }
  }, [coaches, selectedCoachId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !selectedCoachId || sending) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: input.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const result = await askMutation.mutateAsync({
        conversationId: conversationId ?? undefined,
        coachId: selectedCoachId,
        content: userMessage.content,
      });

      if (!conversationId) {
        setConversationId(result.conversationId);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: result.message.id,
          role: "assistant",
          content: result.message.content,
          createdAt: result.message.createdAt,
        },
      ]);

      balanceQuery.refetch();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : t("errorSend");
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: t("errorPrefix", { message: errorMessage }),
          createdAt: new Date(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)]">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            {t("coachLabel")}
          </label>
          <div className="relative flex-1 sm:flex-none">
            <select
              value={selectedCoachId}
              onChange={(e) => setSelectedCoachId(e.target.value)}
              className="appearance-none w-full sm:w-48 px-3 py-2 pr-8 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {coaches.length === 0 && (
                <option value="">{t("noCoaches")}</option>
              )}
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.user.name ?? coach.user.email}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {t("messagesCount", { count: balance?.total ?? 0 })}
          </span>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardBody className="flex-1 overflow-y-auto space-y-4 p-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 rounded-2xl bg-primary/10 mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {t("emptyTitle")}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {t("emptySubtitle")}
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] min-w-0 px-4 py-3 rounded-2xl text-sm leading-relaxed overflow-hidden ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-secondary border border-border text-foreground rounded-bl-md"
                }`}
              >
                <MessageContent text={msg.content} isUser={msg.role === "user"} />
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

        <div className="border-t border-border p-4 space-y-2">
          {hasMultipleQuestions && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-700 dark:text-yellow-400">
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>
                {t.rich("multipleQuestionsWarning", {
                  count: questionCount,
                  b: (chunks) => <strong>{chunks}</strong>,
                })}
              </span>
            </div>
          )}
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder={t("inputPlaceholder")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending || !selectedCoachId}
              />
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || !selectedCoachId || sending}
              loading={sending}
              aria-label={tCommon("send")}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
