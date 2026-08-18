"use client";

import { useState } from "react";
import { LayoutGrid, Link2, MessageCircle, Send } from "lucide-react";

import CampaignForm from "@/components/campaigns/CampaignForm";
import CampaignGrid from "@/components/campaigns/CampaignGrid";
import WhatsAppConnectPanel from "@/components/campaigns/WhatsAppConnectPanel";
import { PageHeader } from "@/components/ui/page-header";
import { useConnections } from "@/contexts/connection-provider";
import type { Campaign } from "@/types/campaign";

type Tab = "connection" | "schedule" | "manage";

export default function WhatsAppCampaignHub() {
  const [tab, setTab] = useState<Tab>("connection");
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    whatsapp: { connected, phone },
    setWhatsAppConnected,
    setWhatsAppDisconnected,
  } = useConnections();

  const handleCampaignCreated = (_campaign?: Campaign) => {
    setRefreshKey((k) => k + 1);
    setTab("manage");
  };

  const tabs = [
    { id: "connection" as Tab, label: "Connection", icon: Link2 },
    { id: "schedule" as Tab, label: "Schedule", icon: Send },
    { id: "manage" as Tab, label: "Manage", icon: LayoutGrid },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        badge="WhatsApp Campaigns"
        badgeIcon={MessageCircle}
        title="WhatsApp Command Center"
        description="Connect WhatsApp Web, schedule message campaigns, and manage delivery with live status updates."
        accent="whatsapp"
        status={
          connected && phone ? (
            <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Connected</p>
              <p className="text-sm font-semibold">{phone}</p>
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
            <h2 className="text-lg font-semibold">WhatsApp connection</h2>
            <p className="text-sm text-muted-foreground">
              Scan the QR code once to link your number. Sessions stay active until you disconnect.
            </p>
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
              <WhatsAppConnectPanel
                onConnected={setWhatsAppConnected}
                onDisconnected={setWhatsAppDisconnected}
              />
            </div>
          </div>
        )}

        {tab === "schedule" && (
          <CampaignForm
            channel="whatsapp"
            connected={connected}
            fromContact={phone}
            onCreated={handleCampaignCreated}
          />
        )}

        {tab === "manage" && (
          <CampaignGrid channel="whatsapp" connected={connected} refreshKey={refreshKey} active />
        )}
      </section>
    </div>
  );
}
