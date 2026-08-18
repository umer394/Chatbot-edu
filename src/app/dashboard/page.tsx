"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MessageCircle,
  Megaphone,
  Send,
  Users,
  Zap,
} from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { useConnections } from "@/contexts/connection-provider";
import { Button } from "@/components/ui/button";
import { contactApi } from "@/lib/contact-api";
import type { DashboardStats } from "@/types/contact";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function ChannelSection({
  title,
  icon: Icon,
  contacts,
  campaigns,
  href,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  contacts: DashboardStats["contacts"]["email"];
  campaigns: DashboardStats["campaigns"]["email"];
  href: string;
}) {
  const activeCampaigns = campaigns.active + campaigns.paused + campaigns.scheduled;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={href}>Open</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total contacts" value={contacts.total} icon={Users} />
        <StatCard label="Pending" value={contacts.pending} icon={Clock} />
        <StatCard label="Sent" value={contacts.sent} icon={CheckCircle2} />
        <StatCard label="Active campaigns" value={activeCampaigns} sub="scheduled + running" icon={Zap} />
        <StatCard label="Completed" value={campaigns.completed} icon={CheckCircle2} />
        <StatCard label="Failed sends" value={contacts.failed} icon={Megaphone} />
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const { google, whatsapp } = useConnections();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    contactApi
      .getStats()
      .then(setStats)
      .catch((e) => setStatsError(e instanceof Error ? e.message : "Failed to load stats"));
  }, []);

  const cards = [
    {
      title: "Email Campaigns",
      description: "Connect Gmail, schedule sends, and track delivery.",
      href: "/dashboard/campaigns/email",
      icon: Mail,
      connected: google.connected,
      contact: google.email,
    },
    {
      title: "WhatsApp Campaigns",
      description: "Link WhatsApp Web and run message campaigns.",
      href: "/dashboard/campaigns/whatsapp",
      icon: MessageCircle,
      connected: whatsapp.connected,
      contact: whatsapp.phone,
    },
    {
      title: "Contacts",
      description: "View pending, sent, and failed contacts by channel.",
      href: "/dashboard/contacts",
      icon: Users,
      connected: true,
      contact: stats ? `${stats.contacts.total.total} total` : null,
    },
    {
      title: "Templates",
      description: "Manage email and WhatsApp message templates.",
      href: "/dashboard/templates",
      icon: FileText,
      connected: google.connected || whatsapp.connected,
      contact: null,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <PageHeader
        badge="Dashboard"
        badgeIcon={Megaphone}
        title="Campaign overview"
        description="Key email and WhatsApp contact and campaign statistics at a glance."
      />

      {statsError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {statsError}
        </p>
      )}

      {stats && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChannelSection
            title="Email"
            icon={Mail}
            contacts={stats.contacts.email}
            campaigns={stats.campaigns.email}
            href="/dashboard/campaigns/email"
          />
          <ChannelSection
            title="WhatsApp"
            icon={MessageCircle}
            contacts={stats.contacts.whatsapp}
            campaigns={stats.campaigns.whatsapp}
            href="/dashboard/campaigns/whatsapp"
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-primary/30 hover:shadow-md"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <card.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold group-hover:text-primary">{card.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
            {card.connected && card.contact && (
              <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {card.href === "/dashboard/contacts"
                  ? card.contact
                  : `Connected · ${card.contact}`}
              </p>
            )}
            {!card.connected && card.href !== "/dashboard/templates" && card.href !== "/dashboard/contacts" && (
              <p className="mt-3 text-xs text-muted-foreground">Not connected</p>
            )}
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="font-semibold">Quick start</h3>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>1. Connect Email or WhatsApp from the campaign pages</li>
          <li>2. Add contacts manually or via campaign recipients</li>
          <li>3. Create templates and schedule campaigns — status updates automatically on send</li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/dashboard/contacts">
              <Users className="mr-2 h-4 w-4" />
              Manage contacts
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/campaigns/email">
              <Send className="mr-2 h-4 w-4" />
              Email campaigns
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
