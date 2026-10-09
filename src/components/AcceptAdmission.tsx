"use client";

import { useState, useTransition } from "react";
import { gameAction } from "@/app/actions";

export function AcceptAdmission({ characterId, version }: { characterId: string; version: number }) {
  // One key per mount: a double tap or a retried request is applied once.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <div className="mt-6 flex flex-col gap-2">
      <button className="btn-primary" disabled={pending}
        onClick={() => start(async () => {
          const res = await gameAction({ characterId, expectedVersion: version, idempotencyKey, action: { type: "ACCEPT_ADMISSION" } });
          if (res?.error) setError(res.error);
        })}>
        {pending ? "Packing your bags…" : "Accept and pay fees"}
      </button>
      <p role="alert" className="min-h-5 text-sm font-semibold text-clay-deep">{error}</p>
    </div>
  );
}
