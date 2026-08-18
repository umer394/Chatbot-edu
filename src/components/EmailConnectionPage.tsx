"use client";

import { useCallback, useEffect, useState } from "react";
import VerifyEmailButton from "@/components/VerifyEmailButton";
import Email from "@/components/Email";

type ConnectionStatus = {
  connected: boolean;
  email: string | null;
};

export default function EmailConnectionPage() {
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false, email: null });
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/auth/google/status", { credentials: "include" });
      const data = await resp.json();
      setStatus({ connected: !!data.connected, email: data.email ?? null });
    } catch {
      setMessage("Unable to load Google connection status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setMessage("");
    try {
      const resp = await fetch("/api/auth/google/disconnect", {
        method: "POST",
        credentials: "include",
      });
      if (!resp.ok) {
        const data = await resp.json();
        setMessage(data.error || "Failed to disconnect Google account.");
        return;
      }
      setStatus({ connected: false, email: null });
      setMessage("Google account disconnected. You can connect a different account.");
    } catch {
      setMessage("Failed to disconnect Google account.");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Email Campaigns</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect a Google account, then send email campaigns through Gmail.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Google Account Connection</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Uses minimum scopes: profile, email, and Gmail send. Gmail send may require Google OAuth
          verification in production.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Google Cloud Console: set OAuth consent screen user type to <strong>External</strong> (not
          Internal), add your Gmail as a test user while in Testing mode, and set redirect URI to{" "}
          <code className="rounded bg-muted px-1">http://localhost:8000/auth/google/callback</code>.
        </p>

        <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Checking connection...</p>
          ) : status.connected && status.email ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Connected</p>
                <p className="text-sm text-muted-foreground">{status.email}</p>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                {disconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Not connected</p>
                <p className="text-sm text-muted-foreground">
                  Connect any Google/Gmail account to send campaigns.
                </p>
              </div>
              <VerifyEmailButton
                onVerified={() => {
                  setMessage("Google account connected successfully.");
                  loadStatus();
                }}
              />
            </div>
          )}
        </div>

        {message && (
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Compose Campaign</h2>
        {status.connected ? (
          <Email fromEmail={status.email ?? undefined} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Connect a Google account above to start sending email campaigns.
          </p>
        )}
      </section>
    </div>
  );
}
