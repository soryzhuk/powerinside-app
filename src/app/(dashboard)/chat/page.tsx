"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Send, MessageSquare, ChevronDown } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date | string;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get("conversation");

  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId
  );
  const [selectedCoachId, setSelectedCoachId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const balanceQuery = trpc.athlete.getBalance.useQuery();
  const coachesQuery = trpc.admin.getCoaches.useQuery(undefined, {
    // Athletes can see active coaches for selection
    retry: false,
  });
  const conversationQuery = trpc.athlete.getConversation.useQuery(
    { conversationId: conversationId! },
    { enabled: !!conversationId }
  );

  const askMutation = trpc.athlete.askQuestion.useMutation();

  const balance = balanceQuery.data;
  const coaches = coachesQuery.data?.filter((c) => c.status === "ACTIVE") ?? [];

  // Load conversation messages when selected
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-select first coach
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

      // Refetch balance after sending
      balanceQuery.refetch();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Помилка при відправці повідомлення";
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Помилка: ${errorMessage}`,
          createdAt: new Date(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Top bar: coach selector + balance */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Тренер:
          </label>
          <div className="relative">
            <select
              value={selectedCoachId}
              onChange={(e) => setSelectedCoachId(e.target.value)}
              className="appearance-none w-48 px-3 py-2 pr-8 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {coaches.length === 0 && (
                <option value="">Немає доступних тренерів</option>
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
            {balance?.total ?? "..."} повідомлень
          </span>
        </div>
      </div>

      {/* Messages */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardBody className="flex-1 overflow-y-auto space-y-4 p-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 rounded-2xl bg-primary/10 mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                Почніть розмову з AI-тренером
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Оберіть тренера та задайте своє перше питання про тренування,
                техніку або харчування.
              </p>
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

        {/* Input */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Введіть ваше питання..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending || !selectedCoachId}
              />
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || !selectedCoachId || sending}
              loading={sending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
