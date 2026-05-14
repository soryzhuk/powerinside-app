"use client";

import { DollarSign, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

const STATUS_META: Record<PayoutStatus, { color: string; icon: React.ReactNode }> = {
  PENDING:    { color: "text-yellow-400", icon: <Clock className="w-4 h-4" /> },
  PROCESSING: { color: "text-blue-400",   icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  COMPLETED:  { color: "text-green-400",  icon: <CheckCircle className="w-4 h-4" /> },
  FAILED:     { color: "text-danger",     icon: <XCircle className="w-4 h-4" /> },
};

export default function PayoutsPage() {
  const t = useTranslations("payouts");
  const locale = useLocale();
  const payoutsQuery = trpc.coach.getPayouts.useQuery();
  const payouts = payoutsQuery.data ?? [];

  const totalPending = payouts
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCompleted = payouts
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  function formatAmount(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("titleA")} <span className="text-primary">{t("titleB")}</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-yellow-500/20">
          <CardBody className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-yellow-500/10">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("pendingLabel")}</p>
              <p className="text-2xl font-bold">{formatAmount(totalPending)}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-green-500/20">
          <CardBody className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-green-500/10">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("totalPaid")}</p>
              <p className="text-2xl font-bold">{formatAmount(totalCompleted)}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <span className="text-foreground font-medium">{t("modelTitle")}</span>{" "}
              {t("modelDescription")}
            </p>
            <p>{t("schedule")}</p>
            <p>{t("min")}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{t("historyTitle")}</h2>
        </CardHeader>
        <CardBody className="p-0">
          {payoutsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground p-4">{t("loading")}</p>
          ) : payouts.length === 0 ? (
            <div className="text-center py-10">
              <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {t("empty")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {payouts.map((payout) => {
                const knownStatus = payout.status as PayoutStatus;
                const meta = STATUS_META[knownStatus] ?? STATUS_META.PENDING;
                return (
                  <div key={payout.id} className="px-4 py-3 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {payout.sourceType === "subscription" ? t("subscription") : t("pack")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payout.periodStart).toLocaleDateString(locale)} —{" "}
                        {new Date(payout.periodEnd).toLocaleDateString(locale)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatAmount(payout.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("platformFee", { fee: formatAmount(payout.platformFee) })}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${meta.color}`}>
                      {meta.icon}
                      <span>{t(`status.${knownStatus}`)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
