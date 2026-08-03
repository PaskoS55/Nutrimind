"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { allocateDailyMacros, isCompatiblePhase3APayload, type MacroScenarioId, type MealAllocationPlan, type MealStructureId, type Phase3AResult, type ScenarioId } from "../../core/index";
import { buildTrainingBoundaries } from "../../core/meal-timing/boundaries";
import { isCompatiblePhase3A2Context } from "../../core/meal-timing/context-schema";
import { isPhase3A2Eligible } from "../../core/meal-timing/eligibility";
import { buildTrainingRelations } from "../../core/meal-timing/relations";
import { PHASE3A2_CONTEXT_STORAGE_KEY, type Phase3A2Context } from "../../core/meal-timing/types";
import { getNeutralFoodGroupSlots } from "../../core/food-templates/neutral-slots";

const dayLabels: Record<ScenarioId, string> = { typical_day: "Обычный день", rest: "День отдыха", training: "День с одной тренировкой", double_training: "День с двумя тренировками" };
const scenarioLabels: Record<MacroScenarioId, string> = { lower: "Нижний расчётный сценарий", central: "Центральный расчётный сценарий", upper: "Верхний расчётный сценарий" };
const patternLabels = { one_or_two: "1–2 раза в день", three: "3 раза в день", four_or_more: "4 и более", not_provided: "Не указано" } as const;
type LoadState = { kind: "loading" } | { kind: "missing" } | { kind: "malformed" } | { kind: "available"; result: Phase3AResult };
type TimingContextState = Phase3A2Context | { status: "malformed" };

function readPhase3A(): LoadState {
  try {
    const raw = sessionStorage.getItem("nutrimind.phase3a.result");
    if (!raw) return { kind: "missing" };
    const parsed: unknown = JSON.parse(raw);
    return isCompatiblePhase3APayload(parsed) ? { kind: "available", result: parsed } : { kind: "malformed" };
  } catch { return { kind: "malformed" }; }
}

function readTimingContext(): TimingContextState {
  try {
    const raw = sessionStorage.getItem(PHASE3A2_CONTEXT_STORAGE_KEY);
    if (!raw) return { schemaVersion: "nutrimind.phase3a2.context.v1", status: "not_provided" };
    const parsed: unknown = JSON.parse(raw);
    return isCompatiblePhase3A2Context(parsed) ? parsed : { status: "malformed" };
  } catch { return { status: "malformed" }; }
}

const gram = (value: number) => value.toFixed(1).replace(".", ",");
const raw = (values: number[]) => values.map((value) => Number(value.toFixed(4)).toString()).join(" · ");

export default function MealStructureClient() {
  const [loaded, setLoaded] = useState<LoadState>({ kind: "loading" });
  const [dayId, setDayId] = useState<ScenarioId | "">("");
  const [scenarioId, setScenarioId] = useState<MacroScenarioId | "">("");
  const [structureId, setStructureId] = useState<MealStructureId | "">("");
  const [plan, setPlan] = useState<MealAllocationPlan | null>(null);
  const [timingContext, setTimingContext] = useState<TimingContextState>({ status: "malformed" });
  const [timingOpen, setTimingOpen] = useState(false);
  const [boundaryId, setBoundaryId] = useState("");
  const [appliedBoundaryId, setAppliedBoundaryId] = useState("");
  const [timingAnnouncement, setTimingAnnouncement] = useState("");
  useEffect(() => { setLoaded(readPhase3A()); setTimingContext(readTimingContext()); }, []);
  const resetTiming = () => { setTimingOpen(false); setBoundaryId(""); setAppliedBoundaryId(""); setTimingAnnouncement(""); };
  const resetPlan = () => { setPlan(null); resetTiming(); };

  if (loaded.kind === "loading") return <section className="meal-shell"><p>Загрузка результата…</p></section>;
  if (loaded.kind === "missing" || loaded.kind === "malformed") return <section className="meal-shell state-card"><p className="eyebrow">Phase 3A1</p><h1>{loaded.kind === "missing" ? "Результат не найден" : "Формат результата несовместим"}</h1><p>Числовое распределение не сформировано. Завершите анкету снова, чтобы создать совместимый результат.</p><Link className="continue-button" href="/questionnaire">Открыть анкету →</Link></section>;
  const result = loaded.result;
  if (result.status !== "calculated") return <section className="meal-shell state-card"><p className="eyebrow">Safety gateway</p><h1>Числовое распределение недоступно</h1><p>Расчёт остановлен безопасно. Код следующего шага: <code>{result.nextStepCode}</code>.</p><Link className="continue-button" href="/questionnaire">Вернуться к анкете →</Link></section>;

  const days = result.parent.phase2c2.scenarios;
  const selectedDay = days.find((day) => day.id === dayId);
  const selectedScenarioCandidate = selectedDay?.macroScenarios.find((scenario) => scenario.id === scenarioId);
  const selectedScenario = selectedScenarioCandidate?.status === "calculated" ? selectedScenarioCandidate : undefined;
  const selectedStructure = result.availableMealStructures.find((structure) => structure.id === structureId);
  const boundaries = plan ? buildTrainingBoundaries(plan.meals) : [];
  const relationView = plan && appliedBoundaryId ? buildTrainingRelations(plan.meals, appliedBoundaryId) : null;
  const neutralSlots = getNeutralFoodGroupSlots();
  const timingEligible = isPhase3A2Eligible({ phase3aCalculated: true, planBuilt: plan !== null, dayId: selectedDay?.id ?? "", context: timingContext });
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
      <div className="food-template-intro">
        <h3>Нейтральный конструктор категорий</h3>
        <p>Под каждым приёмом можно открыть абстрактные категории для самостоятельной сборки. Это не список продуктов, не готовое меню и не точный подбор под КБЖУ.</p>
        <p>Необязательно использовать все категории в каждом приёме.</p>
        <p className="food-template-warning">Категория сама по себе не подтверждает отсутствие аллергена, глютена или риска перекрёстного контакта. При аллергии, целиакии или другом ограничении необходимо отдельно проверять состав, маркировку и условия приготовления конкретного продукта.</p>
        <p><strong>Рассчитанные КБЖУ и расположение приёмов не изменены.</strong></p>
      </div>
      <div className="meal-timing-grid">
        {relationView?.markerPosition === 0 && <div className="training-marker" role="note">{relationView.markerLabel}</div>}
        {plan.meals.map((meal, index) => <div className="meal-timing-item" key={meal.mealId}><article className="meal-card"><h3>{meal.displayLabel}</h3>{relationView && <p className="meal-relation">{relationView.meals[index].label}</p>}<dl><dt>Энергия</dt><dd>{meal.energyKcal} ккал</dd><dt>Белки</dt><dd>{gram(meal.proteinG)} г</dd><dt>Жиры</dt><dd>{gram(meal.fatG)} г</dd><dt>Углеводы</dt><dd>{gram(meal.carbohydrateG)} г</dd></dl><details className="food-template-details"><summary>Категории для самостоятельной сборки</summary><p>Категории не определяют конкретный продукт, порцию или состав блюда.</p><ul>{neutralSlots.map((slot) => <li key={slot.id}>{slot.label}</li>)}</ul></details></article>{relationView?.markerPosition === index + 1 && <div className="training-marker" role="note">{relationView.markerLabel}</div>}</div>)}
      </div>
      <div className="meal-total"><strong>Итого за сутки</strong><span>{plan.totals.energyKcal} ккал</span><span>Б {gram(plan.totals.proteinG)} г</span><span>Ж {gram(plan.totals.fatG)} г</span><span>У {gram(plan.totals.carbohydrateG)} г</span></div>
      {timingEligible && timingContext.status === "available" && <section className="meal-timing" aria-labelledby="meal-timing-title">
        <h3 id="meal-timing-title">Расположить тренировку относительно приёмов</h3>
        <p>Укажите, между какими приёмами обычно проходит одна тренировка. Это показывает только последовательность событий, а не точные часы и не обязательное окно питания.</p>
        <div className="timing-context"><strong>По анкете: {timingContext.displayLabel}</strong><span>Это общий контекст части дня, а не точное время. Текущий выбор расположения имеет приоритет и не меняет КБЖУ.</span></div>
        {!timingOpen ? <button type="button" className="continue-button" onClick={() => { setTimingOpen(true); setTimingAnnouncement("Выбор расположения открыт. Расположение ещё не выбрано."); }}>Добавить расположение тренировки</button> : <>
          <fieldset><legend>Где проходит тренировка?</legend>{boundaries.map((boundary) => <label className="timing-option" key={boundary.id}><input type="radio" name="training-boundary" value={boundary.id} checked={boundaryId === boundary.id} onChange={() => setBoundaryId(boundary.id)} /> <span>{boundary.label}</span></label>)}</fieldset>
          <div className="timing-actions"><button type="button" className="continue-button" disabled={!boundaryId} aria-describedby={!boundaryId ? "timing-disabled-reason" : undefined} onClick={() => { setAppliedBoundaryId(boundaryId); setTimingAnnouncement("Расположение тренировки применено. Значения КБЖУ не изменены."); }}>Показать расположение</button><button type="button" className="back-button" onClick={() => { setBoundaryId(""); setAppliedBoundaryId(""); setTimingOpen(false); setTimingAnnouncement("Расположение тренировки убрано. План КБЖУ сохранён."); }}>Убрать расположение тренировки</button></div>
          {!boundaryId && <p id="timing-disabled-reason" className="meal-selector-note">Сначала выберите расположение тренировки.</p>}
        </>}
        {relationView && <p className="timing-disclaimer">Метки описывают порядок событий. Они не задают точный интервал, состав еды или обязательное время приёма пищи.</p>}
        <p className="sr-only" aria-live="polite">{timingAnnouncement}</p>
      </section>}
      {selectedDay.id === "training" && timingContext.status === "not_provided" && <p className="timing-unavailable">Расположение относительно тренировки недоступно: часть дня тренировки не указана. Распределение КБЖУ остаётся доступным.</p>}
      {selectedDay.id === "training" && (timingContext.status === "unsupported" || timingContext.status === "malformed") && <p className="timing-unavailable">Расположение относительно тренировки недоступно из-за неподдерживаемого значения анкеты. Пройдите анкету заново. Распределение КБЖУ не изменено.</p>}
      {selectedDay.id === "double_training" && <p className="timing-unavailable">Для дня с двумя тренировками расположение приёмов пока не поддерживается: данных о двух отдельных тренировках недостаточно.</p>}
      <div className="meal-notices"><p>Количество приёмов можно выбрать под свой режим.</p><p>Распределение не является медицинским назначением.</p><p>При аллергии или целиакии будущий подбор продуктов должен соблюдать жёсткие исключения.</p></div>
      <details><summary>Основания распределения</summary><dl className="meal-trace"><dt>Веса структуры</dt><dd>{selectedStructure.meals.map((meal) => `${meal.displayLabel}: ${meal.weight}`).join("; ")}</dd><dt>Округление</dt><dd>Энергия — целые ккал; КБЖУ — 0,1 г; половинные случаи — к ближайшему чётному.</dd><dt>Приём для сверки</dt><dd>{selectedStructure.meals.find((meal) => meal.mealId === plan.trace.reconciliationMealId)?.displayLabel}</dd><dt>Остатки: ккал / Б / Ж / У</dt><dd>{plan.trace.values.energyKcal.residual} / {gram(plan.trace.values.proteinG.residual)} / {gram(plan.trace.values.fatG.residual)} / {gram(plan.trace.values.carbohydrateG.residual)}</dd><dt>Исходный сценарий</dt><dd>{selectedDay.id} / {selectedScenario.id}</dd><dt>Raw ккал</dt><dd>{raw(plan.trace.values.energyKcal.raw)}</dd><dt>Rule IDs</dt><dd className="rule-list">{plan.trace.ruleIds.join(", ")}</dd></dl></details>
    </section>}
  </section>;
}
