"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { allocateDailyMacros, isCompatiblePhase3APayload, type MacroScenarioId, type MealAllocationPlan, type MealStructureId, type Phase3AResult, type ScenarioId } from "../../core/index";

const dayLabels: Record<ScenarioId, string> = { typical_day: "Обычный день", rest: "День отдыха", training: "День с одной тренировкой", double_training: "День с двумя тренировками" };
const scenarioLabels: Record<MacroScenarioId, string> = { lower: "Нижний расчётный сценарий", central: "Центральный расчётный сценарий", upper: "Верхний расчётный сценарий" };
const patternLabels = { one_or_two: "1–2 раза в день", three: "3 раза в день", four_or_more: "4 и более", not_provided: "Не указано" } as const;
type LoadState = { kind: "loading" } | { kind: "missing" } | { kind: "malformed" } | { kind: "available"; result: Phase3AResult };

function readPhase3A(): LoadState {
  try {
    const raw = sessionStorage.getItem("nutrimind.phase3a.result");
    if (!raw) return { kind: "missing" };
    const parsed: unknown = JSON.parse(raw);
    return isCompatiblePhase3APayload(parsed) ? { kind: "available", result: parsed } : { kind: "malformed" };
  } catch { return { kind: "malformed" }; }
}

const gram = (value: number) => value.toFixed(1).replace(".", ",");
const raw = (values: number[]) => values.map((value) => Number(value.toFixed(4)).toString()).join(" · ");

export default function MealStructureClient() {
  const [loaded, setLoaded] = useState<LoadState>({ kind: "loading" });
  const [dayId, setDayId] = useState<ScenarioId | "">("");
  const [scenarioId, setScenarioId] = useState<MacroScenarioId | "">("");
  const [structureId, setStructureId] = useState<MealStructureId | "">("");
  const [plan, setPlan] = useState<MealAllocationPlan | null>(null);
  useEffect(() => { setLoaded(readPhase3A()); }, []);
  const resetPlan = () => setPlan(null);

  if (loaded.kind === "loading") return <section className="meal-shell"><p>Загрузка результата…</p></section>;
  if (loaded.kind === "missing" || loaded.kind === "malformed") return <section className="meal-shell state-card"><p className="eyebrow">Phase 3A1</p><h1>{loaded.kind === "missing" ? "Результат не найден" : "Формат результата несовместим"}</h1><p>Числовое распределение не сформировано. Завершите анкету снова, чтобы создать совместимый результат.</p><Link className="continue-button" href="/questionnaire">Открыть анкету →</Link></section>;
  const result = loaded.result;
  if (result.status !== "calculated") return <section className="meal-shell state-card"><p className="eyebrow">Safety gateway</p><h1>Числовое распределение недоступно</h1><p>Расчёт остановлен безопасно. Код следующего шага: <code>{result.nextStepCode}</code>.</p><Link className="continue-button" href="/questionnaire">Вернуться к анкете →</Link></section>;

  const days = result.parent.phase2c2.scenarios;
  const selectedDay = days.find((day) => day.id === dayId);
  const selectedScenarioCandidate = selectedDay?.macroScenarios.find((scenario) => scenario.id === scenarioId);
  const selectedScenario = selectedScenarioCandidate?.status === "calculated" ? selectedScenarioCandidate : undefined;
  const selectedStructure = result.availableMealStructures.find((structure) => structure.id === structureId);
  function buildPlan() {
    if (!selectedScenario || !structureId) return;
    setPlan(allocateDailyMacros({ energyKcal: selectedScenario.energyKcal, proteinG: selectedScenario.proteinG, fatG: selectedScenario.fatG, carbohydrateG: selectedScenario.carbohydrateG }, structureId));
  }

  return <section className="meal-shell" aria-labelledby="meal-title">
    <p className="eyebrow">Phase 3A1 · структура приёмов пищи</p><h1 id="meal-title">Распределение суточных КБЖУ</h1>
    <p className="meal-lead">Это один из способов распределить уже рассчитанные суточные КБЖУ. Такая структура не является единственно правильной или медицински назначенной.</p>
    <div className="meal-context"><strong>Текущий режим по анкете</strong><span>{patternLabels[result.normalizedMealContext.currentMealPattern]}</span><p>Этот ответ показан только как контекст и не выбирает структуру автоматически.</p></div>
    <div className="meal-selectors">
      <label>1. Тип дня<select value={dayId} onChange={(event) => { setDayId(event.target.value as ScenarioId | ""); setScenarioId(""); resetPlan(); }}><option value="">Выберите день</option>{days.map((day) => <option value={day.id} key={day.id}>{dayLabels[day.id]}</option>)}</select></label>
      <label>2. Расчётный сценарий<select value={scenarioId} disabled={!dayId} onChange={(event) => { setScenarioId(event.target.value as MacroScenarioId | ""); resetPlan(); }}><option value="">Выберите сценарий</option>{selectedDay?.macroScenarios.map((scenario) => <option value={scenario.id} key={scenario.id} disabled={scenario.status !== "calculated"}>{scenarioLabels[scenario.id]}{scenario.status !== "calculated" ? " — требует проверки" : ""}</option>)}</select></label>
      <label>3. Структура<select value={structureId} onChange={(event) => { setStructureId(event.target.value as MealStructureId | ""); resetPlan(); }}><option value="">Выберите структуру</option>{result.availableMealStructures.map((structure) => <option value={structure.id} key={structure.id}>{structure.label}</option>)}</select></label>
    </div>
    <p className="meal-selector-note">Нижний и верхний сценарии не являются автоматически назначенным дефицитом или профицитом.</p>
    <button type="button" className="continue-button" disabled={!selectedDay || !selectedScenario || !selectedStructure} onClick={buildPlan}>Показать распределение</button>
    {!plan && <p className="meal-empty">План появится после трёх явных выборов.</p>}
    {plan && selectedDay && selectedScenario && selectedStructure && <section className="meal-plan" aria-live="polite">
      <div className="meal-plan-heading"><div><p className="eyebrow">{dayLabels[selectedDay.id]} · {scenarioLabels[selectedScenario.id]}</p><h2>{selectedStructure.label}</h2></div><strong>Суточные значения не изменены</strong></div>
      <div className="meal-card-grid">{plan.meals.map((meal) => <article className="meal-card" key={meal.mealId}><h3>{meal.displayLabel}</h3><dl><dt>Энергия</dt><dd>{meal.energyKcal} ккал</dd><dt>Белки</dt><dd>{gram(meal.proteinG)} г</dd><dt>Жиры</dt><dd>{gram(meal.fatG)} г</dd><dt>Углеводы</dt><dd>{gram(meal.carbohydrateG)} г</dd></dl></article>)}</div>
      <div className="meal-total"><strong>Итого за сутки</strong><span>{plan.totals.energyKcal} ккал</span><span>Б {gram(plan.totals.proteinG)} г</span><span>Ж {gram(plan.totals.fatG)} г</span><span>У {gram(plan.totals.carbohydrateG)} г</span></div>
      <div className="meal-notices"><p>Количество приёмов можно выбрать под свой режим.</p><p>Распределение не является медицинским назначением.</p><p>При аллергии или целиакии будущий подбор продуктов должен соблюдать жёсткие исключения.</p></div>
      <details><summary>Основания распределения</summary><dl className="meal-trace"><dt>Веса структуры</dt><dd>{selectedStructure.meals.map((meal) => `${meal.displayLabel}: ${meal.weight}`).join("; ")}</dd><dt>Округление</dt><dd>Энергия — целые ккал; КБЖУ — 0,1 г; половинные случаи — к ближайшему чётному.</dd><dt>Приём для сверки</dt><dd>{selectedStructure.meals.find((meal) => meal.mealId === plan.trace.reconciliationMealId)?.displayLabel}</dd><dt>Остатки: ккал / Б / Ж / У</dt><dd>{plan.trace.values.energyKcal.residual} / {gram(plan.trace.values.proteinG.residual)} / {gram(plan.trace.values.fatG.residual)} / {gram(plan.trace.values.carbohydrateG.residual)}</dd><dt>Исходный сценарий</dt><dd>{selectedDay.id} / {selectedScenario.id}</dd><dt>Raw ккал</dt><dd>{raw(plan.trace.values.energyKcal.raw)}</dd><dt>Rule IDs</dt><dd className="rule-list">{plan.trace.ruleIds.join(", ")}</dd></dl></details>
    </section>}
  </section>;
}
