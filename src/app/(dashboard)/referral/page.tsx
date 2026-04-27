"use client";

import { useState } from "react";
import { Copy, Check, Users, Gift, Clock } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function ReferralPage() {
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
      <div className="flex items-center justify-center h-64 text-[var(--color-text2)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Referral Program</h1>
        <p className="text-[var(--color-text2)] mt-1 text-sm">
          Invite new athletes — get <strong>5 bonus messages</strong> when they subscribe.
          They receive <strong>5 welcome messages</strong> just for joining with your link.
        </p>
      </div>

      {/* Referral link */}
      <Card>
        <CardHeader>Your Referral Link</CardHeader>
        <CardBody>
          <div className="flex gap-2 items-center">
            <input
              readOnly
              value={referralLink}
              className="flex-1 bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--color-text2)] truncate"
            />
            <button
              onClick={copyLink}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-[var(--color-text2)] mt-2">
            Code: <span className="font-mono font-semibold">{data?.referralCode}</span>
          </p>
        </CardBody>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardBody className="text-center">
            <Users className="mx-auto mb-1 text-[var(--color-accent)]" size={20} />
            <div className="text-2xl font-bold">{data?.totalReferrals ?? 0}</div>
            <div className="text-xs text-[var(--color-text2)]">Total Referred</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <Gift className="mx-auto mb-1 text-green-500" size={20} />
            <div className="text-2xl font-bold">{data?.totalBonusMessages ?? 0}</div>
            <div className="text-xs text-[var(--color-text2)]">Bonus Messages Earned</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <Clock className="mx-auto mb-1 text-yellow-500" size={20} />
            <div className="text-2xl font-bold">{data?.pending ?? 0}</div>
            <div className="text-xs text-[var(--color-text2)]">Pending (not subscribed yet)</div>
          </CardBody>
        </Card>
      </div>

      {/* Referral list */}
      {(data?.referrals?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>Referred Athletes</CardHeader>
          <CardBody>
            <div className="space-y-2">
              {data?.referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
                  <div>
                    <div className="text-sm font-medium">{r.referredName}</div>
                    <div className="text-xs text-[var(--color-text2)]">
                      Joined {new Date(r.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    r.claimed
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {r.claimed ? `+${r.bonusAmount} msgs earned` : "Pending subscription"}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* How it works */}
      <Card>
        <CardHeader>How It Works</CardHeader>
        <CardBody>
          <ol className="space-y-2 text-sm text-[var(--color-text2)]">
            <li className="flex gap-2"><span className="font-bold text-[var(--color-accent)]">1.</span> Share your referral link with a new athlete.</li>
            <li className="flex gap-2"><span className="font-bold text-[var(--color-accent)]">2.</span> They register and get 5 bonus messages immediately.</li>
            <li className="flex gap-2"><span className="font-bold text-[var(--color-accent)]">3.</span> When they purchase their first subscription, you receive 5 bonus messages.</li>
            <li className="flex gap-2"><span className="font-bold text-[var(--color-accent)]">4.</span> Bonus messages never expire and stay on your balance.</li>
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}
