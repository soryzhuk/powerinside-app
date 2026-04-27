"use client";

import { BookOpen, ListChecks, Brain, ChevronDown, ChevronUp, CheckCircle2, Circle } from "lucide-react";
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

function RuleRow({ rule, onToggle }: {
  rule: { id: string; title: string; condition?: string | null; signal?: string | null; decision?: string | null; exception?: string | null; alternative?: string | null; confirmed: boolean };
  onToggle: (id: string, confirmed: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-lg border transition-colors ${rule.confirmed ? "border-green-500/40 bg-green-500/5" : "border-border/50 bg-secondary/30"}`}>
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => onToggle(rule.id, !rule.confirmed)}
          className="shrink-0 text-muted-foreground hover:text-green-500 transition-colors"
          title={rule.confirmed ? "Скасувати підтвердження" : "Підтвердити правило"}
        >
          {rule.confirmed
            ? <CheckCircle2 className="w-5 h-5 text-green-500" />
            : <Circle className="w-5 h-5" />}
        </button>
        <button className="flex-1 text-left" onClick={() => setOpen(v => !v)}>
          <span className="text-sm font-medium">{rule.title}</span>
        </button>
        <button onClick={() => setOpen(v => !v)} className="shrink-0 text-muted-foreground">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {open && (
        <div className="px-4 pb-3 space-y-1.5 border-t border-border/30 pt-2">
          {rule.condition   && <p className="text-xs"><span className="text-muted-foreground font-medium">Умова:</span> {rule.condition}</p>}
          {rule.signal      && <p className="text-xs"><span className="text-muted-foreground font-medium">Сигнал:</span> {rule.signal}</p>}
          {rule.decision    && <p className="text-xs"><span className="text-muted-foreground font-medium">Рішення:</span> {rule.decision}</p>}
          {rule.exception   && <p className="text-xs"><span className="text-muted-foreground font-medium">Виняток:</span> {rule.exception}</p>}
          {rule.alternative && <p className="text-xs"><span className="text-muted-foreground font-medium">Альтернатива:</span> {rule.alternative}</p>}
        </div>
      )}
    </div>
  );
}

export default function KnowledgePage() {
  const utils = trpc.useUtils();
  const knowledgeQuery = trpc.coach.getKnowledgeBase.useQuery();
  const rulesQuery = trpc.coach.getRules.useQuery();
  const confirmMutation = trpc.coach.confirmRule.useMutation({
    onSuccess: () => utils.coach.getRules.invalidate(),
  });
  const [openRounds, setOpenRounds] = useState<Record<string, boolean>>({});

  const entries = knowledgeQuery.data ?? [];
  const rules = rulesQuery.data ?? [];

  const confirmedCount = rules.filter(r => r.confirmed).length;

  const rulesByRound = rules.reduce<Record<string, typeof rules>>((acc, rule) => {
    const round = rule.round ?? "OTHER";
    if (!acc[round]) acc[round] = [];
    acc[round].push(rule);
    return acc;
  }, {});

  function toggleRound(round: string) {
    setOpenRounds((prev) => ({ ...prev, [round]: !prev[round] }));
  }

  function handleConfirm(ruleId: string, confirmed: boolean) {
    confirmMutation.mutate({ ruleId, confirmed });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          База <span className="text-primary">знань</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Правила методики з інтерв&apos;ю. Підтвердіть ті, що точно відображають вашу систему — тільки підтверджені правила використовуються AI для відповідей атлетам.
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Записів</p>
              <p className="text-2xl font-bold">{knowledgeQuery.isLoading ? "…" : entries.length}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-secondary shrink-0">
              <ListChecks className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Всього правил</p>
              <p className="text-2xl font-bold">{rulesQuery.isLoading ? "…" : rules.length}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-green-500/10 shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Підтверджено</p>
              <p className="text-2xl font-bold text-green-500">{rulesQuery.isLoading ? "…" : confirmedCount}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Methodology Rules */}
      <div>
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Правила методики
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Натисніть ⭕ поруч з правилом щоб підтвердити його. Розгорніть правило щоб побачити деталі.
        </p>

        {rulesQuery.isLoading && <p className="text-sm text-muted-foreground">Завантаження…</p>}

        {!rulesQuery.isLoading && rules.length === 0 && (
          <Card>
            <CardBody>
              <p className="text-sm text-muted-foreground text-center py-4">
                Правила з&apos;являться після проходження інтерв&apos;ю
              </p>
            </CardBody>
          </Card>
        )}

        <div className="space-y-2">
          {Object.entries(rulesByRound).map(([round, roundRules]) => {
            const isOpen = openRounds[round] ?? true;
            const label = ROUND_LABELS[round] ?? round;
            const confirmedInRound = roundRules.filter(r => r.confirmed).length;
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
                    {confirmedInRound > 0 && (
                      <span className="px-1.5 py-0.5 text-xs rounded bg-green-500/10 text-green-600">
                        ✓ {confirmedInRound}
                      </span>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    {roundRules.map((rule) => (
                      <RuleRow key={rule.id} rule={rule} onToggle={handleConfirm} />
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Knowledge Entries */}
      {entries.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Записи бази знань
          </h2>
          <div className="space-y-3">
            {entries.map((entry) => (
              <Card key={entry.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{entry.question}</p>
                      <p className="text-sm text-muted-foreground">{entry.answer}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString("uk")}</p>
                      {entry.approved && <span className="text-xs text-green-500">✓ підтверджено</span>}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
