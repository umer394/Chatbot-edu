import { Suspense } from "react";
import VerifySuccessClient from "./VerifySuccessClient";

export default function VerifySuccessPage() {
  return (
    <Suspense fallback={<div className="p-8">Finishing Google connection...</div>}>
      <VerifySuccessClient />
    </Suspense>
  );
}
