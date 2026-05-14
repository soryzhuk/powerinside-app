"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { locales, localeNames } from "@/i18n/config";

const COUNTRY_CODES = ["UA", "US", "GB", "DE", "PL", "CA", "AU", "OTHER"] as const;

type Role = "ATHLETE" | "COACH";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("authRegister");
  const tCountries = useTranslations("countries");
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
        setError(t("postSignInError"));
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("generalError");
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
            {t("title")} <span className="text-primary">PowerInside</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("subtitle")}
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
            {t("athlete")}
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
            {t("coach")}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {refCode && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-600 dark:text-green-400">
              {t.rich("referralBonus", { b: (c) => <strong>{c}</strong> })}
            </div>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
              {error}
            </div>
          )}

          <Input
            label={t("nameLabel")}
            type="text"
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />

          <Input
            label={t("emailLabel")}
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label={t("phoneLabel")}
            type="tel"
            placeholder={t("phonePlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />

          <Input
            label={t("addressLabel")}
            type="text"
            placeholder={t("addressPlaceholder")}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="street-address"
          />

          <Input
            label={t("passwordLabel")}
            type="password"
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">{t("countryLabel")}</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus"
            >
              {COUNTRY_CODES.map((code) => (
                <option key={code} value={code}>
                  {tCountries(code)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">{t("languageLabel")}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus"
            >
              {locales.map((l) => (
                <option key={l} value={l}>
                  {localeNames[l]}
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
            {t("submit")}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground mt-6">
          {t("hasAccount")}{" "}
          <Link
            href="/login"
            className="text-primary hover:underline font-medium"
          >
            {t("loginLink")}
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
