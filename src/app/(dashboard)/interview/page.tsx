"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Send, CheckCircle } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

interface InterviewMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function InterviewPage() {
  const t = useTranslations("interview");
  const tCommon = useTranslations("common");
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sessionQuery = trpc.coach.getFullInterviewSession.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const sendMessageMutation = trpc.coach.sendInterviewMessage.useMutation();
  const resetMutation = trpc.coach.resetInterview.useMutation();

  useEffect(() => {
    if (sessionQuery.data) {
      setSessionId(sessionQuery.data.id);
      setIsComplete(sessionQuery.data.status === "COMPLETED");
      setMessages(
        sessionQuery.data.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
    }
  }, [sessionQuery.data]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleReset() {
    if (resetting) return;
    setResetting(true);
    try {
      const newSession = await resetMutation.mutateAsync();
      if (newSession) {
        setSessionId(newSession.id);
        setIsComplete(false);
        setMessages(
          newSession.messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        );
      }
    } catch {
      // ignore
    } finally {
      setResetting(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !sessionId || sending || isComplete) return;

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
          id: result.message.id,
          role: "assistant",
          content: result.message.content,
        },
      ]);

      if (result.isComplete) {
        setIsComplete(true);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("errorSend");
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: t("errorPrefix", { message: errorMessage }),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)]">
      <Card className="flex-1 flex flex-col overflow-hidden">
        {sessionQuery.isLoading ? (
          <CardBody className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </CardBody>
        ) : (
          <>
            <CardBody className="flex-1 overflow-y-auto space-y-4 p-4">
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

            {isComplete ? (
              <div className="border-t border-border p-4 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>{t("completed")}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  loading={resetting}
                  disabled={resetting}
                >
                  {t("startOver")}
                </Button>
              </div>
            ) : (
              <div className="border-t border-border p-4">
                <form onSubmit={handleSend} className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder={t("inputPlaceholder")}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={sending || !sessionId}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!input.trim() || !sessionId || sending}
                    loading={sending}
                    aria-label={tCommon("send")}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
