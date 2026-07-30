"use client";

import Link from "next/link";
import { useState } from "react";
import ProductHeader from "../components/ProductHeader";

type Option = { title: string; note?: string };
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
    label: "Профиль",
    title: "Для кого мы создаём план?",
    intro: "Первый выбор определяет дальнейшую ветку вопросов.",
    question: "Ваш профиль",
    options: [
      { title: "Спортсмен", note: "Тренировки и восстановление" },
      {
        title: "Обычный пользователь",
        note: "Здоровье и повседневное питание",
      },
    ],
    safety:
      "Для несовершеннолетних NutriMind не предлагает агрессивное снижение калорийности, не показывает числовой КБЖУ и напоминает о сопровождении педиатра или спортивного диетолога.",
  },
  {
    label: "Цели",
    title: "Какой результат для вас важнее?",
    intro: "Выберите основной ориентир. Его можно будет изменить позже.",
    question: "Главная цель",
    options: [
      { title: "Результативность и восстановление" },
      { title: "Поддержание формы" },
      { title: "Улучшение привычек" },
    ],
  },
  {
    label: "Рацион",
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
    label: "Нагрузка",
    title: "Как часто вы тренируетесь?",
    intro: "Достаточно общей частоты — без оценки бытовой активности и RPE.",
    question: "Тренировок в неделю",
    options: [
      { title: "1–2" },
      { title: "3–4" },
      { title: "5–6" },
      { title: "7 и более" },
    ],
  },
  {
    label: "Питание вокруг тренировок",
    title: "Когда проходит тренировка?",
    intro: "Это помогает понять доступность питания до и после нагрузки.",
    question: "Обычное время",
    options: [{ title: "Утром" }, { title: "Днём" }, { title: "Вечером" }],
  },
  {
    label: "Самочувствие",
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
    label: "Гидратация",
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
    label: "Ограничения",
    title: "Что нужно исключить в первую очередь?",
    intro:
      "Аллергии и медицинские ограничения проверяются до рейтинга продуктов.",
    question: "Ограничения",
    options: [
      { title: "Аллергии" },
      { title: "Непереносимости" },
      { title: "Целиакия", note: "Строгий безглютеновый режим" },
      { title: "Нет известных ограничений" },
    ],
    safety:
      "Аллергены исключаются жёстко до подбора продуктов. При целиакии применяется строгий безглютеновый фильтр, а не обычное пищевое предпочтение.",
  },
  {
    label: "Контекст",
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
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(9).fill(0));
  const current = steps[step];
  const select = (index: number) =>
    setAnswers((previous) =>
      previous.map((value, i) => (i === step ? index : value)),
    );
  const fillDemo = () => setAnswers([0, 0, 1, 2, 2, 2, 1, 0, 1]);

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
          <fieldset className="answer-group">
            <legend>{current.question} *</legend>
            <div className="option-grid">
              {current.options.map((option, index) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={answers[step] === index}
                  className={`option-card ${answers[step] === index ? "selected" : ""}`}
                  onClick={() => select(index)}
                  key={option.title}
                >
                  <span className="check">
                    {answers[step] === index ? "✓" : "○"}
                  </span>
                  <span>
                    <b>{option.title}</b>
                    {option.note && <small>{option.note}</small>}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="safety-panel">
            <span aria-hidden="true">i</span>
            <p>
              {current.safety ??
                "Ответ используется только для построения демонстрационного интерфейса. Данные не отправляются и не запускают расчёт."}
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
              <Link className="continue-button" href="/report-demo">
                Посмотреть демо-отчёт →
              </Link>
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
