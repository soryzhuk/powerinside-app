"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Gift,
  Calendar,
  ShoppingCart,
  Check,
  Zap,
  Crown,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const MESSAGE_PACKS = [
  { id: "pack_10", messages: 10, price: 10, popular: false },
  { id: "pack_20", messages: 20, price: 18, popular: false },
  { id: "pack_50", messages: 50, price: 30, popular: true },
  { id: "pack_100", messages: 100, price: 50, popular: false },
];

function BalanceContent() {
  const searchParams = useSearchParams();

  const balanceQuery = trpc.athlete.getBalance.useQuery();
  const subscriptionQuery = trpc.billing.getSubscription.useQuery();
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation();

  const balance = balanceQuery.data;
  const subscription = subscriptionQuery.data;

  // Show feedback after Stripe redirect
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      balanceQuery.refetch();
      subscriptionQuery.refetch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePurchasePack(packId: string) {
    const result = await checkoutMutation.mutateAsync({
      type: "pack",
      planId: packId,
    });
    if (result.url) window.location.href = result.url;
  }

  async function handleSubscribe() {
    const result = await checkoutMutation.mutateAsync({
      type: "subscription",
      planId: "BASIC",
    });
    if (result.url) window.location.href = result.url;
  }

  const hasActiveSubscription = subscription?.status === "ACTIVE";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Баланс <span className="text-primary">повідомлень</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Управляйте своїм балансом та купуйте пакети повідомлень
        </p>
      </div>

      {searchParams.get("success") === "1" && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          ✓ Оплата успішна! Ваш баланс оновлено.
        </div>
      )}

      {searchParams.get("canceled") === "1" && (
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
          Оплату скасовано.
        </div>
      )}

      {/* Current balance */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-green-500/10 shrink-0">
              <Gift className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Безкоштовні</p>
              <p className="text-2xl font-bold mt-0.5">
                {balance?.freeRemaining ?? "..."}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-blue-500/10 shrink-0">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Тижневі</p>
              <p className="text-2xl font-bold mt-0.5">
                {balance?.weeklyRemaining ?? "..."}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Куплені</p>
              <p className="text-2xl font-bold mt-0.5">
                {balance?.purchasedRemaining ?? "..."}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Total */}
      <Card className="border-primary/30">
        <CardBody className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Загальний баланс</p>
            <p className="text-3xl font-bold">{balance?.total ?? "..."}</p>
          </div>
          <p className="text-sm text-muted-foreground">повідомлень доступно</p>
        </CardBody>
      </Card>

      {/* Subscription */}
      <Card className={hasActiveSubscription ? "border-primary/40" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Підписка</h2>
            {hasActiveSubscription && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-medium">
                Активна
              </span>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {hasActiveSubscription ? (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {subscription?.plan ?? "BASIC"} — $30 / місяць
                </p>
                <p className="text-xs text-muted-foreground">
                  {subscription?.currentPeriodEnd
                    ? `Наступне списання: ${new Date(subscription.currentPeriodEnd).toLocaleDateString("uk-UA")}`
                    : "Підписка активна"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">
                  Basic — $30 / місяць
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    20 повідомлень на тиждень
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    AI-чат з тренером
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    Доступ до методики
                  </li>
                </ul>
                <Button
                  variant="primary"
                  size="sm"
                  loading={checkoutMutation.isPending}
                  onClick={handleSubscribe}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Підключити Basic
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Message packs */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Пакети повідомлень</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MESSAGE_PACKS.map((pack) => (
            <Card
              key={pack.id}
              className={
                pack.popular
                  ? "border-primary/50 ring-1 ring-primary/20"
                  : ""
              }
            >
              {pack.popular && (
                <div className="px-4 py-1.5 bg-primary text-white text-xs font-medium text-center">
                  Найпопулярніший
                </div>
              )}
              <CardBody className="text-center py-6">
                <p className="text-3xl font-bold">{pack.messages}</p>
                <p className="text-sm text-muted-foreground mb-1">повідомлень</p>
                <p className="text-2xl font-bold text-primary mb-1">
                  ${pack.price}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  ${(pack.price / pack.messages).toFixed(2)} / повідомлення
                </p>

                <ul className="text-xs text-muted-foreground space-y-1.5 mb-6 text-left">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    Без терміну дії
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    Будь-який тренер
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    Миттєві відповіді
                  </li>
                </ul>

                <Button
                  fullWidth
                  variant={pack.popular ? "primary" : "outline"}
                  loading={checkoutMutation.isPending}
                  onClick={() => handlePurchasePack(pack.id)}
                >
                  Купити
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BalancePage() {
  return (
    <Suspense>
      <BalanceContent />
    </Suspense>
  );
}
