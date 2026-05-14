"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Copy, Check, Users, Gift, Clock } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function ReferralPage() {
  const t = useTranslations("referral");
  const locale = useLocale();
  const { data, isLoading } = trpc.referral.getMyReferral.useQuery();
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = data?.referralCode
    ? `${appUrl}/register?ref=${data.referralCode}`
    : "";

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t.rich("subtitle", { b: (c) => <strong>{c}</strong> })}
        </p>
      </div>

      <Card>
        <CardHeader>{t("yourLink")}</CardHeader>
        <CardBody>
          <div className="flex gap-2 items-center">
            <input
              readOnly
              value={referralLink}
              className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm font-mono text-muted-foreground truncate"
            />
            <button
              onClick={copyLink}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t("codeLabel")}{" "}
            <span className="font-mono font-semibold">{data?.referralCode}</span>
          </p>
        </CardBody>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardBody className="text-center">
            <Users className="mx-auto mb-1 text-primary" size={20} />
            <div className="text-2xl font-bold">{data?.totalReferrals ?? 0}</div>
            <div className="text-xs text-muted-foreground">{t("stats.totalReferred")}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <Gift className="mx-auto mb-1 text-green-500" size={20} />
            <div className="text-2xl font-bold">{data?.totalBonusMessages ?? 0}</div>
            <div className="text-xs text-muted-foreground">{t("stats.bonusEarned")}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <Clock className="mx-auto mb-1 text-yellow-500" size={20} />
            <div className="text-2xl font-bold">{data?.pending ?? 0}</div>
            <div className="text-xs text-muted-foreground">{t("stats.pending")}</div>
          </CardBody>
        </Card>
      </div>

      {(data?.referrals?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>{t("list.title")}</CardHeader>
          <CardBody>
            <div className="space-y-2">
              {data?.referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <div className="text-sm font-medium">{r.referredName}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("list.joined", { date: new Date(r.joinedAt).toLocaleDateString(locale) })}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    r.claimed
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {r.claimed ? t("list.earned", { n: r.bonusAmount }) : t("list.pendingSub")}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>{t("how.title")}</CardHeader>
        <CardBody>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="font-bold text-primary">1.</span> {t("how.step1")}</li>
            <li className="flex gap-2"><span className="font-bold text-primary">2.</span> {t("how.step2")}</li>
            <li className="flex gap-2"><span className="font-bold text-primary">3.</span> {t("how.step3")}</li>
            <li className="flex gap-2"><span className="font-bold text-primary">4.</span> {t("how.step4")}</li>
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}
