"use client";

import { useState } from "react";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

type CoachStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

const STATUS_CONFIG: Record<
  CoachStatus,
  { label: string; icon: typeof Clock; color: string }
> = {
  PENDING: { label: "Очікує", icon: Clock, color: "text-yellow-400" },
  ACTIVE: { label: "Активний", icon: CheckCircle, color: "text-green-400" },
  SUSPENDED: { label: "Призупинений", icon: XCircle, color: "text-danger" },
};

export default function AdminCoachesPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<CoachStatus | "ALL">("ALL");

  const utils = trpc.useUtils();
  const coachesQuery = trpc.admin.getCoaches.useQuery();
  const activateMutation = trpc.admin.activateCoach.useMutation({
    onSuccess: () => utils.admin.getCoaches.invalidate(),
  });
  const suspendMutation = trpc.admin.suspendCoach.useMutation({
    onSuccess: () => utils.admin.getCoaches.invalidate(),
  });

  const coaches = coachesQuery.data ?? [];

  const filtered = coaches.filter((coach) => {
    const matchesSearch =
      !search ||
      coach.user.name?.toLowerCase().includes(search.toLowerCase()) ||
      coach.user.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" || coach.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Управління <span className="text-primary">тренерами</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          {coaches.length} тренерів на платформі
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Пошук за ім'ям або email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {(["ALL", "PENDING", "ACTIVE", "SUSPENDED"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
                filterStatus === status
                  ? "bg-primary text-white border-primary"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {status === "ALL"
                ? "Всі"
                : STATUS_CONFIG[status].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Тренер
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Статус
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Інтерв'ю
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  База знань
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Правила
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Реєстрація
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Дії
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-muted-foreground"
                  >
                    Тренерів не знайдено
                  </td>
                </tr>
              )}

              {filtered.map((coach) => {
                const status = coach.status as CoachStatus;
                const StatusIcon = STATUS_CONFIG[status].icon;

                return (
                  <tr
                    key={coach.id}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium">
                          {coach.user.name ?? "Без імені"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {coach.user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <StatusIcon
                          className={`w-4 h-4 ${STATUS_CONFIG[status].color}`}
                        />
                        <span className="text-sm">
                          {STATUS_CONFIG[status].label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">
                        {coach._count.interviewSessions}/7
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{coach._count.knowledgeBase}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">
                        {coach._count.methodologyRules}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-muted-foreground">
                        {new Date(coach.user.createdAt).toLocaleDateString("uk")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {status !== "ACTIVE" && (
                          <Button
                            size="sm"
                            variant="outline"
                            loading={
                              activateMutation.isPending &&
                              activateMutation.variables?.coachId === coach.id
                            }
                            onClick={() =>
                              activateMutation.mutate({ coachId: coach.id })
                            }
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Активувати
                          </Button>
                        )}
                        {status !== "SUSPENDED" && (
                          <Button
                            size="sm"
                            variant="danger"
                            loading={
                              suspendMutation.isPending &&
                              suspendMutation.variables?.coachId === coach.id
                            }
                            onClick={() =>
                              suspendMutation.mutate({ coachId: coach.id })
                            }
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Призупинити
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
