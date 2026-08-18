"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Pause,
  Pencil,
  Play,
  RefreshCw,
  Zap,
} from "lucide-react";

import CountdownTimer from "@/components/campaigns/CountdownTimer";
import { campaignApi } from "@/lib/campaign-api";
import type { Campaign, CampaignStatus, TemplateChannel } from "@/types/campaign";
import { Button } from "@/components/ui/button";

type Tab = "active" | "scheduled" | "completed";

type Props = {
  channel: TemplateChannel;
  connected: boolean;
  refreshKey: number;
  active?: boolean;
  onCampaignUpdated?: (campaign: Campaign) => void;
};

const statusColors: Record<CampaignStatus, string> = {
  scheduled: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  active: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  paused: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

export default function CampaignGrid({
  channel,
  connected,
  refreshKey,
  active = true,
  onCampaignUpdated,
}: Props) {
  const [tab, setTab] = useState<Tab>("active");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);
  const requestId = useRef(0);

  const statusMap: Record<Tab, string> = {
    active: "active,paused",
    scheduled: "scheduled",
    completed: "completed,failed",
  };

  const load = useCallback(async () => {
    if (!connected || !active) return;
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const data = await campaignApi.listCampaigns({
        status: statusMap[tab],
        channel,
        page,
        pageSize: 10,
      });
      if (id !== requestId.current) return;
      setCampaigns(data.campaigns);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : "Failed to load campaigns");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [connected, active, tab, channel, page]);

  useEffect(() => {
    if (!active || !connected) return;
    void load();
  }, [load, refreshKey, active, connected]);

  const patchCampaign = (updated: Campaign) => {
    setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    onCampaignUpdated?.(updated);
  };

  const runAction = async (id: number, action: "pause" | "resume" | "run") => {
    setActionId(id);
    setError("");
    try {
      let result;
      if (action === "pause") result = await campaignApi.pauseCampaign(id);
      if (action === "resume") result = await campaignApi.resumeCampaign(id);
      if (action === "run") result = await campaignApi.runCampaignNow(id);
      if (result?.campaign) patchCampaign(result.campaign);
      else await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActionId(null);
    }
  };

  const senderLabel = (c: Campaign) =>
    channel === "whatsapp" ? c.fromPhone || "—" : c.fromEmail || "—";

  if (!connected) {
    return (
      <p className="text-sm text-muted-foreground">
        Connect {channel === "whatsapp" ? "WhatsApp" : "an email account"} to view campaigns.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Campaign management</h2>
          <p className="text-sm text-muted-foreground">
            {total} {channel} campaign{total === 1 ? "" : "s"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2 border-b border-border pb-2">
        {(
          [
            { id: "active" as Tab, label: "Active", icon: Zap },
            { id: "scheduled" as Tab, label: "Scheduled", icon: Clock },
            { id: "completed" as Tab, label: "Completed", icon: CheckCircle2 },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setPage(1);
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && campaigns.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading campaigns...</p>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No {tab} campaigns yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Template</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Recipients</th>
                <th className="px-4 py-3 font-medium">Next run / Schedule</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-border/60 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{senderLabel(c)}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.templateName || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[c.status]}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-green-600">{c.recipientsSent}</span>
                    <span className="text-muted-foreground"> / {c.recipientsTotal}</span>
                    {c.recipientsFailed > 0 && (
                      <span className="ml-1 text-xs text-destructive">
                        ({c.recipientsFailed} failed)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      {c.scheduledAt && c.status === "scheduled" ? (
                        <>
                          <span>{new Date(c.scheduledAt).toLocaleString()}</span>
                          <CountdownTimer targetDate={c.scheduledAt} active />
                        </>
                      ) : c.startedAt && c.status === "active" ? (
                        <span>Started {new Date(c.startedAt).toLocaleString()}</span>
                      ) : c.completedAt ? (
                        <span>Completed {new Date(c.completedAt).toLocaleString()}</span>
                      ) : (
                        "—"
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {tab === "active" && c.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionId === c.id}
                          onClick={() => runAction(c.id, "pause")}
                          title="Pause"
                        >
                          <Pause className="h-3 w-3" />
                        </Button>
                      )}
                      {tab === "active" && c.status === "paused" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionId === c.id}
                          onClick={() => runAction(c.id, "resume")}
                          title="Resume"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      {tab === "scheduled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionId === c.id}
                          onClick={() => runAction(c.id, "run")}
                        >
                          Run now
                        </Button>
                      )}
                      {(tab === "active" || tab === "scheduled") &&
                        (c.status === "active" ||
                          c.status === "paused" ||
                          c.status === "scheduled") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit campaign name"
                            onClick={async () => {
                              const newName = prompt("Campaign name", c.name);
                              if (!newName?.trim()) return;
                              try {
                                const result = await campaignApi.updateCampaign(c.id, {
                                  name: newName.trim(),
                                });
                                patchCampaign(result.campaign);
                              } catch (e) {
                                setError(e instanceof Error ? e.message : "Update failed");
                              }
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
