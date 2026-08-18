"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ClipboardCopy,
  ClipboardPaste,
  Mail,
  MessageCircle,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
} from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contactApi } from "@/lib/contact-api";
import {
  contactFromApi,
  countDirtyRows,
  emptyGridRow,
  ensureTrailingBlankRows,
  normalizeGridContact,
  parseSpreadsheetPaste,
  rowsToTsv,
  validateGridContact,
  type ContactGridRow,
} from "@/lib/contact-grid";
import type { ContactChannel, ContactStatus } from "@/types/contact";

const statusStyles: Record<ContactStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  sent: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

const PAGE_SIZE = 50;

type ActiveCell = { rowIndex: number; field: "contactValue" | "businessName" };

export default function ContactsManager() {
  const [activeChannel, setActiveChannel] = useState<ContactChannel>("email");
  const [rows, setRows] = useState<ContactGridRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<"" | ContactStatus>("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [showPasteBox, setShowPasteBox] = useState(false);
  const requestId = useRef(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const data = await contactApi.listContacts({
        channel: activeChannel,
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      if (id !== requestId.current) return;

      const loaded = data.contacts.map(contactFromApi);
      setRows(ensureTrailingBlankRows(loaded, activeChannel));
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : "Failed to load contacts");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [activeChannel, statusFilter, search, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const dirtyCount = countDirtyRows(rows);

  const updateRow = (index: number, patch: Partial<ContactGridRow>) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch, dirty: true, isBlank: false };
      return ensureTrailingBlankRows(next, activeChannel);
    });
  };

  const applyParsedRows = (parsed: { contactValue: string; businessName: string }[], startIndex: number) => {
    setRows((prev) => {
      const next = [...prev];
      parsed.forEach((item, offset) => {
        const idx = startIndex + offset;
        const row = next[idx] ?? emptyGridRow(activeChannel);
        next[idx] = {
          ...row,
          key: row.key || emptyGridRow(activeChannel).key,
          contactValue: item.contactValue,
          businessName: item.businessName || row.businessName,
          channel: activeChannel,
          dirty: true,
          isBlank: false,
        };
      });
      return ensureTrailingBlankRows(next, activeChannel);
    });
    setMessage(`Pasted ${parsed.length} row${parsed.length !== 1 ? "s" : ""}`);
  };

  const handleGridPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text.trim()) return;
    e.preventDefault();

    const parsed = parseSpreadsheetPaste(text);
    if (!parsed.length) return;

    const startIndex =
      activeCell?.rowIndex ??
      rows.findIndex((r) => !r.contactValue.trim() && !r.id) ??
      rows.length;
    applyParsedRows(parsed, Math.max(0, startIndex));
  };

  const handlePasteBoxApply = () => {
    const parsed = parseSpreadsheetPaste(pasteText);
    if (!parsed.length) {
      setError("Nothing to paste — add one contact per line.");
      return;
    }
    const startIndex = rows.findIndex((r) => !r.contactValue.trim() && !r.id);
    applyParsedRows(parsed, startIndex >= 0 ? startIndex : rows.length);
    setPasteText("");
    setShowPasteBox(false);
    setError("");
  };

  const handleSave = async () => {
    const toSave = rows.filter((r) => r.contactValue.trim() && (r.dirty || !r.id));
    if (!toSave.length) {
      setMessage("No changes to save.");
      return;
    }

    const invalid = toSave.filter((r) => !validateGridContact(activeChannel, r.contactValue));
    if (invalid.length) {
      setError(`${invalid.length} row(s) have invalid ${activeChannel === "email" ? "emails" : "phone numbers"}.`);
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await contactApi.bulkUpsert(
        toSave.map((r) => ({
          channel: activeChannel,
          contactValue: normalizeGridContact(activeChannel, r.contactValue),
          businessName: r.businessName.trim(),
        }))
      );
      const parts = [];
      if (result.created) parts.push(`${result.created} added`);
      if (result.updated) parts.push(`${result.updated} updated`);
      setMessage(parts.length ? `Saved: ${parts.join(", ")}` : "Saved");
      if (result.errors.length) {
        setError(result.errors.slice(0, 3).join("; "));
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyAll = async () => {
    const tsv = rowsToTsv(rows);
    if (!tsv) {
      setError("No contacts to copy.");
      return;
    }
    await navigator.clipboard.writeText(tsv);
    setMessage(`Copied ${rows.filter((r) => r.contactValue.trim()).length} rows (tab-separated)`);
    setError("");
  };

  const handleDeleteRow = async (index: number) => {
    const row = rows[index];
    if (row.id) {
      try {
        await contactApi.deleteContact(row.id);
        setMessage("Row deleted");
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
      }
      return;
    }
    setRows((prev) => ensureTrailingBlankRows(prev.filter((_, i) => i !== index), activeChannel));
  };

  const addRows = (count: number) => {
    setRows((prev) => [
      ...prev,
      ...Array.from({ length: count }, () => emptyGridRow(activeChannel)),
    ]);
  };

  const contactLabel = activeChannel === "email" ? "Email" : "Phone";
  const contactPlaceholder =
    activeChannel === "email" ? "saloon@example.com" : "+923001234567";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <PageHeader
        badge="Contacts"
        badgeIcon={Mail}
        title="Contact spreadsheet"
        description="Paste from Excel, edit inline, and save in bulk. Tab between cells; copy rows as tab-separated text."
        action={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => void handleCopyAll()}>
              <ClipboardCopy className="mr-2 h-4 w-4" />
              Copy all
            </Button>
            <Button size="sm" onClick={() => void handleSave()} disabled={saving || dirtyCount === 0}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving…" : dirtyCount ? `Save (${dirtyCount})` : "Save"}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(["email", "whatsapp"] as ContactChannel[]).map((ch) => {
          const Icon = ch === "email" ? Mail : MessageCircle;
          return (
            <Button
              key={ch}
              type="button"
              size="sm"
              variant={activeChannel === ch ? "default" : "outline"}
              onClick={() => {
                setActiveChannel(ch);
                setPage(1);
                setActiveCell(null);
              }}
            >
              <Icon className="mr-2 h-4 w-4" />
              {ch === "email" ? "Email" : "WhatsApp"}
            </Button>
          );
        })}
      </div>

      {showPasteBox && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ClipboardPaste className="h-4 w-4" />
            Bulk paste — one {activeChannel === "email" ? "email" : "phone"} per line, or contact + tab + business name
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm"
            placeholder={`saloon@example.com\tSaloon\nspa@example.com\tSpa\nor one per line…`}
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handlePasteBoxApply}>
              Apply to grid
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowPasteBox(false)}>
              Close
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 h-9"
              placeholder="Filter loaded rows…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "" | ContactStatus);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowPasteBox((v) => !v)}>
              <ClipboardPaste className="mr-1 h-4 w-4" />
              Paste box
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addRows(10)}>
              <Plus className="mr-1 h-4 w-4" />
              10 rows
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {(error || message) && (
          <div className="border-b border-border px-4 py-2 text-sm">
            {error && <p className="text-destructive">{error}</p>}
            {message && !error && <p className="text-emerald-600 dark:text-emerald-400">{message}</p>}
          </div>
        )}

        <div
          ref={gridRef}
          className="overflow-x-auto"
          onPaste={handleGridPaste}
        >
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="w-10 border border-border/60 px-2 py-2 text-center">#</th>
                <th className="min-w-[220px] border border-border/60 px-2 py-2">{contactLabel}</th>
                <th className="min-w-[180px] border border-border/60 px-2 py-2">Business</th>
                <th className="w-24 border border-border/60 px-2 py-2">Status</th>
                <th className="min-w-[140px] border border-border/60 px-2 py-2">Last sent</th>
                <th className="w-10 border border-border/60 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-border/60 px-4 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const invalid =
                    row.contactValue.trim() &&
                    !validateGridContact(activeChannel, row.contactValue);
                  const readOnlyContact = !!row.id && row.status === "sent";

                  return (
                    <tr
                      key={row.key}
                      className={
                        row.dirty || !row.id
                          ? "bg-primary/[0.03]"
                          : index % 2 === 0
                            ? "bg-background"
                            : "bg-muted/10"
                      }
                    >
                      <td className="border border-border/60 px-2 py-0 text-center text-xs text-muted-foreground">
                        {index + 1 + (page - 1) * PAGE_SIZE}
                      </td>
                      <td className="border border-border/60 p-0">
                        {readOnlyContact ? (
                          <div className="px-2 py-1.5 font-mono text-xs select-all">{row.contactValue}</div>
                        ) : (
                          <input
                            type="text"
                            value={row.contactValue}
                            onChange={(e) =>
                              updateRow(index, { contactValue: e.target.value })
                            }
                            onFocus={() => setActiveCell({ rowIndex: index, field: "contactValue" })}
                            placeholder={contactPlaceholder}
                            className={`h-9 w-full border-0 bg-transparent px-2 font-mono text-xs outline-none focus:ring-2 focus:ring-inset focus:ring-primary/40 ${
                              invalid ? "bg-destructive/10 text-destructive" : ""
                            }`}
                          />
                        )}
                      </td>
                      <td className="border border-border/60 p-0">
                        <input
                          type="text"
                          value={row.businessName}
                          onChange={(e) => updateRow(index, { businessName: e.target.value })}
                          onFocus={() => setActiveCell({ rowIndex: index, field: "businessName" })}
                          placeholder="Business name"
                          className="h-9 w-full border-0 bg-transparent px-2 text-xs outline-none focus:ring-2 focus:ring-inset focus:ring-primary/40"
                        />
                      </td>
                      <td className="border border-border/60 px-2 py-1.5">
                        {row.status ? (
                          <span
                            className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${statusStyles[row.status]}`}
                          >
                            {row.status}
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase text-muted-foreground">new</span>
                        )}
                      </td>
                      <td className="border border-border/60 px-2 py-1.5 text-xs text-muted-foreground whitespace-nowrap">
                        {row.lastSentAt
                          ? new Date(row.lastSentAt).toLocaleDateString(undefined, {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="border border-border/60 px-1 py-1 text-center">
                        {(row.id || row.contactValue.trim() || row.businessName.trim()) && (
                          <button
                            type="button"
                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => void handleDeleteRow(index)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {total} saved · {dirtyCount} unsaved change{dirtyCount !== 1 ? "s" : ""} · Click a cell and Ctrl+V to paste
            from Excel
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
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
        </div>
      </div>
    </div>
  );
}
