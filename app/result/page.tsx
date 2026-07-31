"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductHeader from "../components/ProductHeader";
import type { Phase2BResult } from "../../core/index";

export default function ResultPage() {
  const [result, setResult] = useState<Phase2BResult | null | undefined>(undefined);
  useEffect(() => { const value = sessionStorage.getItem("nutrimind.phase2b.result"); setResult(value ? JSON.parse(value) : null); }, []);
  if (result === undefined) return <main className="app-shell" />;
  return <main className="app-shell"><ProductHeader><div className="header-actions"><Link className="quiet-action" href="/">На главную</Link><Link className="save-action" href="/questionnaire">Изменить ответы</Link></div></ProductHeader>
    <section className="result-shell" aria-labelledby="result-title">
      {!result ? <><p className="eyebrow">Результат не найден</p><h1 id="result-title">Пройдите анкету</h1><p>Данные этой вкладки отсутствуют или срок сессии завершён.</p><Link className="continue-button" href="/questionnaire">Открыть анкету →</Link></> : result.status === "calculated" ? <>
        <p className="eyebrow">Production · этап REE</p><h1 id="result-title">Расчёт базового обмена</h1><div className="ree-value"><b>{result.ree.displayKcalPerDay}</b><span>ккал/сутки · REE</span></div>
        <p>Показан только реализованный производственный этап. Это не суточная цель и не рекомендация по калорийности.</p>
        <div className="report-notice">PAL, суточная потребность, целевая калорийность и КБЖУ ещё не рассчитаны.</div>
        <details><summary>Основания расчёта</summary><p>Формула: {result.ree.formulaId}; округление: {result.ree.roundingRuleId}.</p><dl><dt>Возраст</dt><dd>{result.ree.inputs.ageYears} лет</dd><dt>Рост</dt><dd>{result.ree.inputs.heightCm} см</dd><dt>Масса</dt><dd>{result.ree.inputs.weightKg} кг</dd><dt>Категория</dt><dd>{result.ree.inputs.sexForFormula}</dd></dl></details>
      </> : <><p className="eyebrow">Safety gateway</p><h1 id="result-title">{result.status === "minor_suppressed" ? "Числовой результат скрыт" : result.status === "specialist_review" ? "Нужна проверка специалиста" : "Расчёт остановлен"}</h1><p>Числовые значения не формировались. Код следующего шага: <code>{result.nextStepCode}</code>.</p>{result.issues.length > 0 && <ul>{result.issues.map((x, i) => <li key={`${x.code}-${i}`}>{x.message}</li>)}</ul>}</>}
    </section></main>;
}
