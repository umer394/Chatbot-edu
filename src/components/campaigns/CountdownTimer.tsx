"use client";

import { useEffect, useState } from "react";

type Props = {
  targetDate: string | null;
  active?: boolean;
};

function formatRemaining(ms: number) {
  if (ms <= 0) return "Starting soon…";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export default function CountdownTimer({ targetDate, active = true }: Props) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!targetDate || !active) {
      setRemaining("");
      return;
    }
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      setRemaining(formatRemaining(diff));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetDate, active]);

  if (!targetDate || !active || !remaining) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-100">
      ⏱ {remaining}
    </span>
  );
}
