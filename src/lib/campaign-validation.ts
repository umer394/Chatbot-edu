import type { CampaignRecipient, CampaignTemplate, TemplateChannel } from "@/types/campaign";
import { MAX_RECIPIENTS_PER_CAMPAIGN } from "@/types/campaign";
import { extractVariables, renderPreview } from "@/lib/campaign-api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[1-9]\d{6,14}$/;

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return `+${digits}`;
}

export function parseBulkEmails(text: string): { emails: string[]; invalid: string[] } {
  const raw = text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const invalid: string[] = [];
  const valid: string[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (!EMAIL_RE.test(item)) {
      invalid.push(item);
      continue;
    }
    const lower = item.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    valid.push(lower);
  }

  return {
    emails: valid.slice(0, MAX_RECIPIENTS_PER_CAMPAIGN),
    invalid,
  };
}

export function parseBulkPhones(text: string): { phones: string[]; invalid: string[] } {
  const raw = text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const invalid: string[] = [];
  const valid: string[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    const normalized = normalizePhone(item);
    if (!PHONE_RE.test(normalized)) {
      invalid.push(item);
      continue;
    }
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    valid.push(normalized);
  }

  return {
    phones: valid.slice(0, MAX_RECIPIENTS_PER_CAMPAIGN),
    invalid,
  };
}

export function getRequiredVariables(template: CampaignTemplate): string[] {
  if (template.templateType === "simple") return [];
  const fromTemplate = extractVariables(`${template.subject} ${template.body}`);
  const skip = template.channel === "whatsapp" ? ["email"] : ["phone"];
  return fromTemplate.filter((v) => !skip.includes(v));
}

export function buildRecipientContext(recipient: CampaignRecipient): Record<string, string> {
  return {
    email: recipient.email.trim(),
    phone: (recipient.phone || "").trim(),
    name: recipient.name.trim(),
    company: recipient.company.trim(),
    ...recipient.customVariables,
  };
}

export function getRecipientFieldValue(
  recipient: CampaignRecipient,
  variable: string,
  channel: TemplateChannel = "email"
): string {
  if (variable === "email") return recipient.email.trim();
  if (variable === "phone") return (recipient.phone || "").trim();
  if (variable === "name") return recipient.name.trim();
  if (variable === "company") return recipient.company.trim();
  return (recipient.customVariables[variable] || "").trim();
}

export function setRecipientFieldValue(
  recipient: CampaignRecipient,
  variable: string,
  value: string
): CampaignRecipient {
  if (variable === "email") return { ...recipient, email: value };
  if (variable === "phone") return { ...recipient, phone: value };
  if (variable === "name") return { ...recipient, name: value };
  if (variable === "company") return { ...recipient, company: value };
  return {
    ...recipient,
    customVariables: { ...recipient.customVariables, [variable]: value },
  };
}

export type ValidationIssue = {
  row: number;
  field: string;
  message: string;
};

export function validateRecipients(
  template: CampaignTemplate | null,
  recipients: CampaignRecipient[],
  channel: TemplateChannel = "email"
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const filled = recipients.filter(
    (r) => r.email.trim() || (r.phone || "").trim() || r.name.trim() || r.company.trim()
  );

  if (!filled.length) {
    issues.push({ row: 0, field: "recipients", message: "Add at least one recipient." });
    return issues;
  }

  if (filled.length > MAX_RECIPIENTS_PER_CAMPAIGN) {
    issues.push({
      row: 0,
      field: "recipients",
      message: `Maximum ${MAX_RECIPIENTS_PER_CAMPAIGN} recipients allowed.`,
    });
  }

  const requiredVars =
    template?.templateType === "dynamic" ? getRequiredVariables(template) : [];

  filled.forEach((recipient, index) => {
    const row = index + 1;

    if (channel === "whatsapp") {
      const phone = normalizePhone(recipient.phone || "");
      if (!phone) {
        issues.push({ row, field: "phone", message: "Phone number is required." });
      } else if (!PHONE_RE.test(phone)) {
        issues.push({ row, field: "phone", message: `Invalid phone: ${recipient.phone}` });
      }
    } else {
      const email = recipient.email.trim();
      if (!email) {
        issues.push({ row, field: "email", message: "Email is required." });
      } else if (!EMAIL_RE.test(email)) {
        issues.push({ row, field: "email", message: `Invalid email: ${email}` });
      }
    }

    if (template?.templateType === "dynamic") {
      for (const variable of requiredVars) {
        const value = getRecipientFieldValue(recipient, variable, channel);
        if (!value) {
          issues.push({
            row,
            field: variable,
            message: `Missing value for {{${variable}}}.`,
          });
        }
      }

      const context = buildRecipientContext(recipient);
      const renderedSubject = renderPreview(template.subject, context);
      const renderedBody = renderPreview(template.body, context);
      if (/\{\{\w+\}\}/.test(renderedSubject) || /\{\{\w+\}\}/.test(renderedBody)) {
        issues.push({
          row,
          field: "mapping",
          message: "Some variables are still unmapped in the rendered preview.",
        });
      }
    }
  });

  return issues;
}

export function buildPreviewEntries(
  template: CampaignTemplate,
  recipients: CampaignRecipient[]
) {
  return recipients
    .filter((r) => r.email.trim() || (r.phone || "").trim())
    .map((recipient, index) => {
      const context = buildRecipientContext(recipient);
      return {
        row: index + 1,
        email: recipient.email,
        phone: recipient.phone,
        subject: renderPreview(template.subject, context),
        body: renderPreview(template.body, context),
        context,
      };
    });
}
