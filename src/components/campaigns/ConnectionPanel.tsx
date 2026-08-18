"use client";

import { useCallback, useEffect, useState } from "react";
import VerifyEmailButton from "@/components/VerifyEmailButton";

type ConnectionStatus = {
  connected: boolean;
  email: string | null;
};

type Props = {
  onConnectionChange?: (connected: boolean, email: string | null) => void;
};

export default function ConnectionPanel({ onConnectionChange }: Props) {
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false, email: null });
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/auth/google/status", { credentials: "include" });
      const data = await resp.json();
      const next = { connected: !!data.connected, email: data.email ?? null };
      setStatus(next);
      onConnectionChange?.(next.connected, next.email);
    } catch {
      setMessage("Unable to load Google connection status.");
    } finally {
      setLoading(false);
    }
  }, [onConnectionChange]);

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
        setMessage(data.error || "Failed to disconnect.");
        return;
      }
      setStatus({ connected: false, email: null });
      onConnectionChange?.(false, null);
      setMessage("Account disconnected.");
    } catch {
      setMessage("Failed to disconnect Google account.");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Connected email account</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Connect Gmail to send campaigns. Daily limit: 10 recipients per connected account.
      </p>
      <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Checking connection...</p>
        ) : status.connected && status.email ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Connected</p>
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
            <p className="text-sm text-muted-foreground">No email account connected.</p>
            <VerifyEmailButton onVerified={() => { setMessage("Connected."); loadStatus(); }} />
          </div>
        )}
      </div>
      {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
    </section>
  );
}
