"use client";

import { useState } from "react";
import {
  MessageSquare,
  Send,
  Check,
  Clock,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function ExpertQaPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const questionsQuery = trpc.qa.getCoachQuestions.useQuery();
  const answerMutation = trpc.qa.answerQuestion.useMutation();

  async function handleAnswer(answerId: string) {
    const content = answers[answerId]?.trim();
    if (!content) return;

    setSubmitting(answerId);
    try {
      await answerMutation.mutateAsync({ answerId, content });
      setAnswers((prev) => ({ ...prev, [answerId]: "" }));
      questionsQuery.refetch();
    } finally {
      setSubmitting(null);
    }
  }

  const questions = questionsQuery.data ?? [];
  const pendingQuestions = questions.filter((q) => !q.content);
  const answeredQuestions = questions.filter((q) => q.content);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Запитання <span className="text-primary">атлетів</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Відповідайте на питання атлетів та поповнюйте базу знань
        </p>
      </div>

      {/* Pending */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          Очікують відповіді
          {pendingQuestions.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
              {pendingQuestions.length}
            </span>
          )}
        </h2>

        {questionsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Завантаження...</p>
        ) : pendingQuestions.length === 0 ? (
          <Card>
            <CardBody className="text-center py-8">
              <Check className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Немає нових запитань
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingQuestions.map((item) => {
              const questionText =
                item.conversation.messages[0]?.content ?? "";
              const athleteName =
                item.conversation.user.name ?? "Атлет";

              return (
                <Card key={item.id} className="border-yellow-500/20">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                        {athleteName[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {athleteName}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(item.createdAt).toLocaleDateString("uk-UA")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    <p className="text-sm font-medium">{questionText}</p>
                    <div>
                      <textarea
                        value={answers[item.id] ?? ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder="Ваша відповідь..."
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-colors"
                      />
                      <Button
                        size="sm"
                        variant="primary"
                        className="mt-2"
                        loading={submitting === item.id}
                        disabled={!answers[item.id]?.trim()}
                        onClick={() => handleAnswer(item.id)}
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                        Відповісти
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Answered */}
      {answeredQuestions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-400" />
            Відповіді надіслано
          </h2>
          <div className="space-y-3">
            {answeredQuestions.map((item) => {
              const questionText =
                item.conversation.messages[0]?.content ?? "";
              return (
                <Card key={item.id} className="opacity-70">
                  <CardBody>
                    <p className="text-sm font-medium mb-2">{questionText}</p>
                    <p className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3">
                      {item.content}
                    </p>
                    {item.selected && (
                      <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
                        ★ Обрана найкращою атлетом
                      </span>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {questions.length === 0 && !questionsQuery.isLoading && (
        <Card>
          <CardBody className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Поки немає запитань до вас від атлетів
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
