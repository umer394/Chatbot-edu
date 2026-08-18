"use client";

import { ClipboardPaste } from "lucide-react";
import { useState } from "react";

import { parseBulkEmails } from "@/lib/campaign-validation";
import type { CampaignRecipient } from "@/types/campaign";
import { MAX_RECIPIENTS_PER_CAMPAIGN } from "@/types/campaign";
import { Button } from "@/components/ui/button";

type Props = {
  onApply: (recipients: CampaignRecipient[]) => void;
  currentCount: number;
};

export default function BulkEmailPaste({ onApply, currentCount }: Props) {
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");

  const handlePaste = () => {
    setMessage("");
    const { emails, invalid } = parseBulkEmails(text);
    if (!emails.length) {
      setMessage("No valid email addresses found.");
      return;
    }
    const recipients: CampaignRecipient[] = emails.map((email) => ({
      email,
      name: "",
      company: "",
      customVariables: {},
    }));
    onApply(recipients);
    if (invalid.length) {
      setMessage(
        `Added ${emails.length} email(s). Skipped invalid: ${invalid.slice(0, 3).join(", ")}${invalid.length > 3 ? "…" : ""}`
      );
    } else {
      setMessage(`Added ${emails.length} recipient(s).`);
    }
    setText("");
  };

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
      <div className="mb-2 flex items-center gap-2">
        <ClipboardPaste className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-medium">Bulk paste emails</h4>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">
        Paste up to {MAX_RECIPIENTS_PER_CAMPAIGN} addresses, one per line or separated by commas.
      </p>
      <textarea
        className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        placeholder={"user1@example.com\nuser2@example.com, user3@example.com"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-2 flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handlePaste}>
          Apply emails
        </Button>
        <span className="text-xs text-muted-foreground">{currentCount}/{MAX_RECIPIENTS_PER_CAMPAIGN} recipients</span>
      </div>
      {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
