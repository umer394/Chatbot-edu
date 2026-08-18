"use client";

import { ClipboardPaste } from "lucide-react";
import { useState } from "react";

import { parseBulkPhones } from "@/lib/campaign-validation";
import type { CampaignRecipient } from "@/types/campaign";
import { MAX_RECIPIENTS_PER_CAMPAIGN } from "@/types/campaign";
import { Button } from "@/components/ui/button";

type Props = {
  onApply: (recipients: CampaignRecipient[]) => void;
  currentCount: number;
};

export default function BulkPhonePaste({ onApply, currentCount }: Props) {
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");

  const handlePaste = () => {
    setMessage("");
    const { phones, invalid } = parseBulkPhones(text);
    if (!phones.length) {
      setMessage("No valid phone numbers found. Use international format e.g. +923001234567");
      return;
    }
    const recipients: CampaignRecipient[] = phones.map((phone) => ({
      email: "",
      phone,
      name: "",
      company: "",
      customVariables: {},
    }));
    onApply(recipients);
    if (invalid.length) {
      setMessage(
        `Added ${phones.length} number(s). Skipped invalid: ${invalid.slice(0, 3).join(", ")}${invalid.length > 3 ? "…" : ""}`
      );
    } else {
      setMessage(`Added ${phones.length} recipient(s).`);
    }
    setText("");
  };

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
      <div className="mb-2 flex items-center gap-2">
        <ClipboardPaste className="h-4 w-4 text-green-600" />
        <h4 className="text-sm font-medium">Bulk paste phone numbers</h4>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">
        Paste up to {MAX_RECIPIENTS_PER_CAMPAIGN} numbers with country code, one per line or comma-separated.
      </p>
      <textarea
        className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        placeholder={"+923001234567\n+923001234568, +923001234569"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-2 flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handlePaste}>
          Apply numbers
        </Button>
        <span className="text-xs text-muted-foreground">
          {currentCount}/{MAX_RECIPIENTS_PER_CAMPAIGN} recipients
        </span>
      </div>
      {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
