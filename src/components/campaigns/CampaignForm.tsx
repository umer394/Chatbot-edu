"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Eye, Send } from "lucide-react";

import BulkEmailPaste from "@/components/campaigns/BulkEmailPaste";
import BulkPhonePaste from "@/components/campaigns/BulkPhonePaste";
import CampaignPreviewModal from "@/components/campaigns/CampaignPreviewModal";
import DynamicRecipientGrid from "@/components/campaigns/DynamicRecipientGrid";
import VariableGuide from "@/components/campaigns/VariableGuide";
import { campaignApi } from "@/lib/campaign-api";
import { normalizePhone, validateRecipients } from "@/lib/campaign-validation";
import type { CampaignRecipient, CampaignTemplate, DailyQuota, TemplateChannel } from "@/types/campaign";
import { MAX_RECIPIENTS_PER_CAMPAIGN } from "@/types/campaign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  channel: TemplateChannel;
  connected: boolean;
  fromContact: string | null;
  onCreated: (campaign?: import("@/types/campaign").Campaign) => void;
};

const emptyRecipient = (): CampaignRecipient => ({
  email: "",
  phone: "",
  name: "",
  company: "",
  customVariables: {},
});

export default function CampaignForm({ channel, connected, fromContact, onCreated }: Props) {
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [quota, setQuota] = useState<DailyQuota | null>(null);
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState<number | "">("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [sendNow, setSendNow] = useState(true);
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([emptyRecipient()]);
  const [error, setError] = useState("");
  const [validationIssues, setValidationIssues] = useState<
    { row: number; field: string; message: string }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId]
  );

  const isDynamic = selectedTemplate?.templateType === "dynamic";
  const isWhatsApp = channel === "whatsapp";

  const hasContact = (r: CampaignRecipient) =>
    isWhatsApp ? !!(r.phone || "").trim() : !!r.email.trim();

  useEffect(() => {
    if (!connected) return;
    campaignApi.listTemplates(channel).then((d) => setTemplates(d.templates)).catch(() => {});
    campaignApi.getQuota(channel).then(setQuota).catch(() => {});
  }, [connected, channel]);

  useEffect(() => {
    setRecipients([emptyRecipient()]);
    setValidationIssues([]);
    setTemplateId("");
  }, [channel]);

  useEffect(() => {
    setRecipients([emptyRecipient()]);
    setValidationIssues([]);
  }, [templateId]);

  const submitCampaign = async () => {
    setSaving(true);
    setError("");
    let scheduledAt: string | null = null;
    if (!sendNow) {
      scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    }

    const validRecipients = recipients.filter(hasContact);

    try {
      const result = await campaignApi.createCampaign({
        name,
        templateId: Number(templateId),
        scheduledAt,
        recipients: validRecipients.map((r) => ({
          email: r.email.trim(),
          phone: isWhatsApp ? normalizePhone(r.phone || "") : r.phone || "",
          name: r.name.trim(),
          company: r.company.trim(),
          customVariables: r.customVariables,
        })),
      });
      setName("");
      setTemplateId("");
      setRecipients([emptyRecipient()]);
      setScheduleDate("");
      setScheduleTime("");
      setSendNow(true);
      setShowPreview(false);
      campaignApi.getQuota(channel).then(setQuota).catch(() => {});
      onCreated(result.campaign);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setSaving(false);
    }
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationIssues([]);

    if (!templateId) {
      setError("Select a template.");
      return;
    }

    if (!sendNow && (!scheduleDate || !scheduleTime)) {
      setError("Select date and time for scheduled campaign.");
      return;
    }

    if (!sendNow) {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      if (new Date(scheduledAt) <= new Date()) {
        setError("Scheduled time must be in the future.");
        return;
      }
    }

    const issues = validateRecipients(selectedTemplate, recipients, channel);
    if (issues.length) {
      setValidationIssues(issues);
      setError("Fix the highlighted issues before scheduling.");
      return;
    }

    const validRecipients = recipients.filter(hasContact);
    if (quota && validRecipients.length > quota.remaining) {
      setError(
        `Daily limit: ${quota.remaining} sends remaining today (${quota.used}/${quota.limit} used).`
      );
      return;
    }

    if (isDynamic) {
      setShowPreview(true);
      return;
    }

    void submitCampaign();
  };

  if (!connected) {
    return (
      <p className="text-sm text-muted-foreground">
        Connect {isWhatsApp ? "WhatsApp" : "an email account"} to schedule campaigns.
      </p>
    );
  }

  return (
    <>
      <form onSubmit={handleReview} className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Schedule campaign</h2>
          <p className="text-sm text-muted-foreground">
            Up to {MAX_RECIPIENTS_PER_CAMPAIGN} recipients per campaign ·{" "}
            {quota ? (
              <>
                {quota.remaining}/{quota.limit} sends remaining today
              </>
            ) : (
              "10/day limit per connected account"
            )}
            {fromContact && (
              <>
                {" "}
                via <span className="font-medium text-foreground">{fromContact}</span>
              </>
            )}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
            {validationIssues.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-xs">
                {validationIssues.slice(0, 5).map((issue, i) => (
                  <li key={i}>
                    Row {issue.row}: {issue.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Campaign name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Template</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : "")}
              required
            >
              <option value="">Select template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.templateType})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedTemplate && (
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
            <span className="font-medium capitalize">{selectedTemplate.templateType}</span> template
            {selectedTemplate.templateType === "dynamic" ? (
              <span className="text-muted-foreground">
                {" "}
                — fill the grid below and preview before scheduling.
              </span>
            ) : (
              <span className="text-muted-foreground">
                {" "}
                — bulk paste {isWhatsApp ? "phone numbers" : "emails"}; same message for all.
              </span>
            )}
          </div>
        )}

        <div className="rounded-lg border border-border p-4">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={sendNow} onChange={() => setSendNow(true)} />
              <Send className="h-4 w-4" /> Send immediately
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={!sendNow} onChange={() => setSendNow(false)} />
              <Calendar className="h-4 w-4" /> Schedule for later
            </label>
          </div>
          {!sendNow && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 flex items-center gap-1 text-sm font-medium">
                  <Calendar className="h-3 w-3" /> Date
                </label>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  required={!sendNow}
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1 text-sm font-medium">
                  <Clock className="h-3 w-3" /> Time
                </label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  required={!sendNow}
                />
              </div>
            </div>
          )}
        </div>

        {isDynamic && <VariableGuide />}

        {selectedTemplate?.templateType === "simple" &&
          (isWhatsApp ? (
            <BulkPhonePaste
              currentCount={recipients.filter((r) => (r.phone || "").trim()).length}
              onApply={setRecipients}
            />
          ) : (
            <BulkEmailPaste
              currentCount={recipients.filter((r) => r.email.trim()).length}
              onApply={setRecipients}
            />
          ))}

        {isDynamic && selectedTemplate && (
          <DynamicRecipientGrid
            template={selectedTemplate}
            recipients={recipients}
            onChange={setRecipients}
            issues={validationIssues}
          />
        )}

        {selectedTemplate?.templateType === "simple" && recipients.some(hasContact) && (
          <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
            {recipients.filter(hasContact).length} recipient(s) ready — identical message for all.
          </div>
        )}

        <Button type="submit" disabled={saving} className="w-full md:w-auto">
          {saving ? (
            "Creating..."
          ) : isDynamic ? (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Preview & schedule
            </>
          ) : sendNow ? (
            "Create & send campaign"
          ) : (
            "Schedule campaign"
          )}
        </Button>
      </form>

      {showPreview && selectedTemplate && isDynamic && (
        <CampaignPreviewModal
          template={selectedTemplate}
          recipients={recipients.filter(hasContact)}
          mode="test"
          confirming={saving}
          onClose={() => setShowPreview(false)}
          onConfirm={() => void submitCampaign()}
        />
      )}
    </>
  );
}
