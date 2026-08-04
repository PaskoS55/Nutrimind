"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProductHeader from "../components/ProductHeader";
import { ALLERGEN_TAXONOMY, KNOWN_ALLERGEN_VALIDATION_MESSAGE, PRESENTATION_GROUPS, RESTRICTION_STORAGE_KEY, changeQuestionnaireAllergyStatus, isRestrictionContextV1, normalizeCurrentMealPattern, normalizeRestrictionContext, QUESTIONNAIRE_SECTION_TITLES, runPhase3A, runQuestionnairePipeline, validateQuestionnaireAllergenSelection, type FoodAllergenCode, type OrdinaryActivity, type QuestionnaireGoal, type RawCeliacStatus, type RawDietaryPattern, type RawFoodAllergyStatus } from "../../core/index";
import { normalizeTrainingTimeContext } from "../../core/meal-timing/context-schema";
import { PHASE3A2_CONTEXT_STORAGE_KEY } from "../../core/meal-timing/types";

type Option = { title: string; note?: string; value?: string };
type Step = {
  label: string;
  title: string;
  intro: string;
  question: string;
  options: Option[];
  safety?: string;
};

const steps: Step[] = [
  {
    label: QUESTIONNAIRE_SECTION_TITLES[0],
    title: "Для кого мы создаём план?",
    intro: "Первый выбор определяет дальнейшую ветку вопросов.",
    question: "Ваш профиль",
    options: [
      { title: "Спортсмен", note: "Профессиональный, соревновательный или любительский уровень" },
      {
        title: "Обычный пользователь",
        note: "Здоровье и повседневное питание",
      },
    ],
    safety:
      "Для несовершеннолетних NutriMind не предлагает агрессивное снижение калорийности, не показывает числовой КБЖУ и напоминает о сопровождении педиатра или спортивного диетолога.",
  },
  {
    label: QUESTIONNAIRE_SECTION_TITLES[1], title: "Основные параметры", intro: "Эти значения используются в утверждённой формуле REE.", question: "Исходные данные", options: [],
  },
  {
    label: QUESTIONNAIRE_SECTION_TITLES[2],
    title: "Спорт и цель",
    intro: "Выберите основной ориентир и заполните свою ветку нагрузки.",
    question: "Главная цель",
    options: [
      { value: "weight_loss", title: "Снизить вес", note: "Постепенно уменьшить массу тела" },
      { value: "maintenance", title: "Поддерживать вес и форму", note: "Сохранить текущую массу и устойчивый режим" },
      { value: "muscle_gain", title: "Набрать мышечную массу", note: "Поддержать рост мышц и силы" },
      { value: "performance_recovery", title: "Улучшить результативность и восстановление", note: "Поддержать тренировки, работоспособность и восстановление" },
      { value: "habits_wellbeing", title: "Улучшить питание и самочувствие", note: "Выстроить более регулярный и устойчивый рацион" },
    ],
    safety: "Выбранная цель не изменяет расчётный стартовый ориентир на этапе Phase 2C1. Автоматический дефицит или профицит не применяется; КБЖУ будет подключён позже.",
  },
  {
    label: QUESTIONNAIRE_SECTION_TITLES[3], title: "Что нужно исключить в первую очередь?", intro: "Аллергии и медицинские ограничения проверяются до рейтинга продуктов.", question: "Безопасность", options: [], safety: "На этом этапе каталог продуктов ещё не реализован. Ответы сохраняются только в этой вкладке и не подтверждают диагноз или безопасность конкретного продукта.",
  },
  {
    label: QUESTIONNAIRE_SECTION_TITLES[4],
    title: "Как выглядит ваш обычный день?",
    intro: "Нас интересует текущая структура питания, а не идеальный день.",
    question: "Основные приёмы пищи",
    options: [
      { title: "1–2 раза в день" },
      { title: "3 раза в день" },
      { title: "4 и более" },
    ],
  },
  {
    label: QUESTIONNAIRE_SECTION_TITLES[5],
    title: "Когда проходит тренировка?",
    intro: "Это помогает понять доступность питания до и после нагрузки.",
    question: "Обычное время",
    options: [{ title: "Утром" }, { title: "Днём" }, { title: "Вечером" }],
  },
  {
    label: QUESTIONNAIRE_SECTION_TITLES[6],
    title: "Как меняется энергия в течение дня?",
    intro: "Это наблюдение, а не медицинская диагностика.",
    question: "Уровень энергии",
    options: [
      { title: "Стабильный" },
      { title: "Иногда снижается" },
      { title: "Есть заметные спады" },
    ],
  },
  {
    label: QUESTIONNAIRE_SECTION_TITLES[7],
    title: "Сколько напитков вы обычно пьёте?",
    intro: "Укажите привычный ориентир без попытки посчитать воду из пищи.",
    question: "Напитки в день",
    options: [
      { title: "До 1,5 л" },
      { title: "1,5–2 л" },
      { title: "Более 2 л" },
    ],
  },
  {
    label: QUESTIONNAIRE_SECTION_TITLES[8],
    title: "Последняя проверка перед отчётом",
    intro:
      "Лабораторные данные учитываются только при наличии числовых результатов.",
    question: "Актуальные анализы",
    options: [
      { title: "Есть числовые результаты" },
      { title: "Нет свежих анализов" },
    ],
    safety:
      "NutriMind не ставит диагнозы и не подтверждает дефициты без соответствующих числовых анализов. Результат носит информационный характер.",
  },
];

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(9).fill(0));
  const [profile, setProfile] = useState({ ageGroup: "adult", guardianRole: "", ageYears: "", sexForFormula: "", heightCm: "", weightKg: "" });
  const [goal, setGoal] = useState<QuestionnaireGoal>("maintenance");
  const [sport, setSport] = useState({ sportType: "hockey", sportLevel: "amateur", sessionsPerWeek: "3_4", typicalSessionMinutes: "60", doubleTrainingDays: false, dailyActivity: "" as OrdinaryActivity | "" });
  const [profileAnnouncement, setProfileAnnouncement] = useState("");
  const [consent, setConsent] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [foodAllergyStatus, setFoodAllergyStatus] = useState<RawFoodAllergyStatus | "">("");
  const [foodAllergenCodes, setFoodAllergenCodes] = useState<FoodAllergenCode[]>([]);
  const [allergenValidationError, setAllergenValidationError] = useState<string | null>(null);
  const allergenFieldsetRef = useRef<HTMLFieldSetElement>(null);
  const [celiacStatus, setCeliacStatus] = useState<RawCeliacStatus | "">("");
  const [dietaryPattern, setDietaryPattern] = useState<RawDietaryPattern | "">("");
  const current = steps[step];
  const setAllergenValidation = (message: string | null) => {
    setAllergenValidationError(message);
    if (message === null) setIssues((previous) => previous.filter((item) => item !== KNOWN_ALLERGEN_VALIDATION_MESSAGE));
  };
  useEffect(() => {
    if (step === 3 && allergenValidationError) allergenFieldsetRef.current?.focus();
  }, [allergenValidationError, step]);
  const canLeaveRestrictionStep = () => {
    const message = validateQuestionnaireAllergenSelection(foodAllergyStatus, foodAllergenCodes);
    setAllergenValidation(message);
    return message === null;
  };
  const goToStep = (nextStep: number) => {
    if (nextStep > 3 && !canLeaveRestrictionStep()) {
      setStep(3);
      return;
    }
    setStep(nextStep);
  };
  const select = (index: number) =>
    setAnswers((previous) =>
      previous.map((value, i) => (i === step ? index : value)),
    );
  const fillDemo = () => { setAnswers([0, 0, 0, 3, 1, 2, 2, 1, 1]); setProfile({ ageGroup: "adult", guardianRole: "", ageYears: "28", sexForFormula: "male", heightCm: "189", weightKg: "86" }); setGoal("performance_recovery"); setSport({ sportType: "hockey", sportLevel: "professional", sessionsPerWeek: "5_6", typicalSessionMinutes: "90", doubleTrainingDays: false, dailyActivity: "" }); setFoodAllergyStatus("none"); setFoodAllergenCodes([]); setCeliacStatus("no"); setDietaryPattern("omnivore"); setConsent(true); };
  const switchToAthlete = () => {
    setAnswers((previous) => previous.map((value, index) => index === 0 ? 0 : value));
    setSport((previous) => ({ ...previous, dailyActivity: "" }));
    setStep(2);
    setProfileAnnouncement("Выбран профиль «Спортсмен». Открыты вопросы спортивной ветки.");
  };
  const submit = () => {
    sessionStorage.removeItem(RESTRICTION_STORAGE_KEY);
    const restrictionContext = normalizeRestrictionContext({ foodAllergyStatus, foodAllergenCodes, celiacStatus, dietaryPattern });
    if (!isRestrictionContextV1(restrictionContext) || ["not_provided", "unsupported", "malformed"].includes(restrictionContext.status)) {
      const messages: string[] = [];
      if (!foodAllergyStatus) messages.push("Выберите статус пищевой аллергии.");
      if (foodAllergyStatus === "known" && foodAllergenCodes.length === 0) {
        messages.push(KNOWN_ALLERGEN_VALIDATION_MESSAGE);
        setAllergenValidationError(KNOWN_ALLERGEN_VALIDATION_MESSAGE);
      }
      if (!celiacStatus) messages.push("Выберите ответ о целиакии.");
      if (!dietaryPattern) messages.push("Выберите текущий тип питания.");
      setIssues(messages.length ? messages : ["Проверьте ответы разделов «Безопасность» и «Текущее питание»."]);
      setStep(!foodAllergyStatus || !celiacStatus || (foodAllergyStatus === "known" && foodAllergenCodes.length === 0) ? 3 : 4);
      return;
    }
    const athlete = answers[0] === 0;
    const result = runQuestionnairePipeline({ selections: answers, userType: athlete ? "athlete" : "general_user", ageGroup: profile.ageGroup as "adult" | "minor", guardianRole: profile.guardianRole as "parent" | "legal_guardian" | "athlete_with_parent", goal, sportType: sport.sportType, sportLevel: sport.sportLevel as "professional" | "competitive" | "amateur", sessionsPerWeek: sport.sessionsPerWeek as "1_2" | "3_4" | "5_6" | "7_plus", typicalSessionMinutes: Number(sport.typicalSessionMinutes), doubleTrainingDays: sport.doubleTrainingDays, dailyActivity: sport.dailyActivity || undefined, ageYears: Number(profile.ageYears), sexForFormula: profile.sexForFormula as "female" | "male", heightCm: Number(profile.heightCm), weightKg: Number(profile.weightKg), informationalConsent: consent, foodAllergyStatus: foodAllergyStatus as RawFoodAllergyStatus, foodAllergenCodes, celiacStatus: celiacStatus as RawCeliacStatus, dietaryPattern: dietaryPattern as RawDietaryPattern });
    if (result.status === "invalid_input") { setIssues(result.issues.filter((x) => x.severity === "error").map((x) => x.message)); setStep(1); return; }
    const phase3a = runPhase3A(result, normalizeCurrentMealPattern(answers[4]));
    sessionStorage.setItem("nutrimind.phase2d1.result", JSON.stringify(result));
    sessionStorage.setItem("nutrimind.phase3a.result", JSON.stringify(phase3a));
    sessionStorage.setItem(PHASE3A2_CONTEXT_STORAGE_KEY, JSON.stringify(normalizeTrainingTimeContext(answers[5])));
    sessionStorage.setItem(RESTRICTION_STORAGE_KEY, JSON.stringify(restrictionContext));
    router.push("/result");
  };

  return (
    <main className="app-shell">
      <ProductHeader>
        <div className="header-actions">
          <button className="quiet-action" onClick={fillDemo}>
            Заполнить пример спортсмена
          </button>
          <Link className="save-action" href="/">
            На главную
          </Link>
        </div>
      </ProductHeader>
      <div className="progress-line">
        <span style={{ width: `${((step + 1) / 9) * 100}%` }} />
      </div>

      <div className="questionnaire-layout">
        <aside className="step-list" aria-label="Разделы анкеты">
          {steps.map((item, index) => (
            <button
              key={item.label}
              className={index === step ? "active" : ""}
              onClick={() => goToStep(index)}
              aria-current={index === step ? "step" : undefined}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.label}
            </button>
          ))}
        </aside>

        <section className="question-panel" aria-labelledby="question-title">
          <div className="question-meta">
            <p className="eyebrow">
              Раздел {step + 1} · {current.label}
            </p>
            <span>{step + 1} / 9</span>
          </div>
          <h1 id="question-title">{current.title}</h1>
          <p className="question-intro">{current.intro}</p>
          <p className="sr-only" aria-live="polite">{profileAnnouncement}</p>
          {step === 0 && <div className="routing-guidance">Профиль «Спортсмен» подходит не только профессионалам. Выберите его, если регулярно тренируетесь 5 и более раз в неделю или хотите учитывать отдельные дни отдыха, одной тренировки и двойной нагрузки.</div>}
          {issues.length > 0 && <div className="safety-panel" role="alert"><span>!</span><div><b>Проверьте ответы</b><ul>{issues.map((item) => <li key={item}>{item}</li>)}</ul></div></div>}
          {step === 0 && <fieldset className="answer-group"><legend>Возрастная группа *</legend><div className="option-grid">{[["adult","Взрослый"],["minor","Несовершеннолетний"]].map(([value,title]) => <button key={value} type="button" role="radio" aria-checked={profile.ageGroup === value} className={`option-card ${profile.ageGroup === value ? "selected" : ""}`} onClick={() => setProfile({ ...profile, ageGroup: value })}><span className="check">{profile.ageGroup === value ? "✓" : "○"}</span><b>{title}</b></button>)}</div></fieldset>}
          {step === 1 && <div className="profile-fields">
            <label>Возраст, полных лет *<input type="number" min="1" max="120" value={profile.ageYears} onChange={(e) => setProfile({ ...profile, ageYears: e.target.value })} /></label>
            <label>Категория для расчётной формулы *<select value={profile.sexForFormula} onChange={(e) => setProfile({ ...profile, sexForFormula: e.target.value })}><option value="">Выберите</option><option value="male">Мужской пол</option><option value="female">Женский пол</option></select></label>
            <label>Рост, см *<input type="number" min="50" max="250" value={profile.heightCm} onChange={(e) => setProfile({ ...profile, heightCm: e.target.value })} /></label>
            <label>Масса тела, кг *<input type="number" min="10" max="500" step="0.1" value={profile.weightKg} onChange={(e) => setProfile({ ...profile, weightKg: e.target.value })} /></label>
            {profile.ageGroup === "minor" && <label>Кто заполняет анкету? *<select value={profile.guardianRole} onChange={(e) => setProfile({ ...profile, guardianRole: e.target.value })}><option value="">Выберите</option><option value="parent">Родитель</option><option value="legal_guardian">Законный представитель</option><option value="athlete_with_parent">Спортсмен вместе с родителем</option></select></label>}
          </div>}
          {step === 2 && <div className="profile-fields">{answers[0] === 0 ? <>
            <label>Вид спорта *<select value={sport.sportType} onChange={(e) => setSport({ ...sport, sportType: e.target.value })}><option value="hockey">Хоккей</option><option value="volleyball">Волейбол</option><option value="football">Футбол</option><option value="combat">Единоборства</option><option value="endurance">Выносливость</option><option value="strength">Силовой спорт</option><option value="other">Другое</option></select></label>
            <label>Уровень *<select value={sport.sportLevel} onChange={(e) => setSport({ ...sport, sportLevel: e.target.value })}><option value="professional">Профессиональный</option><option value="competitive">Соревновательный</option><option value="amateur">Любительский</option></select></label>
            <label>Тренировок в неделю *<select value={sport.sessionsPerWeek} onChange={(e) => setSport({ ...sport, sessionsPerWeek: e.target.value })}><option value="1_2">1–2</option><option value="3_4">3–4</option><option value="5_6">5–6</option><option value="7_plus">7 и более</option></select></label>
            <label>Обычная длительность тренировки, мин *<input type="number" min="1" value={sport.typicalSessionMinutes} onChange={(e) => setSport({ ...sport, typicalSessionMinutes: e.target.value })} /></label>
            <label className="consent-row"><input type="checkbox" checked={sport.doubleTrainingDays} onChange={(e) => setSport({ ...sport, doubleTrainingDays: e.target.checked })} /> Бывают две тренировки в день?</label>
          </> : <div className="ordinary-activity"><fieldset className="answer-group"><legend>Повседневная активность *</legend><div className="option-grid">{[
            ["mostly_sitting", "Преимущественно сижу", "Большая часть дня проходит сидя, регулярного движения немного."],
            ["lots_of_walking", "Много хожу", "Регулярно хожу пешком и часто нахожусь в движении."],
            ["physically_active_work", "Физически активная работа", "Работа или повседневные дела включают продолжительную физическую активность."],
            ["fitness_2_4_week", "Фитнес 2–4 раза в неделю", "Регулярно тренируюсь, но не использую спортивную ветку анкеты."],
          ].map(([value, title, note]) => <button key={value} type="button" role="radio" aria-checked={sport.dailyActivity === value} className={`option-card ${sport.dailyActivity === value ? "selected" : ""}`} onClick={() => setSport({ ...sport, dailyActivity: value as OrdinaryActivity })}><span className="check">{sport.dailyActivity === value ? "✓" : "○"}</span><span><b>{title}</b><small>{note}</small></span></button>)}</div></fieldset><div className="routing-guidance">Тренируетесь 5 и более раз в неделю? Для более точного сценария выберите профиль «Спортсмен» — в нём доступен и любительский уровень.<button type="button" className="back-button" onClick={switchToAthlete}>Перейти к профилю «Спортсмен»</button></div></div>}</div>}
          {step === 3 && <div className="restriction-fields">
            <fieldset className="answer-group"><legend>Есть ли пищевые аллергены, которые вам необходимо исключать? *</legend><div className="option-grid">{[
              ["none", "Нет известных пищевых аллергий"], ["known", "Да, укажу аллергены"], ["other", "Другой аллерген"], ["not_sure", "Не уверен(а), какой именно"], ["prefer_not_to_say", "Предпочитаю не указывать"],
            ].map(([value, title]) => <button type="button" role="radio" aria-checked={foodAllergyStatus === value} className={`option-card ${foodAllergyStatus === value ? "selected" : ""}`} onClick={() => { const next = changeQuestionnaireAllergyStatus(value as RawFoodAllergyStatus, foodAllergenCodes); setFoodAllergyStatus(next.foodAllergyStatus); setFoodAllergenCodes(next.foodAllergenCodes); setAllergenValidation(next.validationMessage); }} key={value}><span className="check">{foodAllergyStatus === value ? "✓" : "○"}</span><b>{title}</b></button>)}</div></fieldset>
            {foodAllergyStatus === "known" && <fieldset ref={allergenFieldsetRef} tabIndex={-1} className="allergen-picker" aria-invalid={allergenValidationError ? "true" : undefined} aria-describedby={allergenValidationError ? "allergen-validation-error" : undefined}><legend>Какие пищевые аллергены вам необходимо исключать? Можно выбрать несколько. *</legend>{PRESENTATION_GROUPS.map((group) => <div className="allergen-group" key={group.id}><h3>{group.label}</h3>{group.allergenCodes.map((code) => { const entry = ALLERGEN_TAXONOMY.find((item) => item.code === code)!; return <label className="allergen-option" key={code}><input type="checkbox" checked={foodAllergenCodes.includes(code)} onChange={(event) => setFoodAllergenCodes((previous) => { const next = event.target.checked ? [...previous, code] : previous.filter((item) => item !== code); setAllergenValidation(validateQuestionnaireAllergenSelection("known", next)); return next; })} /><span>{entry.label}</span></label>; })}</div>)}{allergenValidationError && <p id="allergen-validation-error" className="field-error" role="alert">{allergenValidationError}</p>}</fieldset>}
            <fieldset className="answer-group"><legend>Указывали ли вам ранее, что у вас целиакия? *</legend><div className="option-grid">{[["no","Нет"],["confirmed","Да"],["not_sure","Не уверен(а)"],["prefer_not_to_say","Предпочитаю не указывать"]].map(([value,title]) => <button type="button" role="radio" aria-checked={celiacStatus === value} className={`option-card ${celiacStatus === value ? "selected" : ""}`} onClick={() => setCeliacStatus(value as RawCeliacStatus)} key={value}><span className="check">{celiacStatus === value ? "✓" : "○"}</span><b>{title}</b></button>)}</div><p className="field-note">Ответ используется только для ограничения доступности примеров и не является подтверждением диагноза.</p></fieldset>
          </div>}
          {step === 4 && <div className="restriction-fields"><fieldset className="answer-group"><legend>Какой вариант лучше всего описывает ваш текущий тип питания? *</legend><div className="option-grid">{[
            ["omnivore","Ем продукты растительного и животного происхождения"], ["vegetarian","Не ем мясо, птицу, рыбу и морепродукты; могу употреблять яйца и молочные продукты"], ["vegan","Не употребляю продукты животного происхождения"], ["pescatarian","Не ем мясо и птицу; употребляю рыбу или морепродукты"], ["other","Другой тип питания"], ["not_sure","Не уверен(а), какой вариант подходит"], ["prefer_not_to_say","Предпочитаю не указывать"],
          ].map(([value,title]) => <button type="button" role="radio" aria-checked={dietaryPattern === value} className={`option-card ${dietaryPattern === value ? "selected" : ""}`} onClick={() => setDietaryPattern(value as RawDietaryPattern)} key={value}><span className="check">{dietaryPattern === value ? "✓" : "○"}</span><b>{title}</b></button>)}</div><p className="field-note">Тип питания не является диагнозом и не подтверждает полноценность рациона.</p></fieldset><fieldset className="answer-group"><legend>{current.question} *</legend><div className="option-grid">{current.options.map((option, index) => <button type="button" role="radio" aria-checked={answers[step] === index} className={`option-card ${answers[step] === index ? "selected" : ""}`} onClick={() => select(index)} key={option.title}><span className="check">{answers[step] === index ? "✓" : "○"}</span><span><b>{option.title}</b>{option.note && <small>{option.note}</small>}</span></button>)}</div></fieldset></div>}
          {step !== 1 && step !== 3 && step !== 4 && <fieldset className="answer-group">
            <legend>{current.question} *</legend>
            <div className="option-grid">
              {current.options.map((option, index) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={step === 2 ? goal === option.value : answers[step] === index}
                  className={`option-card ${(step === 2 ? goal === option.value : answers[step] === index) ? "selected" : ""}`}
                  onClick={() => step === 2 ? setGoal(option.value as QuestionnaireGoal) : select(index)}
                  key={option.title}
                >
                  <span className="check">
                    {(step === 2 ? goal === option.value : answers[step] === index) ? "✓" : "○"}
                  </span>
                  <span>
                    <b>{option.title}</b>
                    {option.note && <small>{option.note}</small>}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>}
          <div className="safety-panel">
            <span aria-hidden="true">i</span>
            <p>
              {current.safety ?? "Данные обрабатываются локально в браузере и не сохраняются в аккаунте или на сервере."}
            </p>
          </div>
          <div className="question-actions">
            <button
              className="back-button"
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              disabled={step === 0}
            >
              ← Назад
            </button>
            {step < 8 ? (
              <button
                className="continue-button"
                onClick={() => goToStep(Math.min(8, step + 1))}
              >
                Продолжить →
              </button>
            ) : (
              <div><label className="consent-row"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> Согласен на информационную обработку ответов *</label><button type="button" className="continue-button" onClick={submit}>Рассчитать доступный этап →</button></div>
            )}
          </div>
        </section>
      </div>
      <footer className="brand-footer">
        <span>ИНТЕЛЛЕКТ. ПИТАНИЕ. РЕЗУЛЬТАТ.</span>
        <p>
          Информационный сервис. Не заменяет консультацию врача или диетолога.
        </p>
      </footer>
    </main>
  );
}
