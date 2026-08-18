"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, QrCode } from "lucide-react";

import { whatsappApi } from "@/lib/campaign-api";
import type { WhatsAppStatus } from "@/types/campaign";
import { useConnections } from "@/contexts/connection-provider";
import { Button } from "@/components/ui/button";

type Props = {
  onConnected?: (phone: string) => void;
  onDisconnected?: () => void;
  autoConnect?: boolean;
};

const POLL_MS = 1500;

function needsPolling(data: WhatsAppStatus | null) {
  if (!data) return false;
  if (data.connected) return false;
  return (
    data.status === "qr" ||
    data.status === "authenticated" ||
    data.status === "initializing" ||
    data.syncing === true
  );
}

export default function WhatsAppConnectPanel({
  onConnected,
  onDisconnected,
  autoConnect = true,
}: Props) {
  const { whatsapp } = useConnections();
  const [status, setStatus] = useState<WhatsAppStatus | null>(
    whatsapp.connected && whatsapp.phone
      ? { connected: true, phone: whatsapp.phone, status: "ready" }
      : null
  );
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectStartedRef = useRef(false);
  const onConnectedRef = useRef(onConnected);
  onConnectedRef.current = onConnected;

  const clearPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const applyStatus = useCallback((data: WhatsAppStatus) => {
    setStatus(data);
    if (data.connected && data.phone) {
      onConnectedRef.current?.(data.phone);
      setConnecting(false);
      clearPoll();
      return true;
    }
    return false;
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const data = await whatsappApi.getStatus();
      applyStatus(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load status");
      return null;
    }
  }, [applyStatus]);

  const startPolling = useCallback(() => {
    clearPoll();
    pollRef.current = setInterval(() => {
      void loadStatus();
    }, POLL_MS);
  }, [loadStatus]);

  const startConnectFlow = useCallback(async () => {
    setConnecting(true);
    setError("");
    try {
      const existing = await whatsappApi.getStatus();
      if (applyStatus(existing)) return;

      if (existing.qr && existing.status === "qr") {
        startPolling();
        return;
      }

      if (needsPolling(existing)) {
        startPolling();
        return;
      }

      const data = await whatsappApi.connect();
      if (!applyStatus(data)) {
        startPolling();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connect failed");
      setConnecting(false);
      connectStartedRef.current = false;
    }
  }, [applyStatus, startPolling]);

  useEffect(() => {
    if (whatsapp.connected && whatsapp.phone) {
      setStatus({ connected: true, phone: whatsapp.phone, status: "ready" });
      setConnecting(false);
      return;
    }

    if (!autoConnect || connectStartedRef.current) return;
    connectStartedRef.current = true;
    void startConnectFlow();

    return () => clearPoll();
  }, [whatsapp.connected, whatsapp.phone, autoConnect, startConnectFlow]);

  useEffect(() => {
    if (status && needsPolling(status)) startPolling();
    else if (status?.connected) clearPoll();
  }, [status, startPolling]);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError("");
    clearPoll();
    connectStartedRef.current = false;
    try {
      await whatsappApi.disconnect();
      setStatus({ connected: false, phone: null, status: "none", qr: null });
      setConnecting(false);
      onDisconnected?.();
      if (autoConnect) {
        connectStartedRef.current = true;
        void startConnectFlow();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Disconnect failed");
    } finally {
      setDisconnecting(false);
    }
  };

  const connected = (status?.connected && status.phone) || (whatsapp.connected && whatsapp.phone);
  const displayPhone = status?.phone || whatsapp.phone;

  if (connected && displayPhone) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-medium">
            <MessageCircle className="h-4 w-4 text-green-600" />
            {displayPhone}
          </p>
          <p className="text-xs text-muted-foreground">WhatsApp session active</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          {disconnecting ? "Disconnecting..." : "Disconnect"}
        </Button>
      </div>
    );
  }

  const showQr = status?.status === "qr" && Boolean(status.qr);
  const showSyncing =
    status?.syncing ||
    status?.status === "authenticated" ||
    status?.status === "initializing";
  const showPreparing = connecting && !showQr && !showSyncing;

  return (
    <div className="space-y-4">
      {showQr ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/20 p-6">
          <QrCode className="h-5 w-5 text-green-600" />
          <p className="text-sm font-medium">Scan with WhatsApp on your phone</p>
          <p className="text-xs text-muted-foreground">
            Open WhatsApp → Linked devices → Link a device
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={status.qr!} alt="WhatsApp QR code" className="h-56 w-56 rounded-lg bg-white p-2" />
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Waiting for scan...
          </p>
        </div>
      ) : showSyncing ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/20 p-8">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-sm font-medium">Syncing WhatsApp...</p>
          <p className="text-xs text-muted-foreground">
            Your phone shows connected — finishing setup on the server.
          </p>
        </div>
      ) : showPreparing ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/20 p-8">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-sm font-medium">Preparing QR code...</p>
          <p className="text-xs text-muted-foreground">Scan will appear in a moment — no button needed.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/20 p-8">
          <p className="text-sm text-muted-foreground">
            {status?.hasStoredSession
              ? "Reconnecting with saved session..."
              : "Starting WhatsApp connection..."}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => void startConnectFlow()}>
            Retry connection
          </Button>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-destructive">{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void startConnectFlow()}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
