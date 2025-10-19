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

export default function Email() {
  const [to, setTo] = useState<string>("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [toError, setToError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

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
    // if (!recipients.length || !subject || !body) {
    //   setMessage("Please fill in all fields");
    //   return;
    // }

    try {
      console.log("Sending email...", { to: recipients, subject, body });
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/send-email`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({to: recipients, subject, body})
      });

      console.log("Response status:", res.status);
      console.log("Response ok:", res.ok);

      if (!res.ok) {
        console.error("Response not ok:", res.status, res.statusText);
        return;
      }

      const data = await res.json();
      console.log("Response data:", data);
      setMessage("Email sent successfully!");
    } catch (error) {
      console.error("Error sending email:", error);
      setMessage("Failed to send email");
    }
  };
    return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-card rounded-xl shadow-lg p-6 md:p-10 flex flex-col gap-6 w-full">
      {/* To Field */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">To</label>
        <div
          className="flex flex-wrap items-center gap-1 border border-primary rounded px-2 py-1 bg-background focus-within:ring-2 focus-within:ring-primary min-h-[44px]"
          tabIndex={0}
          onClick={() => inputRef.current?.focus()}
        >
          {recipients.map((email, idx) => (
            <span
              key={email + idx}
              className="flex items-center bg-muted text-muted-foreground rounded px-2 py-1 text-sm mr-1 mb-1 border border-border"
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
            className="flex-1 min-w-[120px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground py-2 px-1"
            placeholder="Add recipient and press Enter"
            value={to}
            onChange={e => setTo(e.target.value)}
            onKeyDown={handleToKeyDown}
            aria-label="Add recipient"
            autoComplete="off"
          />
        </div>
        {toError && <div className="text-destructive text-xs mt-1">{toError}</div>}
      </div>

      {/* Subject Field */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
        <input
          type="text"
          className="w-full border border-border rounded px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          placeholder="Subject of your email"
          value={subject}
          onChange={e => setSubject(e.target.value)}
        />
      </div>

      {/* Description Box */}
      <div>
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <div className="flex gap-2">
            <button
              type="button"
              className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:outline-none"
            >
              Write description with AI
            </button>
          </div>
          <div className="flex gap-1 flex-wrap">
            <ToolbarButton label="Bold" icon="𝐁" />
            <ToolbarButton label="Italic" icon="𝘐" />
            <ToolbarButton label="Bullet List" icon="•" />
            <ToolbarButton label="Numbered List" icon="1." />
            <ToolbarButton label="Link" icon="🔗" />
            <ToolbarButton label="Quote" icon="❝" />
            <ToolbarButton label="Code" icon="</>" />
            <ToolbarButton label="Undo" icon="↺" />
            <ToolbarButton label="Redo" icon="↻" />
            <button
              type="button"
              className="p-2 rounded hover:bg-accent focus:bg-accent focus:outline-none"
              aria-label="Attach file"
            >
              <span className="text-lg">📎</span>
            </button>
          </div>
        </div>
        <textarea
          className="w-full min-h-[120px] border border-border rounded px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-y"
          placeholder="Write your email here..."
          value={body}
          onChange={e => setBody(e.target.value)}
        />
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.includes("successfully") 
            ? "bg-green-100 text-green-800 border border-green-200" 
            : "bg-red-100 text-red-800 border border-red-200"
        }`}>
          {message}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg shadow hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:outline-none transition-all text-lg"
      >
        Send Email
      </button>
    </form>
  );
}