"use client";

import { Users, UserCheck, Crown, ShoppingCart, TrendingUp, Activity } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function AdminAnalyticsPage() {
  const t = useTranslations("adminAnalytics");
  const tCommon = useTranslations("common");
  const statsQuery = trpc.admin.getStats.useQuery();
  const stats = statsQuery.data;

  const cards = [
    { label: t("cards.totalUsers"), value: stats?.totalUsers, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: t("cards.totalCoaches"), value: stats?.totalCoaches, icon: UserCheck, color: "text-green-400", bg: "bg-green-400/10" },
    { label: t("cards.activeCoaches"), value: stats?.activeCoaches, icon: Activity, color: "text-primary", bg: "bg-primary/10" },
    { label: t("cards.activeSubs"), value: stats?.activeSubscriptions, icon: Crown, color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { label: t("cards.totalSubs"), value: stats?.totalSubscriptions, icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: t("cards.revenue"), value: stats !== undefined ? `$${(stats.totalRevenue / 100).toFixed(2)}` : undefined, icon: ShoppingCart, color: "text-green-400", bg: "bg-green-400/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("titleA")} <span className="text-primary">{t("titleB")}</span>
        </h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardBody className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl shrink-0 ${card.bg}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold mt-0.5">
                    {statsQuery.isLoading ? tCommon("loadingDots") : (card.value ?? 0)}
                  </p>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">{t("coachConversion")}</h2>
          </CardHeader>
          <CardBody>
            {stats ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("totalCoachesRow")}</span>
                  <span>{stats.totalCoaches}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("activeRow")}</span>
                  <span className="text-green-400">{stats.activeCoaches}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-green-400 h-2 rounded-full transition-all"
                    style={{
                      width: stats.totalCoaches
                        ? `${Math.round((stats.activeCoaches / stats.totalCoaches) * 100)}%`
                        : "0%",
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalCoaches
                    ? t("percentActive", { pct: Math.round((stats.activeCoaches / stats.totalCoaches) * 100) })
                    : t("noCoaches")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">{t("subscriptionsTitle")}</h2>
          </CardHeader>
          <CardBody>
            {stats ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("totalSubsRow")}</span>
                  <span>{stats.totalSubscriptions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("activeRow")}</span>
                  <span className="text-primary">{stats.activeSubscriptions}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: stats.totalSubscriptions
                        ? `${Math.round((stats.activeSubscriptions / stats.totalSubscriptions) * 100)}%`
                        : "0%",
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalSubscriptions
                    ? t("percentActive", { pct: Math.round((stats.activeSubscriptions / stats.totalSubscriptions) * 100) })
                    : t("noSubs")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
