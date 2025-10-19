// components/VerifyEmailButton.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";

type Props = {
  onVerified?: (email: string) => void; // callback when verified
};

export default function VerifyEmailButton({ onVerified }: Props) {
  const popupRef = useRef<Window | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      // safety: ensure message origin is our frontend origin
      const allowedOrigin = process.env.NEXT_PUBLIC_FRONTEND_ORIGIN || window.location.origin;
      if (e.origin !== allowedOrigin) {
        // ignore messages from other origins
        return;
      }
      const data = e.data;
      if (data?.type === "oauth-success" && data?.email) {
        onVerified?.(data.email);
        setLoading(false);
        if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
      } else if (data?.type === "oauth-failure") {
        alert("Verification failed or cancelled.");
        setLoading(false);
        if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onVerified]);

  const openPopup = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/auth/get-google-url`, { method: "GET", credentials: "include" });
      const data = await resp.json();
      if (!data?.url) {
        alert("Unable to get OAuth URL from backend.");
        setLoading(false);
        return;
      }
      // center popup
      const w = 700, h = 700;
      const left = window.screenX + (window.innerWidth - w) / 2;
      const top = window.screenY + (window.innerHeight - h) / 2;
      popupRef.current = window.open(
        data.url,
        "google-oauth",
        `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
      if (!popupRef.current) {
        alert("Popup blocked. Please allow popups.");
        setLoading(false);
      } else {
        popupRef.current.focus();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start verification.");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700"
      onClick={openPopup}
      disabled={loading}
    >
      {loading ? "Opening..." : "Verify Google ID"}
    </button>
  );
}
