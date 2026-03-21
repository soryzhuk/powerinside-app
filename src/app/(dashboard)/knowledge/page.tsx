"use client";

import { BookOpen, ListChecks, Brain, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

const ROUND_LABELS: Record<string, string> = {
  TARGET_ATHLETE: "Цільовий атлет",
  LOAD_MANAGEMENT: "Управління навантаженням",
  AUTOREGULATION: "Авторегуляція",
  PROGRESSION_DELOAD: "Прогресія та розвантаження",
  EXERCISE_SELECTION: "Підбір вправ",
  TECHNIQUE_STANDARDS: "Стандарти техніки",
  LIFESTYLE_RECOVERY: "Спосіб життя та відновлення",
};

export default function KnowledgePage() {
  const knowledgeQuery = trpc.coach.getKnowledgeBase.useQuery();
  const rulesQuery = trpc.coach.getRules.useQuery();
  const [openRounds, setOpenRounds] = useState<Record<string, boolean>>({});

  const entries = knowledgeQuery.data ?? [];
  const rules = rulesQuery.data ?? [];

  // Group rules by round
  const rulesByRound = rules.reduce<Record<string, typeof rules>>((acc, rule) => {
    const round = rule.round ?? "OTHER";
    if (!acc[round]) acc[round] = [];
    acc[round].push(rule);
    return acc;
  }, {});

  function toggleRound(round: string) {
    setOpenRounds((prev) => ({ ...prev, [round]: !prev[round] }));
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          База <span className="text-primary">знань</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Контент, зібраний під час інтерв'ю — використовується AI для відповідей атлетам
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Записів у базі знань</p>
              <p className="text-2xl font-bold">{knowledgeQuery.isLoading ? "..." : entries.length}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-green-500/10 shrink-0">
              <ListChecks className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Правил методики</p>
              <p className="text-2xl font-bold">{rulesQuery.isLoading ? "..." : rules.length}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Methodology Rules by Round */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Правила методики
        </h2>

        {rulesQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Завантаження...</p>
        )}

        {!rulesQuery.isLoading && rules.length === 0 && (
          <Card>
            <CardBody>
              <p className="text-sm text-muted-foreground text-center py-4">
                Правила з'являться після проходження інтерв'ю
              </p>
            </CardBody>
          </Card>
        )}

        <div className="space-y-2">
          {Object.entries(rulesByRound).map(([round, roundRules]) => {
            const isOpen = openRounds[round] ?? true;
            const label = ROUND_LABELS[round] ?? round;
            return (
              <Card key={round}>
                <button
                  onClick={() => toggleRound(round)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="px-1.5 py-0.5 text-xs rounded bg-secondary text-muted-foreground">
                      {roundRules.length}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    {roundRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="p-3 rounded-lg bg-secondary/50 border border-border/50"
                      >
                        <p className="text-sm">{rule.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Knowledge Entries */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Записи бази знань
        </h2>

        {knowledgeQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Завантаження...</p>
        )}

        {!knowledgeQuery.isLoading && entries.length === 0 && (
          <Card>
            <CardBody>
              <p className="text-sm text-muted-foreground text-center py-4">
                База знань порожня. Пройдіть інтерв'ю, щоб заповнити її.
              </p>
            </CardBody>
          </Card>
        )}

        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm flex-1">{entry.content}</p>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(entry.createdAt).toLocaleDateString("uk")}
                  </span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
