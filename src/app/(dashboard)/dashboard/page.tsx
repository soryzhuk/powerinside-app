"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
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
  const balanceQuery = trpc.athlete.getBalance.useQuery();
  const conversationsQuery = trpc.athlete.getConversations.useQuery();

  const balance = balanceQuery.data;
  const conversations = conversationsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Привіт, <span className="text-primary">{userName}</span>!
        </h1>
        <p className="text-muted-foreground mt-1">
          Ваш персональний AI-тренер чекає на вас
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
              <p className="text-sm text-muted-foreground">Баланс повідомлень</p>
              <p className="text-2xl font-bold mt-0.5">
                {balance?.total ?? "..."}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {balance
                  ? `${balance.freeRemaining} безкоштовних / ${balance.weeklyRemaining} тижневих / ${balance.purchasedRemaining} куплених`
                  : "Завантаження..."}
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
              <p className="text-sm text-muted-foreground">Розмови</p>
              <p className="text-2xl font-bold mt-0.5">
                {conversations.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Активних діалогів з AI
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
              <p className="text-sm font-medium">Задати питання</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Запитайте AI-тренера про тренування
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
            <h2 className="text-lg font-semibold">Останні розмови</h2>
            <Link href="/chat">
              <Button variant="ghost" size="sm">
                Всі розмови
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardBody>
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              У вас ще немає розмов. Почніть діалог з AI-тренером!
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
                      {conv.messages[0]?.content ?? "Нова розмова"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conv.updatedAt).toLocaleDateString("uk")}
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
  const profileQuery = trpc.coach.getProfile.useQuery();
  const knowledgeQuery = trpc.coach.getKnowledgeBase.useQuery();
  const rulesQuery = trpc.coach.getRules.useQuery();

  const profile = profileQuery.data;
  const knowledgeCount = knowledgeQuery.data?.length ?? 0;
  const rulesCount = rulesQuery.data?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Привіт, <span className="text-primary">{userName}</span>!
        </h1>
        <p className="text-muted-foreground mt-1">
          Статус:{" "}
          <span
            className={
              profile?.status === "ACTIVE"
                ? "text-green-400"
                : profile?.status === "PENDING"
                  ? "text-yellow-400"
                  : "text-danger"
            }
          >
            {profile?.status ?? "..."}
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
              <p className="text-sm text-muted-foreground">Інтерв'ю</p>
              <p className="text-2xl font-bold mt-0.5">
                {profile?._count.interviewSessions ?? 0}
                <span className="text-base font-normal text-muted-foreground">
                  /7
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Раундів пройдено
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
              <p className="text-sm text-muted-foreground">База знань</p>
              <p className="text-2xl font-bold mt-0.5">{knowledgeCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Записів у базі знань
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
              <p className="text-sm text-muted-foreground">Правила</p>
              <p className="text-2xl font-bold mt-0.5">{rulesCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Методологічних правил
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="flex items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold">Продовжити інтерв'ю</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Пройдіть всі 7 раундів, щоб активувати AI-тренера
            </p>
          </div>
          <Link href="/interview">
            <Button>
              Перейти
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  const statsQuery = trpc.admin.getStats.useQuery();
  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Панель <span className="text-primary">адміністратора</span>
        </h1>
        <p className="text-muted-foreground mt-1">Загальна статистика платформи</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Всього користувачів</p>
              <p className="text-2xl font-bold mt-0.5">
                {stats?.totalUsers ?? "..."}
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
              <p className="text-sm text-muted-foreground">Тренери</p>
              <p className="text-2xl font-bold mt-0.5">
                {stats?.activeCoaches ?? "..."}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  / {stats?.totalCoaches ?? "..."}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Активних / Всього
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
              <p className="text-sm text-muted-foreground">Дохід</p>
              <p className="text-2xl font-bold mt-0.5">
                ${stats?.totalRevenue ?? "..."}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Підписок: {stats?.activeSubscriptions ?? "..."} активних /{" "}
                {stats?.totalSubscriptions ?? "..."} всього
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="flex items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold">Управління тренерами</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Переглядайте, активуйте та призупиняйте тренерів
            </p>
          </div>
          <Link href="/admin/coaches">
            <Button>
              Переглянути
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
  const role = session?.user?.role;
  const name = session?.user?.name ?? "Користувач";

  if (role === "ADMIN" || role === "OWNER") {
    return <AdminDashboard />;
  }

  if (role === "COACH") {
    return <CoachDashboard userName={name} />;
  }

  return <AthleteDashboard userName={name} />;
}
