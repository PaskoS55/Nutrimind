"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PHASE2C1_RESULT_SCHEMA_VERSION, type Phase2C1Result, type ScenarioLabelCode } from "../../core/index";

const dayLabels: Record<ScenarioLabelCode, string> = { "day.typical": "Обычный день", "day.rest": "День отдыха", "day.training": "День с одной тренировкой", "day.double_training": "День с двумя тренировками" };
const goalLabels = { weight_loss: "Снижение веса", maintenance: "Поддержание веса и формы", muscle_gain: "Набор мышечной массы", performance_recovery: "Результативность и восстановление", habits_wellbeing: "Питание и самочувствие" };

function readResult(): Phase2C1Result | null {
  try {
    const value = sessionStorage.getItem("nutrimind.phase2c1.result");
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<Phase2C1Result>;
    return parsed.resultSchemaVersion === PHASE2C1_RESULT_SCHEMA_VERSION ? parsed as Phase2C1Result : null;
  } catch { return null; }
}

export default function ResultPage() {
  const [result, setResult] = useState<Phase2C1Result | null | undefined>(undefined);
  useEffect(() => setResult(readResult()), []);
  if (result === undefined) return <main className="app-shell" />;
  return <main className="app-shell"><section className="result-shell" aria-labelledby="result-title">
    {!result ? <><p className="eyebrow">Результат не найден</p><h1 id="result-title">Пройдите анкету снова</h1><p>Данные этой вкладки отсутствуют, устарели или имеют несовместимую версию.</p><Link className="continue-button" href="/questionnaire">Открыть анкету →</Link></> : result.status === "calculated" ? <>
      <p className="eyebrow">Production · Phase 2C1</p><h1 id="result-title">Расчёт базового обмена</h1>
      <div className="ree-value"><b>{result.ree.displayKcalPerDay}</b><span>ккал/сутки · REE</span></div>
      <p>REE — расчёт энергии базового обмена по утверждённой взрослой формуле. Это не суточная калорийность.</p>

      <section className="energy-section" aria-labelledby="energy-title"><h2 id="energy-title">Расчётные сценарии дня</h2><p>Расчётный стартовый ориентир. Значение необходимо проверить по фактическому рациону, динамике массы, нагрузке и самочувствию.</p><div className="scenario-grid">{result.scenarios.map((scenario) => <article className="scenario-card" key={scenario.id}>
        <p className="eyebrow">{dayLabels[scenario.labelCode]}</p><h3>Расчётный стартовый ориентир</h3><div className="scenario-energy"><b>{scenario.energyStartKcal}</b><span>ккал/сутки</span></div><dl><dt>Демонстрационный PAL-пресет</dt><dd>{scenario.palFinal.toFixed(2)}</dd>{scenario.id === "training" && result.scenarios[0]?.id === "rest" && <><dt>Модификатор длительности</dt><dd>{scenario.durationModifier > 0 ? "+" : ""}{scenario.durationModifier.toFixed(2)}</dd></>}</dl>{scenario.warnings.includes("double_duration_unknown") && <p className="scenario-warning">Длительность двух отдельных тренировок неизвестна и не удваивалась.</p>}
      </article>)}</div></section>

      <section className="goal-section"><h2>Выбранная цель</h2><p><b>{goalLabels[result.selectedGoal]}</b></p><p>На этапе Phase 2C1 цель не изменила энергию. Применённый множитель: {result.appliedGoalMultiplier.toFixed(2)}.</p>{result.selectedGoal === "weight_loss" && <p>Автоматическое снижение калорийности не применено. Для него требуется отдельный safety-скрининг.</p>}{result.selectedGoal === "muscle_gain" && <p>Профицит калорийности на этом этапе не применён.</p>}</section>

      <details><summary>Основания расчёта</summary><p>Формула REE: {result.ree.formulaId}; округление REE: {result.ree.roundingRuleId}.</p><dl><dt>Возраст</dt><dd>{result.ree.inputs.ageYears} лет</dd><dt>Рост</dt><dd>{result.ree.inputs.heightCm} см</dd><dt>Масса</dt><dd>{result.ree.inputs.weightKg} кг</dd><dt>Категория</dt><dd>{result.ree.inputs.sexForFormula}</dd><dt>Множитель цели</dt><dd>{result.appliedGoalMultiplier.toFixed(2)}</dd></dl>{result.scenarios.map((scenario) => <div className="scenario-basis" key={scenario.id}><h3>{dayLabels[scenario.labelCode]} · <code>{scenario.id}</code></h3><p>PAL base {scenario.palBase.toFixed(2)}; duration {scenario.durationModifier.toFixed(2)}; final {scenario.palFinal.toFixed(2)}.</p><p>Энергия без округления: {scenario.energyStartRawKcal}; nearest 50: {scenario.energyStartKcal}.</p><p>Правила: {scenario.appliedRuleIds.join(", ")}.</p>{scenario.warnings.length > 0 && <p>Предупреждения: {scenario.warnings.join(", ")}.</p>}</div>)}</details>
      <div className="report-notice">КБЖУ, гидратация и 14-дневная калибровка будут подключены на следующих этапах.</div>
    </> : <><p className="eyebrow">Safety gateway</p><h1 id="result-title">{result.status === "minor_suppressed" ? "Числовой результат скрыт" : result.status === "specialist_review" ? "Нужна проверка специалиста" : result.status === "invalid_input" ? "Нужно проверить ответы" : "Расчёт остановлен"}</h1><p>Числовые значения не формировались. Код следующего шага: <code>{result.nextStepCode}</code>.</p>{result.issues.length > 0 && <ul>{result.issues.map((x, i) => <li key={`${x.code}-${i}`}>{x.message}</li>)}</ul>}<Link className="continue-button" href="/questionnaire">Вернуться к анкете →</Link></>}
  </section></main>;
}
