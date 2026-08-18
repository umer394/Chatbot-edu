"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifySuccessClient() {
  const params = useSearchParams();
  const email = params.get("email");
  const status = params.get("status");

  useEffect(() => {
    try {
      const message =
        status === "success" && email
          ? { type: "oauth-success", email }
          : { type: "oauth-failure", message: "Google connection failed" };

      if (window.opener) {
        window.opener.postMessage(message, window.location.origin);
      }
    } catch (err) {
      console.error("postMessage error", err);
    }

    const t = setTimeout(() => window.close(), 1000);
    return () => clearTimeout(t);
  }, [email, status]);

  return (
    <div className="p-8">
      <h1 className="mb-2 text-xl font-semibold">
        {status === "success" && email ? "Connection successful" : "Connection failed"}
      </h1>
      {status === "success" && email ? (
        <p>
          Connected as <strong>{email}</strong>. You can close this window.
        </p>
      ) : (
        <p>Google connection failed. Close this window and try again.</p>
      )}
    </div>
  );
}
