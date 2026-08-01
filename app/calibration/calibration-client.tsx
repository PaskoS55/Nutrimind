"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isCompatiblePhase2D1Payload, type Phase2D1Result } from "../../core/index";
import { createCalibrationJournal, deriveJournalStatus, elapsedCalendarDays, todayLocalDate } from "../../core/calibration/policy";
import { sourceFromPhase2D1 } from "../../core/calibration/source";
import { deleteActiveJournal, loadActiveJournal, saveActiveJournal, type JournalLoadResult } from "../../core/calibration/storage";
import { deriveCalibrationSummary } from "../../core/calibration/summary";
import { ADHERENCE_VALUES, ACTUAL_TRAINING_VALUES, ATYPICAL_CONTEXT_VALUES, CALIBRATION_ENTRY_SCHEMA, DAY_TYPES, RECOVERY_VALUES, SLEEP_VALUES, THREE_LEVEL_VALUES, TRAINING_QUALITY_VALUES, WEIGHT_CONDITIONS, WELLBEING_VALUES, type Adherence, type CalibrationEntry, type CalibrationJournal, type DayType } from "../../core/calibration/types";

const labels: Record<string, string> = {
  rest: "День отдыха", single_training: "Одна тренировка", double_training: "Две тренировки", other: "Другой день",
  fully: "Полностью", mostly: "В основном", partly: "Частично", not_followed: "Не следовал(а)", none: "Нет", single: "Одна", double: "Две", not_provided: "Не указано",
  morning_fasted: "Утром натощак", morning_not_fasted: "Утром не натощак", low: "Низко", normal: "Обычно", high: "Высоко",
  poor: "Плохо", fair: "Средне", good: "Хорошо", not_applicable: "Не применимо", illness: "Болезнь", travel: "Поездка", competition: "Соревнование", unusual_load: "Необычная нагрузка",
};

const privacyText = "Данные журнала хранятся только в браузере на этом устройстве и не отправляются на сервер. Очистка данных браузера удалит журнал.";
const safetyText = "Контекст здоровья или безопасности изменился. Наблюдение остановлено; автоматические выводы и корректировки не выполняются. Обратитесь к подходящему специалисту, если это необходимо.";

function readPhase2D1(): Phase2D1Result | null {
  try { const raw = sessionStorage.getItem("nutrimind.phase2d1.result"); if (!raw) return null; const parsed: unknown = JSON.parse(raw); return isCompatiblePhase2D1Payload(parsed) ? parsed : null; } catch { return null; }
}
const selectOptions = (values: readonly string[]) => values.map((value) => <option key={value} value={value}>{labels[value] ?? value}</option>);

export default function CalibrationClient() {
  const [loaded, setLoaded] = useState<JournalLoadResult | null>(null);
  const [sourceResult, setSourceResult] = useState<Phase2D1Result | null>(null);
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmSafety, setConfirmSafety] = useState(false);
  const today = todayLocalDate();
  const journal = loaded?.kind === "available" ? loaded.journal : null;
  const [date, setDate] = useState(today);
  const [dayType, setDayType] = useState<DayType>("other");
  const [adherence, setAdherence] = useState<Adherence>("mostly");
  const [optional, setOptional] = useState<Record<string, string>>({});
  const [weight, setWeight] = useState("");

  function hydrateForm(target: CalibrationJournal, targetDate: string) {
    const existing = target.entries.find((entry) => entry.date === targetDate);
    setDayType(existing?.dayType ?? target.source.availableDayTypes[0] ?? "other");
    setAdherence(existing?.adherence ?? "mostly");
    setWeight(existing?.bodyWeightKg?.toString() ?? "");
    setOptional(existing ? Object.fromEntries(Object.entries(existing).filter(([key]) => !["schemaVersion", "date", "dayType", "adherence", "bodyWeightKg"].includes(key)).map(([key, value]) => [key, String(value)])) : {});
  }
  useEffect(() => { void loadActiveJournal(today).then((result) => {
    setLoaded(result); setSourceResult(readPhase2D1());
    if (result.kind === "available") { const initialDate = today > result.journal.endDate ? result.journal.endDate : today; setDate(initialDate); hydrateForm(result.journal, initialDate); }
  }); }, [today]);
  const summary = useMemo(() => journal ? deriveCalibrationSummary(journal, today) : null, [journal, today]);

  async function startJournal() {
    const source = sourceResult ? sourceFromPhase2D1(sourceResult) : null;
    if (!source || !consent) return;
    try {
      const nowIso = new Date().toISOString();
      const created = createCalibrationJournal(source, { journalId: crypto.randomUUID(), startDate: today, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "local", nowIso });
      await saveActiveJournal(created, today); setLoaded({ kind: "available", journal: created }); setDate(today); hydrateForm(created, today); setMessage("Журнал создан на этом устройстве.");
    } catch { setMessage("Не удалось создать журнал. Проверьте доступность хранилища браузера."); }
  }

  async function saveEntry() {
    if (!journal || journal.status === "safety_context_changed") return;
    const numericWeight = weight.trim() ? Number(weight.replace(",", ".")) : undefined;
    if (numericWeight !== undefined && (!Number.isFinite(numericWeight) || numericWeight < 10 || numericWeight > 500)) { setMessage("Вес должен быть конечным числом от 10 до 500 кг."); return; }
    const entry: CalibrationEntry = { schemaVersion: CALIBRATION_ENTRY_SCHEMA, date, dayType, adherence, ...Object.fromEntries(Object.entries(optional).filter(([, value]) => value)) };
    if (numericWeight !== undefined) entry.bodyWeightKg = numericWeight;
    const entries = [...journal.entries.filter((item) => item.date !== date), entry].sort((a, b) => a.date.localeCompare(b.date));
    const nextBase = { ...journal, entries, updatedAt: new Date().toISOString() };
    const next = { ...nextBase, status: deriveJournalStatus(nextBase, today) };
    try { await saveActiveJournal(next, today); setLoaded({ kind: "available", journal: next }); setMessage("Запись за выбранную дату сохранена."); } catch { setMessage("Запись не сохранена. Данные в форме оставлены без изменений."); }
  }

  async function stopForSafety() {
    if (!journal) return;
    const next: CalibrationJournal = { ...journal, status: "safety_context_changed", updatedAt: new Date().toISOString() };
    try { await saveActiveJournal(next, today); setLoaded({ kind: "available", journal: next }); setConfirmSafety(false); setMessage("Наблюдение остановлено."); } catch { setMessage("Не удалось сохранить остановку наблюдения."); }
  }

  async function clearJournal() { try { await deleteActiveJournal(); setLoaded({ kind: "empty" }); setConsent(false); setMessage("Локальный журнал удалён."); } catch { setMessage("Не удалось удалить локальный журнал."); } }

  if (!loaded) return <section className="calibration-shell"><p>Загрузка локального журнала…</p></section>;
  if (loaded.kind === "corrupt") return <StateCard title="Журнал повреждён" text="Формат локальных данных не прошёл строгую проверку. Они не используются и не мигрируются автоматически."><button onClick={clearJournal}>Сбросить повреждённые данные</button></StateCard>;
  if (loaded.kind === "unavailable") return <StateCard title="Локальное хранилище недоступно" text="Журнал не может работать без IndexedDB. Данные не отправлены на сервер."><Link href="/">Вернуться на главную</Link></StateCard>;
  if (loaded.kind === "expired") return <StateCard title="Срок журнала истёк" text="Истёкшие данные больше не доступны для наблюдения или выводов."><button onClick={clearJournal}>Удалить истёкший журнал</button></StateCard>;
  if (!journal) {
    const source = sourceResult ? sourceFromPhase2D1(sourceResult) : null;
    return <section className="calibration-shell"><p className="eyebrow">Phase 2D2A · наблюдение</p><h1>14-дневный калибровочный журнал</h1><p>Это журнал наблюдений. Он не меняет расчёт энергии, КБЖУ или гидратации, не ставит диагнозы и не формирует рекомендации.</p><div className="privacy-card"><strong>Хранение на устройстве</strong><p>{privacyText}</p></div>{source ? <><label className="consent-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> Я понимаю и согласен(на) хранить журнал локально на этом устройстве.</label><button className="continue-button" disabled={!consent} onClick={startJournal}>Начать наблюдение</button></> : <div className="state-card"><h2>Сначала нужен рассчитанный результат</h2><p>Новый журнал можно начать только после успешного расчёта Phase 2D1 в текущей сессии.</p><Link className="continue-button" href="/questionnaire">Пройти анкету →</Link></div>}<p className="form-message" aria-live="polite">{message}</p></section>;
  }

  const frozen = journal.status === "safety_context_changed";
  return <section className="calibration-shell"><p className="eyebrow">Phase 2D2A · только наблюдение</p><h1>Калибровочный журнал</h1><div className="journal-meta"><span>День {Math.max(1, elapsedCalendarDays(journal.startDate, today))} из 14</span><span>{journal.startDate} — {journal.endDate}</span><span>{summary?.loggedDays ?? 0} записей</span></div><p className="privacy-reminder">{privacyText}</p>
    {frozen ? <div className="safety-stop" role="alert"><h2>Наблюдение остановлено</h2><p>{safetyText}</p></div> : <div className="journal-layout"><form className="calibration-form" onSubmit={(event) => { event.preventDefault(); void saveEntry(); }}><h2>Запись дня</h2><div className="field-grid"><label>Дата<input required type="date" min={journal.startDate} max={today < journal.endDate ? today : journal.endDate} value={date} onChange={(event) => setDate(event.target.value)} /></label><label>Тип дня<select required value={dayType} onChange={(event) => setDayType(event.target.value as DayType)}>{selectOptions(DAY_TYPES)}</select></label><label>Следование выбранному сценарию<select required value={adherence} onChange={(event) => setAdherence(event.target.value as Adherence)}>{selectOptions(ADHERENCE_VALUES)}</select></label><OptionalSelect label="Фактическая тренировка" name="actualTraining" values={ACTUAL_TRAINING_VALUES} state={optional} setState={setOptional} /><label>Вес, кг (необязательно)<input inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="Например, 72,4" /></label><OptionalSelect label="Условия взвешивания" name="weightCondition" values={WEIGHT_CONDITIONS} state={optional} setState={setOptional} /><OptionalSelect label="Голод" name="hunger" values={THREE_LEVEL_VALUES} state={optional} setState={setOptional} /><OptionalSelect label="Энергия" name="energy" values={THREE_LEVEL_VALUES} state={optional} setState={setOptional} /><OptionalSelect label="Сон" name="sleep" values={SLEEP_VALUES} state={optional} setState={setOptional} /><OptionalSelect label="Восстановление" name="recovery" values={RECOVERY_VALUES} state={optional} setState={setOptional} /><OptionalSelect label="Качество тренировки" name="trainingQuality" values={TRAINING_QUALITY_VALUES} state={optional} setState={setOptional} /><OptionalSelect label="Общее самочувствие" name="overallWellbeing" values={WELLBEING_VALUES} state={optional} setState={setOptional} /><OptionalSelect label="Нетипичный контекст" name="atypicalContext" values={ATYPICAL_CONTEXT_VALUES} state={optional} setState={setOptional} /></div><button className="continue-button" type="submit">Сохранить запись</button><p className="form-message" aria-live="polite">{message}</p></form><SummaryPanel summary={summary!} /></div>}
    <div className="journal-actions"><button className="danger-link" onClick={() => setConfirmSafety(true)} disabled={frozen}>Изменился контекст здоровья или безопасности</button><button className="danger-link" onClick={clearJournal}>Удалить локальный журнал</button></div>{confirmSafety && <div className="confirmation-card" role="dialog" aria-modal="true"><h2>Остановить наблюдение?</h2><p>{safetyText}</p><button onClick={stopForSafety}>Да, остановить</button><button onClick={() => setConfirmSafety(false)}>Отмена</button></div>}
  </section>;
}

function OptionalSelect({ label, name, values, state, setState }: { label: string; name: string; values: readonly string[]; state: Record<string, string>; setState: (value: Record<string, string>) => void }) { return <label>{label}<select value={state[name] ?? "not_provided"} onChange={(event) => setState({ ...state, [name]: event.target.value })}>{selectOptions(values)}</select></label>; }
function StateCard({ title, text, children }: { title: string; text: string; children: React.ReactNode }) { return <section className="calibration-shell"><div className="state-card"><h1>{title}</h1><p>{text}</p>{children}</div></section>; }
function SummaryPanel({ summary }: { summary: ReturnType<typeof deriveCalibrationSummary> }) { return <aside className="calibration-summary"><p className="eyebrow">Сводка наблюдений</p><h2>{summary.status === "observation_complete" ? "Наблюдение завершено" : summary.status === "insufficient_data" ? "Недостаточно данных" : "Сбор продолжается"}</h2><dl><dt>Прошло дней</dt><dd>{summary.elapsedDays}</dd><dt>Заполнено</dt><dd>{summary.loggedDays}</dd><dt>Пропущенные даты</dt><dd>{summary.missingDates.length ? summary.missingDates.join(", ") : "Нет"}</dd><dt>Записей веса</dt><dd>{summary.weights.length}</dd><dt>Нетипичный контекст</dt><dd>{summary.atypicalContextDays}</dd></dl><p>Сводка описывает записи нейтрально: без тренда, интерпретации причин и автоматических корректировок.</p></aside>; }
