"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  RotateCcw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

type CoachStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

const STATUS_ICON: Record<CoachStatus, { icon: typeof Clock; color: string }> = {
  PENDING: { icon: Clock, color: "text-yellow-400" },
  ACTIVE: { icon: CheckCircle, color: "text-green-400" },
  SUSPENDED: { icon: XCircle, color: "text-danger" },
};

export default function AdminCoachesPage() {
  const t = useTranslations("adminCoaches");
  const tStatus = useTranslations("coachStatus");
  const tCommon = useTranslations("common");
  const locale = useLocale();
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
  const resetInterviewMutation = trpc.admin.resetCoachInterview.useMutation();

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
          {t("titleA")} <span className="text-primary">{t("titleB")}</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("subtitle", { n: coaches.length })}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
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
              {status === "ALL" ? tCommon("all") : tStatus(status)}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  {t("table.coach")}
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  {t("table.status")}
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  {t("table.interview")}
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  {t("table.knowledge")}
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  {t("table.rules")}
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  {t("table.registered")}
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  {t("table.actions")}
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
                    {t("notFound")}
                  </td>
                </tr>
              )}

              {filtered.map((coach) => {
                const status = coach.status as CoachStatus;
                const StatusIcon = STATUS_ICON[status].icon;

                return (
                  <tr
                    key={coach.id}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium">
                          {coach.user.name ?? t("noName")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {coach.user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <StatusIcon
                          className={`w-4 h-4 ${STATUS_ICON[status].color}`}
                        />
                        <span className="text-sm">
                          {tStatus(status)}
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
                        {new Date(coach.user.createdAt).toLocaleDateString(locale)}
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
                            {t("activate")}
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
                            {t("suspend")}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          loading={
                            resetInterviewMutation.isPending &&
                            resetInterviewMutation.variables?.coachId === coach.id
                          }
                          onClick={() => {
                            const who = coach.user.name ?? coach.user.email;
                            if (confirm(t("resetConfirm", { who }))) {
                              resetInterviewMutation.mutate({ coachId: coach.id });
                            }
                          }}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          {t("resetInterview")}
                        </Button>
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
