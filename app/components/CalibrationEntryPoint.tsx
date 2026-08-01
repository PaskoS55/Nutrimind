"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadActiveJournal } from "../../core/calibration/storage";

export default function CalibrationEntryPoint({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState(false);
  useEffect(() => { void loadActiveJournal().then((result) => setActive(result.kind === "available" && result.journal.status !== "safety_context_changed")); }, []);
  if (compact && !active) return null;
  return <div className={compact ? "calibration-continuation" : "calibration-entry-point"}>
    {!compact && <><p className="eyebrow">14 дней наблюдений</p><h2>Калибровочный журнал</h2><p>Фиксируйте фактический контекст без автоматической коррекции расчёта и без медицинских выводов.</p></>}
    <Link className={compact ? "text-action" : "continue-button"} href="/calibration">{active ? "Продолжить журнал" : "Начать 14-дневное наблюдение"} →</Link>
  </div>;
}
