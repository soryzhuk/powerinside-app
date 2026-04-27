"use client";

import { Users, UserCheck, Crown, DollarSign, TrendingUp, PieChart, Calendar } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function InvestorPage() {
  const { data, isLoading } = trpc.investor.getReport.useQuery();

  const metrics = data
    ? [
        { label: "Всього користувачів", value: data.users.total, sub: `${data.users.athletes} атлетів`, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
        { label: "Активних тренерів", value: data.coaches.active, sub: `з ${data.coaches.total} всього`, icon: UserCheck, color: "text-green-400", bg: "bg-green-400/10" },
        { label: "Активних підписок", value: data.subscriptions.active, sub: `з ${data.subscriptions.total} всього`, icon: Crown, color: "text-yellow-400", bg: "bg-yellow-400/10" },
        { label: "MRR (оцінка)", value: fmt(data.revenue.mrrEstimateCents), sub: "на основі активних підписок", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
        { label: "Виручка (пакети)", value: fmt(data.revenue.packsCents), sub: "разові покупки повідомлень", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-400/10" },
        { label: "Незакриті виплати", value: fmt(data.revenue.pendingPayoutsCents), sub: "тренерам в черзі", icon: PieChart, color: "text-orange-400", bg: "bg-orange-400/10" },
      ]
    : [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Звіт <span className="text-primary">інвестора</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Аналітика платформи — тільки для перегляду. Виплати інвесторам щоквартально (net).
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardBody><div className="h-16 bg-secondary rounded animate-pulse" /></CardBody></Card>
            ))
          : metrics.map((m) => {
              const Icon = m.icon;
              return (
                <Card key={m.label}>
                  <CardBody className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl shrink-0 ${m.bg}`}>
                      <Icon className={`w-5 h-5 ${m.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{m.label}</p>
                      <p className="text-2xl font-bold mt-0.5">{m.value}</p>
                      <p className="text-xs text-muted-foreground">{m.sub}</p>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
      </div>

      {/* Quarterly report */}
      {data && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-base font-semibold">Квартальний звіт (останні 3 міс.)</h2>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Виплат тренерам</span>
                <span>{fmt(data.quarterly.coachPayoutsCents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Дохід платформи (30%)</span>
                <span className="text-primary font-medium">{fmt(data.quarterly.platformRevenueCents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Кількість транзакцій</span>
                <span>{data.quarterly.payoutsCount}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                <span>Загальний обіг</span>
                <span>{fmt(data.quarterly.coachPayoutsCents + data.quarterly.platformRevenueCents)}</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">Конверсія</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Тренери активні</span>
                  <span>{data.coaches.total ? `${Math.round((data.coaches.active / data.coaches.total) * 100)}%` : "—"}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full" style={{ width: data.coaches.total ? `${Math.round((data.coaches.active / data.coaches.total) * 100)}%` : "0%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Підписки активні</span>
                  <span>{data.subscriptions.total ? `${Math.round((data.subscriptions.active / data.subscriptions.total) * 100)}%` : "—"}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: data.subscriptions.total ? `${Math.round((data.subscriptions.active / data.subscriptions.total) * 100)}%` : "0%" }} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Інвестори отримують виплати щоквартально (net). Право вимоги виникає при ≥51% сукупної частки (ТЗ п.10).
              </p>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
