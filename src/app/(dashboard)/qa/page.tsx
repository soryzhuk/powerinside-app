"use client";

import { useState } from "react";
import {
  MessageSquare,
  Users,
  CheckCircle2,
  Clock,
  Send,
  Star,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function QaPage() {
  const [question, setQuestion] = useState("");
  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coachesQuery = trpc.qa.getActiveCoaches.useQuery();
  const myQuestionsQuery = trpc.qa.getMyQuestions.useQuery();
  const createMutation = trpc.qa.createQuestion.useMutation();
  const selectAnswerMutation = trpc.qa.selectBestAnswer.useMutation();

  function toggleCoach(userId: string) {
    setSelectedCoachIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : prev.length < 5
        ? [...prev, userId]
        : prev
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || selectedCoachIds.length === 0) return;

    setError(null);
    setCreating(true);
    try {
      await createMutation.mutateAsync({
        content: question,
        coachIds: selectedCoachIds,
      });
      setQuestion("");
      setSelectedCoachIds([]);
      myQuestionsQuery.refetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setCreating(false);
    }
  }

  async function handleSelectAnswer(answerId: string) {
    await selectAnswerMutation.mutateAsync({ answerId });
    myQuestionsQuery.refetch();
  }

  const coaches = coachesQuery.data ?? [];
  const myQuestions = myQuestionsQuery.data ?? [];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Мультиекспертні <span className="text-primary">відповіді</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Задайте питання одразу кільком тренерам і оберіть найкращу відповідь
        </p>
      </div>

      {/* Create question form */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Нове запитання
          </h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium block mb-1.5">
                Ваше запитання
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Опишіть своє питання детально — чим точніше, тим кращі відповіді..."
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-colors"
                required
                minLength={10}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Оберіть тренерів (до 5)
                {selectedCoachIds.length > 0 && (
                  <span className="ml-2 text-primary">
                    ({selectedCoachIds.length} обрано)
                  </span>
                )}
              </label>
              {coachesQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Завантаження...</p>
              ) : coaches.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Поки немає активних тренерів
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2">
                  {coaches.map((coach) => {
                    const isSelected = selectedCoachIds.includes(coach.user.id);
                    return (
                      <button
                        key={coach.id}
                        type="button"
                        onClick={() => toggleCoach(coach.user.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {coach.user.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span className="text-sm font-medium">
                          {coach.user.name ?? "Тренер"}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={creating}
              disabled={!question.trim() || selectedCoachIds.length === 0}
            >
              <Send className="w-4 h-4 mr-2" />
              Надіслати питання
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* My questions */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Мої запитання
        </h2>

        {myQuestionsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Завантаження...</p>
        ) : myQuestions.length === 0 ? (
          <Card>
            <CardBody className="text-center py-8">
              <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                У вас ще немає запитань. Задайте перше!
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {myQuestions.map((q) => {
              const questionText = q.messages[0]?.content ?? "";
              const answers = q.expertAnswers;
              const answeredCount = answers.filter((a) => a.content).length;
              const hasSelected = answers.some((a) => a.selected);

              return (
                <Card key={q.id}>
                  <CardBody className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">{questionText}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(q.createdAt).toLocaleDateString("uk-UA")}
                        <span>·</span>
                        {answeredCount}/{answers.length} відповідей
                      </p>
                    </div>

                    {answers.length > 0 && (
                      <div className="space-y-2">
                        {answers.map((answer) => (
                          <div
                            key={answer.id}
                            className={`p-3 rounded-lg border text-sm ${
                              answer.selected
                                ? "border-primary bg-primary/10"
                                : "border-border"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-medium text-muted-foreground">
                                {answer.coach.name ?? "Тренер"}
                              </span>
                              {answer.selected && (
                                <span className="flex items-center gap-1 text-xs text-primary">
                                  <Star className="w-3 h-3 fill-current" />
                                  Найкраща
                                </span>
                              )}
                            </div>
                            {answer.content ? (
                              <>
                                <p className="text-foreground">{answer.content}</p>
                                {!hasSelected && !answer.selected && (
                                  <button
                                    onClick={() => handleSelectAnswer(answer.id)}
                                    className="mt-2 text-xs text-primary hover:underline cursor-pointer"
                                  >
                                    Обрати найкращою
                                  </button>
                                )}
                              </>
                            ) : (
                              <p className="text-muted-foreground italic">
                                Очікує відповіді...
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
