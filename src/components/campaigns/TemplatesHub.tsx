"use client";

import { useState } from "react";
import { FileText, Mail, MessageCircle } from "lucide-react";

import TemplateManager from "@/components/campaigns/TemplateManager";
import { PageHeader } from "@/components/ui/page-header";
import { useConnections } from "@/contexts/connection-provider";
import type { TemplateChannel } from "@/types/campaign";

export default function TemplatesHub() {
  const { google, whatsapp } = useConnections();
  const [channel, setChannel] = useState<TemplateChannel>("email");

  const connected = channel === "email" ? google.connected : whatsapp.connected;
  const contact = channel === "email" ? google.email : whatsapp.phone;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        badge="Templates"
        badgeIcon={FileText}
        title="Message Templates"
        description="Create and manage email and WhatsApp templates. Use Simple templates for identical messages or Dynamic templates with personalized variables."
        accent="templates"
        status={
          connected && contact ? (
            <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
                {channel === "email" ? "Gmail connected" : "WhatsApp connected"}
              </p>
              <p className="text-sm font-semibold">{contact}</p>
            </div>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-2">
        {(
          [
            { id: "email" as TemplateChannel, label: "Email", icon: Mail },
            { id: "whatsapp" as TemplateChannel, label: "WhatsApp", icon: MessageCircle },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setChannel(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              channel === id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
        {!connected && (
          <div className="mb-6 rounded-lg border border-amber-200/60 bg-amber-50/50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
            Connect {channel === "email" ? "Gmail" : "WhatsApp"} from the{" "}
            {channel === "email" ? "Email" : "WhatsApp"} Campaigns page to save templates and
            schedule sends.
          </div>
        )}
        <TemplateManager
          connected={connected}
          defaultChannel={channel}
          lockChannel
          key={channel}
        />
      </section>
    </div>
  );
}
