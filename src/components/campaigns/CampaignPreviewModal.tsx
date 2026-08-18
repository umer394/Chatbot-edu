"use client";

import { Eye, X } from "lucide-react";

import type { CampaignTemplate } from "@/types/campaign";
import { buildPreviewEntries } from "@/lib/campaign-validation";
import type { CampaignRecipient } from "@/types/campaign";
import { Button } from "@/components/ui/button";

type Props = {
  template: CampaignTemplate;
  recipients: CampaignRecipient[];
  onConfirm: () => void;
  onClose: () => void;
  confirming?: boolean;
  mode: "preview" | "test";
};

export default function CampaignPreviewModal({
  template,
  recipients,
  onConfirm,
  onClose,
  confirming = false,
  mode,
}: Props) {
  const entries = buildPreviewEntries(template, recipients);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Eye className="h-5 w-5 text-primary" />
              {mode === "test" ? "Test email preview" : "Review personalized emails"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Verify each recipient&apos;s subject and body before confirming the schedule.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {entries.map((entry) => (
            <div
              key={entry.row}
              className="rounded-xl border border-border bg-muted/20 p-4"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  #{entry.row} · {entry.phone || entry.email}
                </span>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(entry.context)
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <span
                        key={k}
                        className="rounded bg-background px-2 py-0.5 text-[10px] ring-1 ring-border"
                      >
                        {k}: {v}
                      </span>
                    ))}
                </div>
              </div>
              <p className="text-xs font-medium text-muted-foreground">Subject</p>
              <p className="mb-2 rounded bg-background px-3 py-2 text-sm">{entry.subject}</p>
              <p className="text-xs font-medium text-muted-foreground">Body</p>
              <pre className="whitespace-pre-wrap rounded bg-background px-3 py-2 text-sm font-sans">
                {entry.body}
              </pre>
              {template.attachments.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Attachments: {template.attachments.map((a) => a.name).join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Back to edit
          </Button>
          <Button type="button" onClick={onConfirm} disabled={confirming}>
            {confirming
              ? "Scheduling..."
              : mode === "test"
                ? "Confirm & schedule"
                : "Confirm schedule"}
          </Button>
        </div>
      </div>
    </div>
  );
}
