"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  onVerified?: (email: string) => void;
};

export default function VerifyEmailButton({ onVerified }: Props) {
  const oauthTabRef = useRef<Window | null>(null);
  const pollRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(false);

  const stopPolling = () => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const checkConnectionStatus = async () => {
    const resp = await fetch("/api/auth/google/status", { credentials: "include" });
    if (!resp.ok) return false;

    const data = await resp.json();
    if (data.connected && data.email) {
      onVerified?.(data.email);
      setLoading(false);
      stopPolling();
      oauthTabRef.current?.close();
      return true;
    }
    return false;
  };

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const allowedOrigin = process.env.NEXT_PUBLIC_FRONTEND_ORIGIN || window.location.origin;
      if (e.origin !== allowedOrigin) return;

      const data = e.data;
      if (data?.type === "oauth-success" && data?.email) {
        onVerified?.(data.email);
        setLoading(false);
        stopPolling();
        oauthTabRef.current?.close();
      } else if (data?.type === "oauth-failure") {
        alert(
          "Google connection failed. If you saw 'org_internal', set OAuth user type to External in Google Cloud Console and add your Gmail as a test user."
        );
        setLoading(false);
        stopPolling();
      }
    }

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      stopPolling();
    };
  }, [onVerified]);

  const openOAuthTab = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/auth/get-google-url", {
        method: "GET",
        credentials: "include",
      });
      const data = await resp.json();

      if (!resp.ok || !data?.url) {
        alert(data.error || "Unable to start Google OAuth. Check backend Google credentials.");
        setLoading(false);
        return;
      }

      // Open in a new browser tab (same browser, not a small popup).
      // Do not use noopener so verify-success can postMessage back to this page.
      oauthTabRef.current = window.open(data.url, "_blank");

      if (!oauthTabRef.current) {
        alert("Could not open a new tab. Please allow popups/new tabs for this site.");
        setLoading(false);
        return;
      }

      oauthTabRef.current.focus();
      stopPolling();

      // Fallback: poll connection status while user completes OAuth in the other tab.
      pollRef.current = window.setInterval(async () => {
        if (oauthTabRef.current?.closed) {
          const connected = await checkConnectionStatus();
          if (!connected) {
            setLoading(false);
            stopPolling();
          }
          return;
        }
        await checkConnectionStatus();
      }, 2000);
    } catch {
      alert("Failed to start Google connection.");
      setLoading(false);
      stopPolling();
    }
  };

  return (
    <button
      type="button"
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      onClick={openOAuthTab}
      disabled={loading}
    >
      {loading ? "Connecting in new tab..." : "Connect Google Account"}
    </button>
  );
}
