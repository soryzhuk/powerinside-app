"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

const COUNTRIES = [
  { value: "UA", label: "Україна" },
  { value: "US", label: "США" },
  { value: "GB", label: "Великобританія" },
  { value: "DE", label: "Німеччина" },
  { value: "PL", label: "Польща" },
  { value: "CA", label: "Канада" },
  { value: "AU", label: "Австралія" },
  { value: "OTHER", label: "Інша" },
];

const LANGUAGES = [
  { value: "uk", label: "Українська" },
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
];

type Role = "ATHLETE" | "COACH";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "coach" ? "COACH" : "ATHLETE";
  const refCode = searchParams.get("ref") ?? undefined;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("UA");
  const [language, setLanguage] = useState("uk");
  const [role, setRole] = useState<Role>(initialRole as Role);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const registerMutation = trpc.auth.register.useMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await registerMutation.mutateAsync({
        name,
        email,
        password,
        phone: phone || undefined,
        country,
        address: address || undefined,
        language,
        role,
        referralCode: refCode,
      });

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Реєстрація успішна, але не вдалось увійти. Спробуйте увійти вручну.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Сталася помилка при реєстрації.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardBody className="p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="p-2.5 rounded-xl bg-primary/10 mb-4">
            <Dumbbell className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Реєстрація в <span className="text-primary">PowerInside</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Створіть акаунт, щоб почати
          </p>
        </div>

        {/* Role Toggle */}
        <div className="flex rounded-lg bg-secondary border border-border p-1 mb-6">
          <button
            type="button"
            onClick={() => setRole("ATHLETE")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
              role === "ATHLETE"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Атлет
          </button>
          <button
            type="button"
            onClick={() => setRole("COACH")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
              role === "COACH"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Тренер
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {refCode && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-600 dark:text-green-400">
              🎁 Вас запросили! Після реєстрації ви отримаєте <strong>5 бонусних повідомлень</strong>.
            </div>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
              {error}
            </div>
          )}

          <Input
            label="Ім'я"
            type="text"
            placeholder="Іван Петренко"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />

          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Телефон"
            type="tel"
            placeholder="+380 XX XXX XX XX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />

          <Input
            label="Поштова адреса"
            type="text"
            placeholder="вул. Шевченка, 1, м. Київ"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="street-address"
          />

          <Input
            label="Пароль"
            type="password"
            placeholder="Мінімум 6 символів"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Країна</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus"
            >
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Мова</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            className="mt-2"
          >
            Зареєструватись
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground mt-6">
          Вже є акаунт?{" "}
          <Link
            href="/login"
            className="text-primary hover:underline font-medium"
          >
            Увійти
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
