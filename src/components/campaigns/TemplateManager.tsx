"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Mail, MessageCircle, Pencil, Plus, Sparkles, Trash2, Type } from "lucide-react";

import { campaignApi, extractVariables } from "@/lib/campaign-api";
import type {
  CampaignTemplate,
  CreateTemplatePayload,
  TemplateChannel,
  TemplateType,
} from "@/types/campaign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VariableGuide from "@/components/campaigns/VariableGuide";
import TemplateAttachmentDropzone from "@/components/campaigns/TemplateAttachmentDropzone";

type Props = {
  connected: boolean;
  defaultChannel?: TemplateChannel;
  lockChannel?: boolean;
};

const emptyForm = (templateType: TemplateType = "simple", channel: TemplateChannel = "email"): CreateTemplatePayload => ({
  name: "",
  channel,
  templateType,
  subject: "",
  body: "",
  links: [],
  attachments: [],
});

export default function TemplateManager({
  connected,
  defaultChannel = "email",
  lockChannel = false,
}: Props) {
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | TemplateChannel>(lockChannel ? defaultChannel : "all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateTemplatePayload>(emptyForm("simple", defaultChannel));
  const [showForm, setShowForm] = useState(false);
  const [pickType, setPickType] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await campaignApi.listTemplates();
      setTemplates(data.templates);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (connected) loadTemplates();
  }, [connected, loadTemplates]);

  const resetForm = () => {
    setForm(emptyForm("simple", defaultChannel));
    setEditingId(null);
    setShowForm(false);
    setPickType(false);
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm("simple", defaultChannel));
    setPickType(true);
    setShowForm(true);
  };

  const chooseTemplateType = (templateType: TemplateType) => {
    setForm(emptyForm(templateType, defaultChannel));
    setPickType(false);
  };

  const startEdit = (template: CampaignTemplate) => {
    setEditingId(template.id);
    setPickType(false);
    setForm({
      name: template.name,
      channel: template.channel,
      templateType: template.templateType,
      subject: template.subject,
      body: template.body,
      links: [],
      attachments: template.attachments,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const variables =
      form.templateType === "dynamic"
        ? extractVariables(`${form.subject} ${form.body}`)
        : [];
    const payload = {
      ...form,
      links: [],
      attachments: form.channel === "email" ? form.attachments : [],
      variables,
    };
    try {
      if (editingId) {
        await campaignApi.updateTemplate(editingId, payload);
      } else {
        await campaignApi.createTemplate(payload);
      }
      resetForm();
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this template?")) return;
    try {
      await campaignApi.deleteTemplate(id);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete template");
    }
  };

  const filtered =
    filter === "all" ? templates : templates.filter((t) => t.channel === filter);

  const isDynamic = form.templateType === "dynamic";

  if (!connected) {
    return (
      <p className="text-sm text-muted-foreground">
        Connect an email account to manage templates.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Templates</h2>
          <p className="text-sm text-muted-foreground">
            Choose Simple for identical messages, or Dynamic for personalized variables.
          </p>
        </div>
        <Button onClick={startCreate}>
          <Plus className="mr-2 h-4 w-4" /> New template
        </Button>
      </div>

      <div className="flex gap-2">
        {(lockChannel ? [defaultChannel] : (["all", "email", "whatsapp"] as const)).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => !lockChannel && setFilter(f)}
            disabled={lockChannel && f !== defaultChannel}
          >
            {f === "all" ? "All" : f === "email" ? "Email" : "WhatsApp"}
          </Button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {showForm && pickType && !editingId && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="font-medium">Choose template type</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => chooseTemplateType("simple")}
              className="rounded-xl border border-border p-5 text-left transition hover:border-primary hover:bg-primary/5"
            >
              <Type className="mb-2 h-6 w-6 text-primary" />
              <h4 className="font-semibold">Simple Template</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Same subject and message for every recipient. Best for announcements and
                newsletters.
              </p>
            </button>
            <button
              type="button"
              onClick={() => chooseTemplateType("dynamic")}
              className="rounded-xl border border-border p-5 text-left transition hover:border-primary hover:bg-primary/5"
            >
              <Sparkles className="mb-2 h-6 w-6 text-primary" />
              <h4 className="font-semibold">Dynamic Template</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Personalize with {"{{name}}"}, {"{{company}}"}, and custom variables per
                recipient.
              </p>
            </button>
          </div>
          <Button type="button" variant="outline" onClick={resetForm}>
            Cancel
          </Button>
        </div>
      )}

      {showForm && !pickType && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              {editingId ? "Edit template" : "Create"}{" "}
              <span className="capitalize text-primary">{form.templateType}</span> template
            </h3>
            {!editingId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPickType(true)}
              >
                Change type
              </Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Template name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Welcome sequence"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Channel</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
                value={form.channel}
                disabled={lockChannel}
                onChange={(e) =>
                  setForm({ ...form, channel: e.target.value as TemplateChannel })
                }
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>
          {form.channel === "email" && (
            <div>
              <label className="mb-1 block text-sm font-medium">Subject</label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder={
                  isDynamic
                    ? "Hello {{name}}, quick update for {{company}}"
                    : "Monthly product update"
                }
                required
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Message body</label>
            <textarea
              className="min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder={
                isDynamic ? "Hi {{name}}, ..." : "Hello,\n\nWe wanted to share an update..."
              }
              required
            />
          </div>
          {isDynamic && <VariableGuide />}
          {form.channel === "email" && (
            <div>
              <label className="mb-2 block text-sm font-medium">Attachments</label>
              <TemplateAttachmentDropzone
                attachments={form.attachments}
                onChange={(attachments) => setForm({ ...form, attachments })}
                onError={setError}
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update template" : "Save template"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading templates...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No templates yet. Create your first template to schedule campaigns.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {t.channel === "email" ? (
                    <Mail className="h-4 w-4 text-primary" />
                  ) : (
                    <MessageCircle className="h-4 w-4 text-green-600" />
                  )}
                  <div>
                    <h4 className="font-medium">{t.name}</h4>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {t.templateType}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(t)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              {t.channel === "email" && (
                <p className="mt-2 truncate text-xs text-muted-foreground">Subject: {t.subject}</p>
              )}
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.body}</p>
              {t.templateType === "dynamic" && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {t.variables.map((v) => (
                    <span
                      key={v}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                {t.channel === "email" && t.attachments.length > 0 && (
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {t.attachments.length} file{t.attachments.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
