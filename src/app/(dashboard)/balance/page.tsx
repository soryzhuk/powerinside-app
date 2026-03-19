"use client";

import { useState } from "react";
import {
  MessageSquare,
  Gift,
  Calendar,
  ShoppingCart,
  Check,
  Zap,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const MESSAGE_PACKS = [
  { messages: 10, price: 10, popular: false },
  { messages: 20, price: 18, popular: false },
  { messages: 50, price: 30, popular: true },
  { messages: 100, price: 50, popular: false },
];

export default function BalancePage() {
  const [purchasing, setPurchasing] = useState<number | null>(null);

  const balanceQuery = trpc.athlete.getBalance.useQuery();
  const balance = balanceQuery.data;

  async function handlePurchase(messages: number, price: number) {
    setPurchasing(messages);
    // TODO: integrate with Stripe payment flow
    // For now, simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setPurchasing(null);
    alert(
      `Оплата $${price} за ${messages} повідомлень буде доступна найближчим часом.`
    );
  }

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
          <p className="text-sm text-muted-foreground">
            повідомлень доступно
          </p>
        </CardBody>
      </Card>

      {/* Subscription info */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Підписка</h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <Zap className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Безкоштовний план</p>
              <p className="text-xs text-muted-foreground">
                50 безкоштовних повідомлень при реєстрації. Оновіть підписку для
                більшого доступу.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Message packs */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Пакети повідомлень</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MESSAGE_PACKS.map((pack) => (
            <Card
              key={pack.messages}
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
                  loading={purchasing === pack.messages}
                  onClick={() => handlePurchase(pack.messages, pack.price)}
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
