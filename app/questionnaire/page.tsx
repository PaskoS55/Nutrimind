"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductHeader from "../components/ProductHeader";
import { QUESTIONNAIRE_SECTION_TITLES, runQuestionnairePipeline, type OrdinaryActivity, type QuestionnaireGoal } from "../../core/index";

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
    label: QUESTIONNAIRE_SECTION_TITLES[3], title: "Что нужно исключить в первую очередь?", intro: "Аллергии и медицинские ограничения проверяются до рейтинга продуктов.", question: "Ограничения", options: [
      { title: "Аллергии" }, { title: "Непереносимости" }, { title: "Целиакия", note: "Строгий безглютеновый режим" }, { title: "Нет известных ограничений" },
    ], safety: "Аллергены исключаются жёстко до подбора продуктов. При целиакии применяется строгий безглютеновый фильтр, а не обычное пищевое предпочтение.",
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
  const current = steps[step];
  const select = (index: number) =>
    setAnswers((previous) =>
      previous.map((value, i) => (i === step ? index : value)),
    );
  const fillDemo = () => { setAnswers([0, 0, 0, 3, 1, 2, 2, 1, 1]); setProfile({ ageGroup: "adult", guardianRole: "", ageYears: "28", sexForFormula: "male", heightCm: "189", weightKg: "86" }); setGoal("performance_recovery"); setSport({ sportType: "hockey", sportLevel: "professional", sessionsPerWeek: "5_6", typicalSessionMinutes: "90", doubleTrainingDays: false, dailyActivity: "" }); setConsent(true); };
  const switchToAthlete = () => {
    setAnswers((previous) => previous.map((value, index) => index === 0 ? 0 : value));
    setSport((previous) => ({ ...previous, dailyActivity: "" }));
    setStep(2);
    setProfileAnnouncement("Выбран профиль «Спортсмен». Открыты вопросы спортивной ветки.");
  };
  const submit = () => {
    const athlete = answers[0] === 0;
    const result = runQuestionnairePipeline({ selections: answers, userType: athlete ? "athlete" : "general_user", ageGroup: profile.ageGroup as "adult" | "minor", guardianRole: profile.guardianRole as "parent" | "legal_guardian" | "athlete_with_parent", goal, sportType: sport.sportType, sportLevel: sport.sportLevel as "professional" | "competitive" | "amateur", sessionsPerWeek: sport.sessionsPerWeek as "1_2" | "3_4" | "5_6" | "7_plus", typicalSessionMinutes: Number(sport.typicalSessionMinutes), doubleTrainingDays: sport.doubleTrainingDays, dailyActivity: sport.dailyActivity || undefined, ageYears: Number(profile.ageYears), sexForFormula: profile.sexForFormula as "female" | "male", heightCm: Number(profile.heightCm), weightKg: Number(profile.weightKg), informationalConsent: consent });
    if (result.status === "invalid_input") { setIssues(result.issues.filter((x) => x.severity === "error").map((x) => x.message)); setStep(1); return; }
    sessionStorage.setItem("nutrimind.phase2c2.result", JSON.stringify(result));
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
              onClick={() => setStep(index)}
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
          {step !== 1 && <fieldset className="answer-group">
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
                onClick={() => setStep((value) => Math.min(8, value + 1))}
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
