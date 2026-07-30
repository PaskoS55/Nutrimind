"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import ProductHeader from "../components/ProductHeader";

const tabs = [
  "Обзор",
  "Потребности",
  "Продукты и замены",
  "Рацион на день",
  "Основания",
];
const priorities = [
  [
    "01",
    "Приём пищи после вечерней тренировки",
    "Полноценный приём пищи в демо-профиле отмечен позже 90 минут после нагрузки.",
    "Наблюдение из анкеты",
  ],
  [
    "02",
    "Распределение источников белка",
    "Белковый продукт отмечен два раза в день при высокой тренировочной нагрузке.",
    "Демо-правило приоритета",
  ],
  [
    "03",
    "Проверка питьевого режима",
    "Указаны 1,5–2 л напитков и выраженное потоотделение; требуется наблюдение.",
    "Данные демо-профиля",
  ],
];

export default function DemoReport() {
  const [tab, setTab] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectTab = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    setTab(next);
    tabRefs.current[next]?.focus();
  };
  return (
    <main className="report-page">
      <ProductHeader>
        <div className="header-actions">
          <span className="demo-pill">Демонстрационный расчёт</span>
          <Link className="edit-link" href="/questionnaire">
            Изменить ответы
          </Link>
        </div>
      </ProductHeader>
      <div className="report-shell">
        <section className="report-hero">
          <div>
            <p className="eyebrow">Персональный отчёт · пример спортсмена</p>
            <h1>
              План восстановления и<br />
              стабильной энергии.
            </h1>
            <p>
              Это прозрачная демонстрация правил NutriMind, а не медицинское
              заключение и не рекомендация реальному человеку.
            </p>
          </div>
          <div className="athlete-tags">
            <span>хоккей</span>
            <span>профессиональный уровень</span>
            <span>5–6 тренировок/нед.</span>
          </div>
        </section>
        <div className="filter-strip">
          <b>Фильтры безопасности</b>
          <span>Аллергии: арахис</span>
          <span>Непереносимости: лактоза</span>
          <small>Применены до продуктов, замен и меню</small>
        </div>
        <nav className="report-tabs" role="tablist" aria-label="Разделы отчёта">
          {tabs.map((item, index) => (
            <button
              key={item}
              role="tab"
              aria-selected={tab === index}
              tabIndex={tab === index ? 0 : -1}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              onClick={() => setTab(index)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") selectTab(index + 1);
                if (event.key === "ArrowLeft") selectTab(index - 1);
                if (event.key === "Home") selectTab(0);
                if (event.key === "End") selectTab(tabs.length - 1);
              }}
            >
              {item}
            </button>
          ))}
        </nav>

        {tab === 0 ? (
          <>
            <section className="overview-grid">
              <article className="summary-card">
                <p className="eyebrow">Краткий вывод</p>
                <h2>
                  Нагрузка высокая, а питание после тренировки и гидратация пока
                  не успевают за ней.
                </h2>
                <p>
                  Первое действие — не «идеальная диета», а заранее
                  подготовленный приём пищи после вечерней тренировки и более
                  системный питьевой режим.
                </p>
              </article>
              <article className="metric-card">
                <div>
                  <span>Энергия</span>
                  <b>
                    3550–4050 <small>ккал</small>
                  </b>
                </div>
                <div>
                  <span>Белок</span>
                  <b>
                    155–172 <small>г</small>
                  </b>
                </div>
                <div>
                  <span>Напитки</span>
                  <b>
                    1,5–2,0 <small>л</small>
                  </b>
                </div>
                <p>
                  Демонстрационные значения из `data/demo-report.json`, не
                  индивидуальное назначение.
                </p>
              </article>
            </section>
            <section className="priority-section">
              <div className="section-title">
                <div>
                  <p className="eyebrow">Главные пищевые приоритеты</p>
                  <h2>Что изменить в первую очередь</h2>
                </div>
                <span>Каждая карточка показывает источник основания</span>
              </div>
              <div className="priority-list">
                {priorities.map(([n, title, text, source]) => (
                  <article key={n}>
                    <span className="priority-number">{n}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                    <small>{source}</small>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="tab-placeholder" role="tabpanel">
            <p className="eyebrow">{tabs[tab]}</p>
            <h2>Раздел демонстрационного отчёта</h2>
            <p>
              Этот экран показывает структуру будущего продукта. Он не запускает
              незавершённые расчёты и не формирует рекомендации для посетителя.
            </p>
          </section>
        )}
        <section className="report-notice">
          <b>Важно</b>
          <p>
            Арахис и связанные ингредиенты исключаются до рейтинга продуктов.
            При целиакии применяется строгий безглютеновый режим. NutriMind не
            ставит диагнозы и не подтверждает дефициты без числовых анализов.
          </p>
        </section>
      </div>
      <footer className="brand-footer">
        <span>ИНТЕЛЛЕКТ. ПИТАНИЕ. РЕЗУЛЬТАТ.</span>
        <p>
          Все значения на этой странице относятся только к вымышленному
          демонстрационному профилю.
        </p>
      </footer>
    </main>
  );
}
