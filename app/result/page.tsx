"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isCompatiblePhase2C2Payload, type MacroScenario, type Phase2C2Result, type ScenarioLabelCode } from "../../core/index";

const dayLabels: Record<ScenarioLabelCode, string> = { "day.typical": "Обычный день", "day.rest": "День отдыха", "day.training": "День с одной тренировкой", "day.double_training": "День с двумя тренировками" };
const scenarioLabels = { lower: "Нижний расчётный сценарий", central: "Центральный расчётный сценарий", upper: "Верхний расчётный сценарий" };
const goalLabels = { weight_loss: "Снижение веса", maintenance: "Поддержание веса и формы", muscle_gain: "Набор мышечной массы", performance_recovery: "Результативность и восстановление", habits_wellbeing: "Питание и самочувствие" };

function readResult(): Phase2C2Result | null {
  try { const raw = sessionStorage.getItem("nutrimind.phase2c2.result"); if (!raw) return null; const parsed: unknown = JSON.parse(raw); return isCompatiblePhase2C2Payload(parsed) ? parsed : null; } catch { return null; }
}
const one = (value: number) => value.toFixed(1);

function MacroCell({ macro }: { macro: MacroScenario }) {
  return <article className={`macro-scenario ${macro.id === "central" ? "macro-central" : ""}`} aria-label={scenarioLabels[macro.id]}>
    <h4>{scenarioLabels[macro.id]}</h4>
    {macro.status === "needs_review" ? <><p>Сценарий требует проверки расчёта.</p><details><summary>Технические детали</summary><code>{macro.issues.join(", ")}</code></details></> : <>
      <dl><dt>Энергия</dt><dd>{macro.energyKcal} ккал/сутки</dd><dt>Белки</dt><dd>{one(macro.proteinG)} г/сутки</dd><dt>Жиры</dt><dd>{one(macro.fatG)} г/сутки</dd><dt>Углеводы</dt><dd>{one(macro.carbohydrateG)} г/сутки</dd></dl>
      <p className="consistency">Математическая проверка: КБЖУ согласованы с энергией; отклонение {one(macro.deviationKcal)} ккал.</p>
      <details><summary>Основания сценария</summary><dl className="macro-trace"><dt>Phase 2C1 EnergyStart</dt><dd>{macro.trace.energyStartKcal} ккал</dd><dt>Фактор</dt><dd>{macro.trace.scenarioFactor.toFixed(2)}</dd><dt>Энергия raw / rounded</dt><dd>{macro.trace.energyRawKcal} / {macro.trace.energyKcal}</dd><dt>Категория</dt><dd>{macro.trace.profileCategory}</dd><dt>Белок: коэффициент</dt><dd>{macro.trace.proteinCoefficient.toFixed(2)} г/кг</dd><dt>Белок raw / rounded</dt><dd>{macro.trace.proteinRawG} / {one(macro.trace.proteinRoundedG)} г</dd><dt>Жир: коэффициент</dt><dd>{macro.trace.fatCoefficient.toFixed(2)} г/кг</dd><dt>Жир по массе</dt><dd>{macro.trace.fatByWeightRawG} г</dd><dt>20% энергии</dt><dd>{macro.trace.fatEnergyFloorRawG} г</dd><dt>Источник жира</dt><dd>{macro.trace.fatFloorSource}</dd><dt>Жир raw / rounded</dt><dd>{macro.trace.fatSelectedRawG} / {one(macro.trace.fatRoundedG)} г</dd><dt>Углеводы raw / rounded</dt><dd>{macro.trace.carbohydrateRawG} / {one(macro.trace.carbohydrateRoundedG)} г</dd><dt>MacroEnergy / отклонение</dt><dd>{one(macro.trace.macroEnergyKcal)} / {one(macro.trace.deviationKcal)} ккал</dd></dl><p className="rule-list">{macro.trace.ruleIds.join(", ")}</p></details>
    </>}
  </article>;
}

export default function ResultPage() {
  const [result, setResult] = useState<Phase2C2Result | null | undefined>(undefined);
  useEffect(() => setResult(readResult()), []);
  if (result === undefined) return <main className="app-shell" />;
  return <main className="app-shell"><section className="result-shell" aria-labelledby="result-title">
    {!result ? <><p className="eyebrow">Результат не найден</p><h1 id="result-title">Пройдите анкету снова</h1><p>Данные отсутствуют, устарели или имеют несовместимую версию. Для нового расчёта завершите анкету ещё раз.</p><Link className="continue-button" href="/questionnaire">Открыть анкету →</Link></> : result.status === "calculated" ? <>
      <p className="eyebrow">Production · Phase 2C2</p><h1 id="result-title">Расчёт базового обмена</h1><div className="ree-value"><b>{result.ree.displayKcalPerDay}</b><span>ккал/сутки · REE</span></div><p>REE — расчёт энергии базового обмена по утверждённой взрослой формуле. Это не суточная калорийность.</p>
      <section className="energy-section" aria-labelledby="energy-title"><h2 id="energy-title">Расчётные сценарии дня</h2><div className="scenario-grid">{result.scenarios.map((day) => <article className="scenario-card" key={day.id}><p className="eyebrow">{dayLabels[day.labelCode]}</p><h3>Расчётный стартовый ориентир</h3><div className="scenario-energy"><b>{day.energyStartKcal}</b><span>ккал/сутки</span></div><dl><dt>Демонстрационный PAL-пресет</dt><dd>{day.palFinal.toFixed(2)}</dd><dt>Модификатор длительности</dt><dd>{day.durationModifier.toFixed(2)}</dd></dl>{day.warnings.includes("double_duration_unknown") && <p className="scenario-warning">Длительность двух отдельных тренировок неизвестна и не удваивалась.</p>}</article>)}</div></section>
      <section className="macro-section" aria-labelledby="macro-title"><h2 id="macro-title">Сценарии КБЖУ</h2><p>Три сценария показывают, как меняется структура КБЖУ вокруг расчётного стартового ориентира. Это не диапазон измеренной потребности и не автоматически назначенный дефицит или профицит.</p>{result.scenarios.map((day) => <section className="macro-day" key={day.id} aria-labelledby={`macro-${day.id}`}><h3 id={`macro-${day.id}`}>{dayLabels[day.labelCode]} · стартовый ориентир {day.energyStartKcal} ккал</h3><div className="macro-grid" aria-label={`Сравнение сценариев КБЖУ: ${dayLabels[day.labelCode]}`}>{day.macroScenarios.map((macro) => <MacroCell key={macro.id} macro={macro} />)}</div></section>)}</section>
      <section className="goal-section"><h2>Выбранная цель</h2><p><b>{goalLabels[result.selectedGoal]}</b></p><p>Цель не изменила энергию или КБЖУ. Применённый множитель: {result.appliedGoalMultiplier.toFixed(2)}.</p>{result.selectedGoal === "weight_loss" && <p>Автоматическое снижение калорийности не применено.</p>}{result.selectedGoal === "muscle_gain" && <p>Автоматический профицит не применён.</p>}</section>
      <details><summary>Основания расчёта энергии</summary><p>Формула REE: {result.ree.formulaId}; округление REE: {result.ree.roundingRuleId}.</p>{result.scenarios.map((day) => <div className="scenario-basis" key={day.id}><h3>{dayLabels[day.labelCode]} · <code>{day.id}</code></h3><p>PAL base {day.palBase.toFixed(2)}; duration {day.durationModifier.toFixed(2)}; final {day.palFinal.toFixed(2)}.</p><p>EnergyStart raw {day.energyStartRawKcal}; rounded {day.energyStartKcal}.</p><p>{day.appliedRuleIds.join(", ")}</p></div>)}</details>
      <div className="report-notice">Гидратация и 14-дневная калибровка будут подключены на следующих этапах.</div>
    </> : <><p className="eyebrow">Safety gateway</p><h1 id="result-title">Числовой результат не сформирован</h1><p>Расчёт остановлен безопасно. Код следующего шага: <code>{result.nextStepCode}</code>.</p><Link className="continue-button" href="/questionnaire">Вернуться к анкете →</Link></>}
  </section></main>;
}
