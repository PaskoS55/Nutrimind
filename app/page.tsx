"use client";

import { useMemo, useState } from "react";

type View = "home" | "quiz" | "report" | "dashboard" | "coach" | "admin";

const Arrow = () => <span aria-hidden>↗</span>;
const Mark = () => <span className="mark" aria-hidden><i /><i /><i /></span>;

const navItems: { id: View; label: string }[] = [
  { id: "dashboard", label: "Обзор" },
  { id: "report", label: "Мой анализ" },
  { id: "coach", label: "Кабинет тренера" },
  { id: "admin", label: "Управление" },
];

const quizSteps = [
  {
    eyebrow: "Шаг 1 из 5 · О вас",
    title: "Начнём с главного",
    subtitle: "Эти данные помогут точно рассчитать ваши базовые потребности.",
    fields: ["Возраст", "Рост, см", "Вес, кг"],
  },
  {
    eyebrow: "Шаг 2 из 5 · Цели",
    title: "Чего вы хотите достичь?",
    subtitle: "Выберите главную цель — рекомендации будут адаптированы под неё.",
    options: ["Спортивная результативность", "Набор мышечной массы", "Снижение веса", "Поддержание здоровья"],
  },
  {
    eyebrow: "Шаг 3 из 5 · Нагрузка",
    title: "Как вы тренируетесь?",
    subtitle: "Учитываем не только частоту, но и характер вашей нагрузки.",
    options: ["Профессиональный спорт", "4–6 тренировок в неделю", "2–3 тренировки в неделю", "Низкая активность"],
  },
  {
    eyebrow: "Шаг 4 из 5 · Безопасность",
    title: "Что важно исключить?",
    subtitle: "Аллергии и ограничения имеют приоритет над любыми рекомендациями.",
    options: ["Лактоза", "Глютен", "Орехи", "Рыба и морепродукты", "Нет ограничений"],
  },
  {
    eyebrow: "Шаг 5 из 5 · Рацион",
    title: "Как вы питаетесь сейчас?",
    subtitle: "Последний шаг. Отметьте наиболее близкий вариант.",
    options: ["Регулярно, 4–5 приёмов пищи", "3 приёма пищи", "Нерегулярно", "Часто ем вне дома"],
  },
];

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [quizStep, setQuizStep] = useState(0);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [login, setLogin] = useState(false);

  const go = (next: View) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main>
      {view === "home" ? (
        <Landing onStart={() => go("quiz")} onLogin={() => setLogin(true)} onDemo={() => go("report")} />
      ) : view === "quiz" ? (
        <Quiz
          step={quizStep}
          selected={selected}
          setSelected={setSelected}
          onBack={() => quizStep ? setQuizStep(quizStep - 1) : go("home")}
          onNext={() => quizStep < 4 ? setQuizStep(quizStep + 1) : go("report")}
        />
      ) : (
        <AppShell view={view} go={go}>
          {view === "report" && <Report />}
          {view === "dashboard" && <Dashboard go={go} />}
          {view === "coach" && <Coach />}
          {view === "admin" && <Admin />}
        </AppShell>
      )}
      {login && <Login onClose={() => setLogin(false)} onEnter={() => { setLogin(false); go("dashboard"); }} />}
    </main>
  );
}

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <button className={`brand ${dark ? "brand-dark" : ""}`} onClick={() => location.reload()} aria-label="NutriMind — на главную">
      <Mark />
      <span>NutriMind</span>
    </button>
  );
}

function Landing({ onStart, onLogin, onDemo }: { onStart: () => void; onLogin: () => void; onDemo: () => void }) {
  return (
    <div className="landing">
      <header className="topbar">
        <Brand />
        <nav>
          <a href="#how">Как это работает</a>
          <a href="#inside">Возможности</a>
          <a href="#for-whom">Для кого</a>
        </nav>
        <div className="nav-actions">
          <button className="text-btn" onClick={onLogin}>Войти</button>
          <button className="pill small" onClick={onStart}>Начать анализ <Arrow /></button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span>●</span> Персональная система питания</div>
          <h1>Питание, которое<br />понимает <em>вас.</em></h1>
          <p>Экспертная система анализирует ваш организм, образ жизни и цели — и объясняет, что именно стоит изменить в питании и почему.</p>
          <div className="hero-actions">
            <button className="pill large" onClick={onStart}>Пройти анализ <Arrow /></button>
            <button className="ghost" onClick={onDemo}>Посмотреть пример отчёта</button>
          </div>
          <div className="trust-row">
            <span>✓ Учёт аллергий</span><span>✓ Научный подход</span><span>✓ Понятные объяснения</span>
          </div>
        </div>
        <AnalysisPreview />
      </section>

      <section className="logo-strip">
        <span>ДЛЯ ТЕХ, КОМУ ВАЖЕН РЕЗУЛЬТАТ</span>
        <b>СПОРТСМЕНЫ</b><b>ТРЕНЕРЫ</b><b>РОДИТЕЛИ</b><b>ЗДОРОВЬЕ</b>
      </section>

      <section className="how section" id="how">
        <div className="section-heading">
          <span className="kicker">КАК ЭТО РАБОТАЕТ</span>
          <h2>От вопросов — к ясному плану.</h2>
          <p>Мы превращаем разрозненные данные о вашем питании в последовательные и понятные действия.</p>
        </div>
        <div className="steps">
          {[
            ["01", "Расскажите о себе", "Цели, нагрузки, привычки, аллергии и ограничения — всё, что влияет на результат."],
            ["02", "Получите анализ", "Система оценивает потребности, текущий рацион и возможные зоны риска."],
            ["03", "Действуйте по плану", "Продукты, объяснения и пример рациона — без жёстких запретов и догадок."],
          ].map(([n, t, d]) => <article key={n}><span>{n}</span><div className="step-icon">{n === "01" ? "⌁" : n === "02" ? "◌" : "✓"}</div><h3>{t}</h3><p>{d}</p></article>)}
        </div>
      </section>

      <section className="inside section" id="inside">
        <div className="inside-copy">
          <span className="kicker">ВНУТРИ ВАШЕГО ОТЧЁТА</span>
          <h2>Не просто цифры.<br />Решения с объяснением.</h2>
          <p>Каждая рекомендация связана с вашей целью, нагрузкой и реальными привычками.</p>
          <ul>
            <li><b>Точные потребности</b><small>Энергия, белки, жиры, углеводы и вода.</small></li>
            <li><b>Умный выбор продуктов</b><small>Что добавить и что ограничить именно вам.</small></li>
            <li><b>Риски дефицитов</b><small>На что обратить внимание и когда обратиться к специалисту.</small></li>
          </ul>
        </div>
        <div className="food-card">
          <div className="food-visual"><div className="bowl">🥑<br />🥬 &nbsp; 🥚</div></div>
          <div className="food-info"><span>ВАШ ФОКУС НА НЕДЕЛЮ</span><h3>Восстановление после нагрузки</h3><div className="macro"><i style={{ width: "82%" }} /><small>Белок · 138 из 165 г</small></div></div>
        </div>
      </section>

      <section className="audience section" id="for-whom">
        <span className="kicker">СОЗДАНО ДЛЯ РЕАЛЬНОЙ ЖИЗНИ</span>
        <h2>Один подход. Разные задачи.</h2>
        <div className="audience-grid">
          {[
            ["◒", "Спортсменам", "Восстановление, энергия и питание под тренировочный цикл."],
            ["◎", "Тренерам", "Понятная картина питания всей команды в одном кабинете."],
            ["◇", "Родителям", "Безопасные ориентиры для питания юного спортсмена."],
            ["✦", "Для здоровья", "Осознанный рацион без крайностей и универсальных диет."],
          ].map(([i,t,d]) => <article key={t}><i>{i}</i><h3>{t}</h3><p>{d}</p></article>)}
        </div>
      </section>

      <section className="cta">
        <Mark /><h2>Начните с понимания.</h2><p>Первичный анализ занимает около 7 минут.<br />Результат останется в вашем личном кабинете.</p>
        <button className="pill light large" onClick={onStart}>Пройти анализ <Arrow /></button>
      </section>

      <footer><Brand dark /><p>Экспертная платформа персонального питания.<br />Создано Сергеем Пасько.</p><span>© 2026 NutriMind</span></footer>
    </div>
  );
}

function AnalysisPreview() {
  return (
    <div className="analysis-preview">
      <div className="ap-head"><span><Mark /> Ваш анализ</span><b>Сегодня, 09:42</b></div>
      <div className="score">
        <div className="score-ring"><strong>78</strong><small>/100</small></div>
        <div><span>БАЛАНС РАЦИОНА</span><h3>Хорошая основа</h3><p>3 точки роста заметно улучшат восстановление.</p></div>
      </div>
      <div className="mini-grid">
        <div><span>ЭНЕРГИЯ</span><b>2 840 <small>ккал</small></b><i>Оптимально</i></div>
        <div><span>БЕЛОК</span><b>165 <small>г</small></b><i>+ 27 г к рациону</i></div>
      </div>
      <div className="recommend"><span>ВАЖНО СЕЙЧАС</span><div className="rec-icon">Fe</div><div><b>Добавьте источники железа</b><small>Нагрузка и текущий рацион повышают риск недостатка.</small></div><button>→</button></div>
      <div className="safe">Щит <span>Все рекомендации проверены с учётом ваших аллергий</span></div>
    </div>
  );
}

function Quiz({ step, selected, setSelected, onBack, onNext }: any) {
  const data = quizSteps[step];
  const canNext = step === 0 || !!selected[step];
  return (
    <div className="quiz-page">
      <header><Brand /><button className="text-btn" onClick={onBack}>Сохранить и выйти</button></header>
      <div className="progress"><i style={{ width: `${(step + 1) * 20}%` }} /></div>
      <section className="quiz-card">
        <span className="kicker">{data.eyebrow}</span>
        <h1>{data.title}</h1><p>{data.subtitle}</p>
        {data.fields ? (
          <div className="field-grid">{data.fields.map((f) => <label key={f}>{f}<input inputMode="numeric" placeholder={f === "Возраст" ? "28" : f === "Рост, см" ? "189" : "86"} /></label>)}</div>
        ) : (
          <div className="option-grid">{data.options?.map((o) => <button key={o} className={selected[step] === o ? "selected" : ""} onClick={() => setSelected({ ...selected, [step]: o })}><span>{selected[step] === o ? "✓" : "○"}</span>{o}</button>)}</div>
        )}
        <div className="quiz-actions"><button className="ghost" onClick={onBack}>← Назад</button><button className="pill" disabled={!canNext} onClick={onNext}>{step === 4 ? "Получить анализ" : "Продолжить"} →</button></div>
        {step === 3 && <div className="privacy-note">Ваши ограничения будут автоматически применены ко всем продуктам, блюдам и заменам.</div>}
      </section>
    </div>
  );
}

function AppShell({ view, go, children }: { view: View; go: (v: View) => void; children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside>
        <Brand />
        <nav>{navItems.map(n => <button key={n.id} className={view === n.id ? "active" : ""} onClick={() => go(n.id)}><span>{n.id === "dashboard" ? "⌂" : n.id === "report" ? "◔" : n.id === "coach" ? "◎" : "⚙"}</span>{n.label}</button>)}</nav>
        <div className="side-bottom"><button>?</button><div className="avatar">СП</div><div><b>Сергей Пасько</b><small>Профессиональный план</small></div></div>
      </aside>
      <div className="app-content">
        <header className="mobile-app-head"><Brand /><button>☰</button></header>
        {children}
      </div>
    </div>
  );
}

function PageHead({ kicker, title, text, action }: { kicker: string; title: string; text: string; action?: React.ReactNode }) {
  return <div className="page-head"><div><span className="kicker">{kicker}</span><h1>{title}</h1><p>{text}</p></div>{action}</div>;
}

function Report() {
  const [tab, setTab] = useState("Обзор");
  return (
    <div className="report-page content-pad">
      <PageHead kicker="ПЕРСОНАЛЬНЫЙ ОТЧЁТ · 29 ИЮЛЯ 2026" title="Ваш рацион — уже хорошая основа." text="Мы нашли 3 изменения, которые помогут лучше восстанавливаться и поддерживать энергию." action={<button className="outline-btn">Скачать PDF ↓</button>} />
      <div className="tabs">{["Обзор","Потребности","Продукты","Дневной рацион"].map(t => <button className={tab === t ? "active" : ""} onClick={() => setTab(t)} key={t}>{t}</button>)}</div>
      {tab === "Обзор" ? <ReportOverview /> : tab === "Потребности" ? <Needs /> : tab === "Продукты" ? <Products /> : <DayMenu />}
    </div>
  );
}

function ReportOverview() {
  return <>
    <div className="report-grid">
      <article className="score-card"><div className="big-ring"><b>78</b><small>из 100</small></div><div><span>БАЛАНС РАЦИОНА</span><h2>Хорошая основа</h2><p>Рацион покрывает базовые потребности, но восстановление можно улучшить.</p></div></article>
      <article className="focus-card"><span>ГЛАВНЫЙ ФОКУС</span><h2>Добавьте 25–30 г белка</h2><p>Особенно в течение двух часов после тренировки.</p><div className="meter"><i /></div><small>138 г сейчас <b>165 г цель</b></small></article>
    </div>
    <h3 className="block-title">Что изменить в первую очередь</h3>
    <div className="recommendations">
      <article><i className="amber">01</i><div><span>ВЫСОКИЙ ПРИОРИТЕТ</span><h3>Усилить восстановление после тренировок</h3><p>Добавьте сочетание белка и углеводов в первый полноценный приём пищи после нагрузки.</p><button>Почему это важно →</button></div></article>
      <article><i>02</i><div><span>СРЕДНИЙ ПРИОРИТЕТ</span><h3>Повысить пищевую плотность рациона</h3><p>Добавьте продукты с железом, магнием и фолатами 4–5 раз в неделю.</p><button>Подходящие продукты →</button></div></article>
      <article><i>03</i><div><span>СРЕДНИЙ ПРИОРИТЕТ</span><h3>Стабилизировать питьевой режим</h3><p>Распределите 3,2 л жидкости равномерно в течение дня.</p><button>Схема гидратации →</button></div></article>
    </div>
    <div className="disclaimer">NutriMind не ставит диагнозы и не заменяет консультацию врача. Риски дефицитов — повод для дополнительной проверки, а не медицинское заключение.</div>
  </>;
}

function Needs() {
  return <div className="needs-grid">{[["Энергия","2 840","ккал/день","Поддержание массы и тренировочной нагрузки"],["Белок","165","г/день","1,9 г на кг массы тела"],["Жиры","86","г/день","Преимущественно ненасыщенные"],["Углеводы","354","г/день","Больше в тренировочные дни"],["Вода","3,2","л/день","Без учёта потерь на тренировке"],["Клетчатка","32","г/день","Повышать постепенно"]].map(([a,b,c,d]) => <article key={a}><span>{a}</span><h2>{b} <small>{c}</small></h2><p>{d}</p><div><i /></div></article>)}</div>;
}

function Products() {
  return <div className="products-grid"><article><span className="good">ДОБАВИТЬ ЧАЩЕ</span>{["Постная говядина · железо и B12","Гречка · магний и сложные углеводы","Яйца · белок и холин","Киви · витамин C","Лосось · омега-3"].map(x=><div className="product-row" key={x}><i>+</i>{x}</div>)}</article><article><span className="limit">ЖЕЛАТЕЛЬНО ОГРАНИЧИТЬ</span>{["Сладкие напитки · резкие скачки энергии","Колбасы · избыток соли и насыщенных жиров","Алкоголь · ухудшает восстановление","Фастфуд · низкая пищевая плотность"].map(x=><div className="product-row" key={x}><i>−</i>{x}</div>)}<div className="allergy-safe">✓ Исключены продукты с учётом ваших аллергий</div></article></div>;
}

function DayMenu() {
  return <div className="day-menu"><div className="day-total"><span>ПРИМЕР НА ТРЕНИРОВОЧНЫЙ ДЕНЬ</span><b>2 810 ккал</b><small>Б 168 г · Ж 84 г · У 348 г</small></div>{[["07:30","Завтрак","Овсяная каша, яйца, ягоды и цельнозерновой хлеб","670 ккал"],["11:00","Перекус","Йогурт без лактозы, банан и семена","360 ккал"],["14:00","Обед","Гречка, постная говядина и овощной салат","780 ккал"],["17:00","До тренировки","Рисовые хлебцы, творожный продукт и фрукт","320 ккал"],["20:30","Ужин после тренировки","Лосось, картофель и зелёные овощи","680 ккал"]].map(([time,title,desc,kcal])=><article key={time}><time>{time}</time><div><h3>{title}</h3><p>{desc}</p></div><b>{kcal}</b></article>)}</div>;
}

function Dashboard({ go }: { go: (v: View) => void }) {
  return <div className="content-pad"><PageHead kicker="СРЕДА, 29 ИЮЛЯ" title="Добрый вечер, Сергей." text="Ваш план питания на сегодня и то, что требует внимания." action={<button className="pill" onClick={() => go("quiz")}>Обновить данные ↗</button>} /><div className="dash-summary"><article className="today"><span>СЕГОДНЯ</span><h2>Тренировочный день</h2><p>Силовая тренировка · 18:30</p><div><b>2 840<small> ккал</small></b><b>165<small> г белка</small></b><b>3,2<small> л воды</small></b></div></article><article className="next-action"><span>СЛЕДУЮЩЕЕ ДЕЙСТВИЕ</span><i>18:00</i><h3>Приём пищи до тренировки</h3><p>Лёгкие углеводы + 25–30 г белка.</p><button onClick={() => go("report")}>Посмотреть варианты →</button></article></div><h3 className="block-title">Ваш прогресс</h3><div className="trend-card"><div><span>БАЛАНС РАЦИОНА</span><h2>78 <small>/ 100</small></h2><em>↑ 6 пунктов за 3 недели</em></div><div className="chart">{[35,42,40,55,61,58,70,78].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div></div></div>;
}

function Coach() {
  const athletes = useMemo(() => [["Алексей К.","Хоккей","82","Стабильно","green"],["Егор П.","Волейбол","74","Нужен белок","amber"],["Артём И.","Хоккей","69","Риск дефицита","red"],["Матвей С.","Волейбол","88","Отлично","green"],["Олег Т.","Волейбол","76","Гидратация","amber"]], []);
  return <div className="content-pad"><PageHead kicker="КАБИНЕТ ТРЕНЕРА" title="Команда под контролем." text="Сводная картина питания спортсменов без лишних персональных медицинских данных." action={<button className="pill">+ Пригласить спортсмена</button>} /><div className="coach-stats">{[["5","спортсменов"],["3","требуют внимания"],["79","средний балл"],["92%","анкет заполнено"]].map(([n,t])=><article key={t}><b>{n}</b><span>{t}</span></article>)}</div><div className="athletes"><div className="table-head"><span>СПОРТСМЕН</span><span>ВИД СПОРТА</span><span>БАЛЛ</span><span>СТАТУС</span><span /></div>{athletes.map(([name,sport,score,status,color])=><div className="athlete-row" key={name}><span><i className="avatar">{name[0]}</i><b>{name}</b></span><span>{sport}</span><span><b>{score}</b> / 100</span><span><i className={`dot ${color}`} />{status}</span><button>→</button></div>)}</div></div>;
}

function Admin() {
  return <div className="content-pad"><PageHead kicker="АДМИНИСТРАТИВНАЯ ПАНЕЛЬ" title="Управление платформой." text="Пользователи, контент рекомендаций и контроль качества системы." /><div className="admin-grid">{[["1 248","пользователей","+12% за месяц"],["842","активных отчёта","67% пользователей"],["126","правил рекомендаций","8 ждут проверки"],["4,8 / 5","оценка пользы","по 386 ответам"]].map(([n,t,s])=><article key={t}><b>{n}</b><span>{t}</span><small>{s}</small></article>)}</div><div className="admin-main"><article><h2>Контроль системы рекомендаций</h2>{[["Железо и ферритин","Проверено","green"],["Питание после нагрузки","Проверено","green"],["Аллергии: перекрёстные реакции","Нужна проверка","amber"],["Гидратация в жару","Обновлено","blue"]].map(([x,s,c])=><div className="rule" key={x}><span><b>{x}</b><small>Последнее изменение · сегодня</small></span><i className={c}>{s}</i><button>•••</button></div>)}</article><article className="system-health"><h2>Состояние платформы</h2><div className="health-ring">99,9<small>%</small></div><p>Все системы работают штатно</p><ul><li>Анализ анкет <b>Работает</b></li><li>База продуктов <b>Работает</b></li><li>AI-модуль <b>Готов к подключению</b></li></ul></article></div></div>;
}

function Login({ onClose, onEnter }: { onClose: () => void; onEnter: () => void }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="login-modal" onMouseDown={e=>e.stopPropagation()}><button className="close" onClick={onClose}>×</button><Brand /><span className="kicker">С ВОЗВРАЩЕНИЕМ</span><h2>Войдите в NutriMind</h2><p>Ваши отчёты и рекомендации ждут вас.</p><label>Электронная почта<input type="email" placeholder="name@example.com" /></label><label>Пароль<input type="password" placeholder="••••••••" /></label><button className="pill full" onClick={onEnter}>Войти →</button><button className="forgot">Забыли пароль?</button><small>Ещё нет аккаунта? <button onClick={onEnter}>Создать</button></small></div></div>;
}
