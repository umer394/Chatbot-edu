"use client";

import { Plus, Trash2 } from "lucide-react";

import {
  getRecipientFieldValue,
  getRequiredVariables,
  setRecipientFieldValue,
} from "@/lib/campaign-validation";
import type { CampaignRecipient, CampaignTemplate } from "@/types/campaign";
import { MAX_RECIPIENTS_PER_CAMPAIGN } from "@/types/campaign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  template: CampaignTemplate;
  recipients: CampaignRecipient[];
  onChange: (recipients: CampaignRecipient[]) => void;
  issues?: { row: number; field: string }[];
};

export default function DynamicRecipientGrid({
  template,
  recipients,
  onChange,
  issues = [],
}: Props) {
  const contactField = template.channel === "whatsapp" ? "phone" : "email";
  const variables = [contactField, ...getRequiredVariables(template).filter((v) => v !== contactField)];

  const addRow = () => {
    if (recipients.length >= MAX_RECIPIENTS_PER_CAMPAIGN) return;
    onChange([
      ...recipients,
      { email: "", phone: "", name: "", company: "", customVariables: {} },
    ]);
  };

  const removeRow = (idx: number) => {
    onChange(recipients.filter((_, i) => i !== idx));
  };

  const updateCell = (idx: number, variable: string, value: string) => {
    const next = [...recipients];
    next[idx] = setRecipientFieldValue(next[idx], variable, value);
    onChange(next);
  };

  const hasIssue = (row: number, field: string) =>
    issues.some((i) => i.row === row && i.field === field);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Recipient values grid ({recipients.length}/{MAX_RECIPIENTS_PER_CAMPAIGN})
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={recipients.length >= MAX_RECIPIENTS_PER_CAMPAIGN}
        >
          <Plus className="mr-1 h-4 w-4" /> Add row
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">#</th>
              {variables.map((v) => (
                <th key={v} className="px-3 py-2 font-medium">
                  {v === contactField
                    ? template.channel === "whatsapp"
                      ? "Phone *"
                      : "Email *"
                    : `{{${v}}}`}
                </th>
              ))}
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {recipients.map((recipient, idx) => (
              <tr key={idx} className="border-t border-border/60">
                <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                {variables.map((variable) => (
                  <td key={variable} className="px-3 py-2">
                    <Input
                      type={variable === "email" ? "email" : "text"}
                      value={getRecipientFieldValue(recipient, variable, template.channel)}
                      onChange={(e) => updateCell(idx, variable, e.target.value)}
                      className={
                        hasIssue(idx + 1, variable) || hasIssue(idx + 1, "mapping")
                          ? "border-destructive"
                          : ""
                      }
                      placeholder={
                        variable === "email"
                          ? "email@example.com"
                          : variable === "phone"
                            ? "+923001234567"
                            : variable
                      }
                    />
                  </td>
                ))}
                <td className="px-3 py-2">
                  {recipients.length > 1 && (
                    <button type="button" onClick={() => removeRow(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
