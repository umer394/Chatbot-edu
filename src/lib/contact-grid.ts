import { normalizePhone } from "@/lib/campaign-validation";
import type { ContactChannel, ContactStatus } from "@/types/contact";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[1-9]\d{6,14}$/;

export type ContactGridRow = {
  key: string;
  id?: number;
  contactValue: string;
  businessName: string;
  channel: ContactChannel;
  status?: ContactStatus;
  lastSentAt?: string | null;
  dirty?: boolean;
  isBlank?: boolean;
};

export function emptyGridRow(channel: ContactChannel): ContactGridRow {
  return {
    key: `new-${channel}-${Math.random().toString(36).slice(2, 9)}`,
    contactValue: "",
    businessName: "",
    channel,
    isBlank: true,
    dirty: false,
  };
}

export function contactFromApi(c: {
  id: number;
  contactValue: string;
  businessName: string;
  channel: ContactChannel;
  status: ContactStatus;
  lastSentAt: string | null;
}): ContactGridRow {
  return {
    key: `id-${c.id}`,
    id: c.id,
    contactValue: c.contactValue,
    businessName: c.businessName,
    channel: c.channel,
    status: c.status,
    lastSentAt: c.lastSentAt,
    dirty: false,
    isBlank: false,
  };
}

export function parseSpreadsheetPaste(text: string): { contactValue: string; businessName: string }[] {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return null;

      const tabParts = trimmed.split("\t");
      if (tabParts.length >= 2) {
        return {
          contactValue: tabParts[0].trim(),
          businessName: tabParts.slice(1).join("\t").trim(),
        };
      }

      const commaParts = trimmed.split(/[,;]/).map((s) => s.trim());
      if (commaParts.length >= 2) {
        return {
          contactValue: commaParts[0],
          businessName: commaParts.slice(1).join(", ").trim(),
        };
      }

      return { contactValue: trimmed, businessName: "" };
    })
    .filter((row): row is { contactValue: string; businessName: string } => !!row && !!row.contactValue);
}

export function validateGridContact(channel: ContactChannel, value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (channel === "email") return EMAIL_RE.test(trimmed.toLowerCase());
  return PHONE_RE.test(normalizePhone(trimmed));
}

export function normalizeGridContact(channel: ContactChannel, value: string): string {
  const trimmed = value.trim();
  if (channel === "whatsapp") return normalizePhone(trimmed);
  return trimmed.toLowerCase();
}

export function rowsToTsv(rows: ContactGridRow[]): string {
  return rows
    .filter((r) => r.contactValue.trim())
    .map((r) =>
      [r.contactValue, r.businessName, r.status ?? "pending", r.lastSentAt ?? ""].join("\t")
    )
    .join("\n");
}

export function ensureTrailingBlankRows(
  rows: ContactGridRow[],
  channel: ContactChannel,
  minBlank = 10
): ContactGridRow[] {
  const next = [...rows];
  let trailing = 0;
  for (let i = next.length - 1; i >= 0; i -= 1) {
    if (!next[i].contactValue.trim() && !next[i].businessName.trim()) trailing += 1;
    else break;
  }
  while (trailing < minBlank) {
    next.push(emptyGridRow(channel));
    trailing += 1;
  }
  return next;
}

export function countDirtyRows(rows: ContactGridRow[]): number {
  return rows.filter((r) => r.contactValue.trim() && (r.dirty || !r.id)).length;
}
