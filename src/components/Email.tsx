"use client";
import React, { useState, useRef } from "react";

const ToolbarButton = ({ label, icon }: { label: string; icon: string }) => (
  <button
    type="button"
    className="p-2 rounded hover:bg-accent focus:bg-accent focus:outline-none"
    aria-label={label}
  >
    <span className="text-lg">{icon}</span>
  </button>
);

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type EmailProps = {
  fromEmail?: string;
};

export default function Email({ fromEmail }: EmailProps) {
  const [to, setTo] = useState<string>("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [toError, setToError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleToKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && to.trim()) {
      e.preventDefault();
      if (isValidEmail(to.trim())) {
        setRecipients([...recipients, to.trim()]);
        setTo("");
        setToError("");
      } else {
        setToError("Invalid email address");
      }
    } else if (e.key === "Backspace" && !to && recipients.length) {
      setRecipients(recipients.slice(0, -1));
    }
  };

  const removeRecipient = (idx: number) => {
    setRecipients(recipients.filter((_, i) => i !== idx));
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipients.length || !subject || !body) {
      setMessage("Please add recipients, subject, and message body.");
      return;
    }

    setIsSending(true);
    setMessage("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to: recipients, subject, body }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to send email campaign.");
        return;
      }

      const failedCount = data.failed?.length ?? 0;
      const sentCount = data.sent?.length ?? 0;
      if (failedCount > 0) {
        setMessage(`Sent ${sentCount} email(s). ${failedCount} failed.`);
      } else {
        setMessage(`Campaign sent successfully from ${data.from || fromEmail || "your Gmail account"}.`);
        setRecipients([]);
        setSubject("");
        setBody("");
      }
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      {fromEmail && (
        <p className="text-sm text-muted-foreground">
          Sending from <span className="font-medium text-foreground">{fromEmail}</span>
        </p>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">To</label>
        <div
          className="flex min-h-[44px] flex-wrap items-center gap-1 rounded border border-primary bg-background px-2 py-1 focus-within:ring-2 focus-within:ring-primary"
          tabIndex={0}
          onClick={() => inputRef.current?.focus()}
        >
          {recipients.map((email, idx) => (
            <span
              key={email + idx}
              className="mb-1 mr-1 flex items-center rounded border border-border bg-muted px-2 py-1 text-sm text-muted-foreground"
            >
              {email}
              <button
                type="button"
                onClick={() => removeRecipient(idx)}
                className="ml-1 text-lg text-muted-foreground hover:text-destructive focus:text-destructive focus:outline-none"
                aria-label={`Remove ${email}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="email"
            className="min-w-[120px] flex-1 bg-transparent px-1 py-2 text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Add recipient and press Enter"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            onKeyDown={handleToKeyDown}
            aria-label="Add recipient"
            autoComplete="off"
          />
        </div>
        {toError && <div className="mt-1 text-xs text-destructive">{toError}</div>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Subject</label>
        <input
          type="text"
          className="w-full rounded border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Subject of your email"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Write description with AI
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            <ToolbarButton label="Bold" icon="𝐁" />
            <ToolbarButton label="Italic" icon="𝘐" />
            <ToolbarButton label="Bullet List" icon="•" />
            <ToolbarButton label="Numbered List" icon="1." />
            <ToolbarButton label="Link" icon="🔗" />
            <ToolbarButton label="Quote" icon="❝" />
            <ToolbarButton label="Code" icon="</>" />
            <ToolbarButton label="Undo" icon="↺" />
            <ToolbarButton label="Redo" icon="↻" />
          </div>
        </div>
        <textarea
          className="min-h-[120px] w-full resize-y rounded border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Write your email here..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      {message && (
        <div
          className={`rounded-lg p-3 text-sm ${
            message.includes("successfully") || message.startsWith("Sent ")
              ? "border border-green-200 bg-green-100 text-green-800"
              : "border border-red-200 bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSending}
        className="w-full rounded-lg bg-primary py-3 text-lg font-semibold text-primary-foreground shadow transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
      >
        {isSending ? "Sending..." : "Send Campaign"}
      </button>
    </form>
  );
}
