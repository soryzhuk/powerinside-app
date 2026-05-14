"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  MessageSquare,
  Users,
  DollarSign,
  BookOpen,
  ArrowRight,
  Dumbbell,
  ClipboardList,
  CreditCard,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

function AthleteDashboard({ userName }: { userName: string }) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const balanceQuery = trpc.athlete.getBalance.useQuery();
  const conversationsQuery = trpc.athlete.getConversations.useQuery();

  const balance = balanceQuery.data;
  const conversations = conversationsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("athleteGreeting")} <span className="text-primary">{userName}</span>!
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("athleteSubtitle")}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Message balance */}
        <Card>
          <CardBody className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("balanceLabel")}</p>
              <p className="text-2xl font-bold mt-0.5">
                {balance?.total ?? tCommon("loadingDots")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {balance
                  ? t("balanceBreakdown", {
                      free: balance.freeRemaining,
                      weekly: balance.weeklyRemaining,
                      purchased: balance.purchasedRemaining,
                    })
                  : tCommon("loading")}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Conversations count */}
        <Card>
          <CardBody className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("conversationsLabel")}</p>
              <p className="text-2xl font-bold mt-0.5">
                {conversations.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("conversationsSub")}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Quick action */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardBody className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <Dumbbell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{t("askTitle")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("askSubtitle")}
              </p>
            </div>
            <Link href="/chat">
              <Button size="sm">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>

      {/* Recent conversations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("recentTitle")}</h2>
            <Link href="/chat">
              <Button variant="ghost" size="sm">
                {t("allConversations")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardBody>
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("emptyConversations")}
            </p>
          ) : (
            <div className="space-y-3">
              {conversations.slice(0, 5).map((conv) => (
                <Link
                  key={conv.id}
                  href={`/chat?conversation=${conv.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {conv.messages[0]?.content ?? t("newConversation")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conv.updatedAt).toLocaleDateString(locale)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function CoachDashboard({ userName }: { userName: string }) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("coachStatus");
  const profileQuery = trpc.coach.getProfile.useQuery();
  const knowledgeQuery = trpc.coach.getKnowledgeBase.useQuery();
  const rulesQuery = trpc.coach.getRules.useQuery();

  const profile = profileQuery.data;
  const knowledgeCount = knowledgeQuery.data?.length ?? 0;
  const rulesCount = rulesQuery.data?.length ?? 0;

  const statusLabel = profile?.status
    ? tStatus(profile.status as "PENDING" | "ACTIVE" | "SUSPENDED")
    : tCommon("loadingDots");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("athleteGreeting")} <span className="text-primary">{userName}</span>!
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("coachStatusLine")}{" "}
          <span
            className={
              profile?.status === "ACTIVE"
                ? "text-green-400"
                : profile?.status === "PENDING"
                  ? "text-yellow-400"
                  : "text-danger"
            }
          >
            {statusLabel}
          </span>
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Interview progress */}
        <Card>
          <CardBody className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("interviewCard")}</p>
              <p className="text-2xl font-bold mt-0.5">
                {profile?._count.interviewSessions ?? 0}
                <span className="text-base font-normal text-muted-foreground">
                  /7
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("interviewSub")}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Knowledge base */}
        <Card>
          <CardBody className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("knowledgeCard")}</p>
              <p className="text-2xl font-bold mt-0.5">{knowledgeCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("knowledgeSub")}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Methodology rules */}
        <Card>
          <CardBody className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("rulesCard")}</p>
              <p className="text-2xl font-bold mt-0.5">{rulesCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("rulesSub")}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="flex items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold">{t("continueTitle")}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("continueSub")}
            </p>
          </div>
          <Link href="/interview">
            <Button>
              {t("goto")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const statsQuery = trpc.admin.getStats.useQuery();
  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("adminTitle")} <span className="text-primary">{t("adminPanelLine")}</span>
        </h1>
        <p className="text-muted-foreground mt-1">{t("adminSubtitle")}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("totalUsers")}</p>
              <p className="text-2xl font-bold mt-0.5">
                {stats?.totalUsers ?? tCommon("loadingDots")}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <Dumbbell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("coaches")}</p>
              <p className="text-2xl font-bold mt-0.5">
                {stats?.activeCoaches ?? tCommon("loadingDots")}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  / {stats?.totalCoaches ?? tCommon("loadingDots")}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("activeTotal")}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("revenue")}</p>
              <p className="text-2xl font-bold mt-0.5">
                ${stats?.totalRevenue ?? tCommon("loadingDots")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats
                  ? t("subscriptionsInfo", {
                      active: stats.activeSubscriptions,
                      total: stats.totalSubscriptions,
                    })
                  : tCommon("loading")}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="flex items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold">{t("manageCoachesTitle")}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("manageCoachesSub")}
            </p>
          </div>
          <Link href="/admin/coaches">
            <Button>
              {t("manageCoachesAction")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const tRoles = useTranslations("roles");
  const role = session?.user?.role;
  const name = session?.user?.name ?? tRoles("defaultUserName");

  if (role === "ADMIN" || role === "OWNER") {
    return <AdminDashboard />;
  }

  if (role === "COACH") {
    return <CoachDashboard userName={name} />;
  }

  return <AthleteDashboard userName={name} />;
}
