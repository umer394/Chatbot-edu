// app/verify-success/page.tsx
"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifySuccessPage() {
  const params = useSearchParams();
  const email = params.get("email");
  const status = params.get("status"); // optional

  useEffect(() => {
    try {
      const message = email
        ? { type: "oauth-success", email }
        : { type: "oauth-failure", message: "No email returned" };

      // Only post to opener with same origin (security)
      const targetOrigin = window.opener ? window.location.origin : "*";
      if (window.opener) {
        window.opener.postMessage(message, targetOrigin);
      }
    } catch (err) {
      console.error("postMessage error", err);
    }

    // close popup after short delay
    const t = setTimeout(() => window.close(), 1000);
    return () => clearTimeout(t);
  }, [email]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold mb-2">
        {email ? "Verification successful" : "Verification failed"}
      </h1>
      {email ? (
        <p>Verified as <strong>{email}</strong>. You can close this window.</p>
      ) : (
        <p>Verification failed. Close and try again.</p>
      )}
    </div>
  );
}
