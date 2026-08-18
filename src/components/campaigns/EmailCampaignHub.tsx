"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutGrid, Link2, Mail, Send } from "lucide-react";

import VerifyEmailButton from "@/components/VerifyEmailButton";
import CampaignForm from "@/components/campaigns/CampaignForm";
import CampaignGrid from "@/components/campaigns/CampaignGrid";
import { PageHeader } from "@/components/ui/page-header";
import { useConnections } from "@/contexts/connection-provider";

type Tab = "connection" | "schedule" | "manage";

export default function EmailCampaignHub() {
  const [tab, setTab] = useState<Tab>("connection");
  const [message, setMessage] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    google: { connected, email, loading },
    setGoogleConnected,
    setGoogleDisconnected,
    refreshGoogle,
  } = useConnections();

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/auth/google/disconnect", { method: "POST", credentials: "include" });
      setGoogleDisconnected();
      setMessage("Account disconnected.");
    } catch {
      setMessage("Failed to disconnect.");
    } finally {
      setDisconnecting(false);
    }
  };

  const tabs = [
    { id: "connection" as Tab, label: "Connection", icon: Link2 },
    { id: "schedule" as Tab, label: "Schedule", icon: Send },
    { id: "manage" as Tab, label: "Manage", icon: LayoutGrid },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        badge="Email Campaigns"
        badgeIcon={Mail}
        title="Email Command Center"
        description="Connect Gmail, schedule campaigns to up to 10 recipients, and manage sends with a daily safety limit."
        accent="email"
        status={
          connected && email ? (
            <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Connected</p>
              <p className="text-sm font-semibold">{email}</p>
            </div>
          ) : undefined
        }
      />

      <nav className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              tab === id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
        {tab === "connection" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Email account connection</h2>
            <p className="text-sm text-muted-foreground">
              Connect Google/Gmail to send campaigns. OAuth opens in a new browser tab.
            </p>
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
              {loading && !email ? (
                <p className="text-sm text-muted-foreground">Checking connection...</p>
              ) : connected && email ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{email}</p>
                    <p className="text-xs text-muted-foreground">Ready to send campaigns</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="rounded-lg border border-destructive/30 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                  >
                    {disconnecting ? "Disconnecting..." : "Disconnect"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">No account connected</p>
                  <VerifyEmailButton
                    onVerified={(verifiedEmail) => {
                      setMessage("Connected successfully.");
                      setGoogleConnected(verifiedEmail);
                      void refreshGoogle(true);
                    }}
                  />
                </div>
              )}
            </div>
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </div>
        )}

        {tab === "schedule" && (
          <CampaignForm
            channel="email"
            connected={connected}
            fromContact={email}
            onCreated={() => {
              setRefreshKey((k) => k + 1);
              setTab("manage");
            }}
          />
        )}

        {tab === "manage" && (
          <CampaignGrid channel="email" connected={connected} refreshKey={refreshKey} active />
        )}
      </section>
    </div>
  );
}
