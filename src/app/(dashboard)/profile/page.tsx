"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { User, Mail, Phone, Globe, Languages, Shield, Upload, FileCheck } from "lucide-react";
import { Card, CardBody, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { locales, localeNames, type Locale } from "@/i18n/config";

const COUNTRY_CODES = ["UA", "US", "GB", "DE", "PL", "CA", "AU", "OTHER"] as const;

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("profile");
  const tCountries = useTranslations("countries");
  const tRoles = useTranslations("roles");
  const tLang = useTranslations("language");
  const currentLocale = useLocale() as Locale;
  const role = session?.user?.role;
  const isCoach = role === "COACH";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [uiLocale, setUiLocale] = useState<Locale>(currentLocale);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [docUploaded, setDocUploaded] = useState(false);
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const profileQuery = trpc.auth.getProfile.useQuery();
  const coachProfileQuery = trpc.coach.getProfile.useQuery(undefined, { enabled: isCoach });
  const updateMutation = trpc.auth.updateProfile.useMutation();

  useEffect(() => {
    const p = profileQuery.data;
    if (p) {
      setName(p.name ?? "");
      setEmail(p.email);
      setPhone(p.phone ?? "");
      setCountry(p.country ?? "");
      if (p.language && (locales as readonly string[]).includes(p.language)) {
        setUiLocale(p.language as Locale);
      }
    }
  }, [profileQuery.data]);

  const coachProfile = coachProfileQuery.data;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        name,
        phone: phone || undefined,
        country: country || undefined,
        language: uiLocale,
      });
      if (uiLocale !== currentLocale) {
        await fetch("/api/locale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: uiLocale }),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      profileQuery.refetch();
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  }

  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/coach/upload-doc", { method: "POST", body: fd });
      if (res.ok) { setDocUploaded(true); coachProfileQuery.refetch(); }
      else {
        const d = await res.json();
        alert(d.error ?? t("coach.uploadFailed"));
      }
    } finally {
      setDocUploading(false);
    }
  }

  const knownRole = (["ATHLETE", "COACH", "INVESTOR", "ADMIN", "OWNER"] as const).includes(role as never)
    ? (role as "ATHLETE" | "COACH" | "INVESTOR" | "ADMIN" | "OWNER")
    : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("titleA")} <span className="text-primary">{t("titleB")}</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t("basicInfo")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("roleLabel")}{" "}
                <span className="font-medium text-foreground">
                  {knownRole ? tRoles(knownRole) : role ?? "..."}
                </span>
              </p>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSave}>
          <CardBody className="space-y-4">
            {saved && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
                {t("savedMsg")}
              </div>
            )}

            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-muted-foreground mt-8 shrink-0" />
              <div className="flex-1">
                <Input
                  label={t("nameLabel")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-muted-foreground mt-8 shrink-0" />
              <div className="flex-1">
                <Input
                  label={t("emailLabel")}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled
                  helperText={t("emailHelper")}
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-muted-foreground mt-8 shrink-0" />
              <div className="flex-1">
                <Input
                  label={t("phoneLabel")}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("phonePlaceholder")}
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Globe className="w-4 h-4 text-muted-foreground mt-8 shrink-0" />
              <div className="flex-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {t("countryLabel")}
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus"
                  >
                    <option value="">{t("countryPlaceholder")}</option>
                    {COUNTRY_CODES.map((code) => (
                      <option key={code} value={code}>
                        {tCountries(code)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Languages className="w-4 h-4 text-muted-foreground mt-8 shrink-0" />
              <div className="flex-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {t("languageLabel")}
                  </label>
                  <select
                    value={uiLocale}
                    onChange={(e) => setUiLocale(e.target.value as Locale)}
                    aria-label={tLang("select")}
                    className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus"
                  >
                    {locales.map((l) => (
                      <option key={l} value={l}>
                        {localeNames[l]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardBody>

          <CardFooter className="flex justify-end">
            <Button type="submit" loading={saving}>
              {t("save")}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {isCoach && coachProfile && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{t("coach.title")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("coach.subtitle")}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {t("coach.statusLabel")}
                </p>
                <p
                  className={`text-sm font-semibold ${
                    coachProfile.status === "ACTIVE"
                      ? "text-green-400"
                      : coachProfile.status === "PENDING"
                        ? "text-yellow-400"
                        : "text-danger"
                  }`}
                >
                  {coachProfile.status === "ACTIVE"
                    ? t("coach.active")
                    : coachProfile.status === "PENDING"
                      ? t("coach.pending")
                      : t("coach.suspended")}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {t("coach.roundsLabel")}
                </p>
                <p className="text-sm font-semibold">
                  {t("coach.roundsValue", { done: coachProfile._count.interviewSessions })}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {t("coach.knowledgeLabel")}
                </p>
                <p className="text-sm font-semibold">
                  {t("coach.knowledgeValue", { n: coachProfile._count.knowledgeBase })}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {t("coach.rulesLabel")}
                </p>
                <p className="text-sm font-semibold">
                  {t("coach.rulesValue", { n: coachProfile._count.methodologyRules })}
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-lg border border-border bg-secondary/30">
              <p className="text-sm font-medium mb-1 flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                {t("coach.identityTitle")}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {t("coach.identitySubtitle")}
              </p>

              {coachProfile.identityDoc ? (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <FileCheck className="w-4 h-4" />
                  {t("coach.uploaded")}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="text-xs text-muted-foreground hover:text-foreground underline ml-2"
                  >
                    {t("coach.replace")}
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={docUploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {docUploading ? t("coach.uploading") : t("coach.upload")}
                </Button>
              )}

              {docUploaded && !coachProfile.identityDoc && (
                <p className="text-xs text-green-400 mt-1">{t("coach.uploadSuccess")}</p>
              )}

              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleDocUpload}
              />
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
