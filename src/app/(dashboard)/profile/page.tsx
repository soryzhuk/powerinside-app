"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Phone, Globe, Languages, Shield, Upload, FileCheck } from "lucide-react";
import { Card, CardBody, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function ProfilePage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isCoach = role === "COACH";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [docUploaded, setDocUploaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const profileQuery = trpc.auth.getProfile.useQuery();
  const coachProfileQuery = trpc.coach.getProfile.useQuery(undefined, { enabled: isCoach });
  const updateMutation = trpc.auth.updateProfile.useMutation();

  // Populate form from DB
  useEffect(() => {
    const p = profileQuery.data;
    if (p) {
      setName(p.name ?? "");
      setEmail(p.email);
      setPhone(p.phone ?? "");
      setCountry(p.country ?? "");
      setLanguage(p.language ?? "uk");
    }
  }, [profileQuery.data]);

  const coachProfile = coachProfileQuery.data;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMutation.mutateAsync({ name, phone: phone || undefined, country: country || undefined, language: language || undefined });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      profileQuery.refetch();
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
      else { const d = await res.json(); alert(d.error ?? "Upload failed"); }
    } finally {
      setDocUploading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Мій <span className="text-primary">профіль</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Переглядайте та редагуйте свою інформацію
        </p>
      </div>

      {/* User info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Основна інформація</h2>
              <p className="text-sm text-muted-foreground">
                Роль:{" "}
                <span className="font-medium text-foreground">
                  {role === "ATHLETE"
                    ? "Атлет"
                    : role === "COACH"
                      ? "Тренер"
                      : role === "ADMIN"
                        ? "Адміністратор"
                        : role ?? "..."}
                </span>
              </p>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSave}>
          <CardBody className="space-y-4">
            {saved && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
                Профіль успішно оновлено!
              </div>
            )}

            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-muted-foreground mt-8 shrink-0" />
              <div className="flex-1">
                <Input
                  label="Ім'я"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше ім'я"
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-muted-foreground mt-8 shrink-0" />
              <div className="flex-1">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled
                  helperText="Email неможливо змінити"
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-muted-foreground mt-8 shrink-0" />
              <div className="flex-1">
                <Input
                  label="Телефон"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+380 XX XXX XX XX"
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Globe className="w-4 h-4 text-muted-foreground mt-8 shrink-0" />
              <div className="flex-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Країна
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus"
                  >
                    <option value="">Оберіть країну</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
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
                    Мова
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus"
                  >
                    <option value="">Оберіть мову</option>
                    {LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardBody>

          <CardFooter className="flex justify-end">
            <Button type="submit" loading={saving}>
              Зберегти зміни
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Coach profile details */}
      {isCoach && coachProfile && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Профіль тренера</h2>
                <p className="text-sm text-muted-foreground">
                  Статус та статистика вашого тренерського профілю
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Статус
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
                    ? "Активний"
                    : coachProfile.status === "PENDING"
                      ? "Очікує активації"
                      : "Призупинений"}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Раунди інтерв'ю
                </p>
                <p className="text-sm font-semibold">
                  {coachProfile._count.interviewSessions} / 7 пройдено
                </p>
              </div>

              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  База знань
                </p>
                <p className="text-sm font-semibold">
                  {coachProfile._count.knowledgeBase} записів
                </p>
              </div>

              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Методологічні правила
                </p>
                <p className="text-sm font-semibold">
                  {coachProfile._count.methodologyRules} правил
                </p>
              </div>
            </div>

            {/* Identity document upload (ТЗ п.3.1) */}
            <div className="mt-4 p-4 rounded-lg border border-border bg-secondary/30">
              <p className="text-sm font-medium mb-1 flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                Документ що підтверджує особу
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Вимагається для верифікації. Формати: JPEG, PNG, PDF. Макс. 10 МБ.
              </p>

              {coachProfile.identityDoc ? (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <FileCheck className="w-4 h-4" />
                  Документ завантажено
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="text-xs text-muted-foreground hover:text-foreground underline ml-2"
                  >
                    замінити
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
                  {docUploading ? "Завантаження…" : "Завантажити документ"}
                </Button>
              )}

              {docUploaded && !coachProfile.identityDoc && (
                <p className="text-xs text-green-400 mt-1">✓ Документ успішно завантажено</p>
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
