const safetyItems = [
  ["01", "Аллергии — жёсткие исключения", "Аллергены и связанные ингредиенты исключаются до рейтинга продуктов и любых рекомендаций."],
  ["02", "Целиакия — строгий безглютеновый режим", "При указанной целиакии применяется отдельный строгий фильтр, а не обычное пищевое предпочтение."],
  ["03", "Без медицинских диагнозов", "NutriMind не интерпретирует симптомы как диагноз и направляет к профильному специалисту, когда это необходимо."],
  ["04", "Дефициты — только по числовым анализам", "Без актуальных числовых лабораторных результатов система не подтверждает наличие дефицита."],
  ["05", "Для несовершеннолетних — без числового КБЖУ", "Результат остаётся информационным и предполагает участие родителя или законного представителя."],
];

const process = [
  ["01", "Анкета", "Девять разделов о профиле, целях, рационе, нагрузке, самочувствии и контексте."],
  ["02", "Safety-скрининг", "Ограничения проверяются раньше персонализации и продуктовых приоритетов."],
  ["03", "Персональный отчёт", "Наблюдения, цели и следующие действия собраны в ясную структуру."],
  ["04", "Калибровка 14 дней", "Стартовые ориентиры уточняются по наблюдениям, режиму и обратной связи."],
];

const audiences = [
  ["Спортсменам", "Связать питание с графиком нагрузок, восстановлением и спортивной целью."],
  ["Тренерам", "Получить общую структуру наблюдений без подмены работы врача или диетолога."],
  ["Родителям", "Безопасно ориентироваться в питании юного спортсмена без числового КБЖУ."],
  ["Тем, кто ценит систему", "Перевести разрозненные привычки в понятные приоритеты и последовательные шаги."],
];

function Brand() {
  return <a className="brand" href="#top" aria-label="NutriMind by Pasko — в начало страницы"><span className="brand-mark" aria-hidden="true">N</span><span><b>NutriMind</b><small>by Pasko</small></span></a>;
}

export default function Home() {
  return (
    <main id="top">
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav aria-label="Основная навигация">
            <a href="#safety">Безопасность</a><a href="#process">Как это работает</a><a href="#report">Пример отчёта</a><a href="#audience">Для кого</a>
          </nav>
          <a className="button button-small" href="#start">Начать анализ <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Персональная система питания</p>
          <h1 id="hero-title">Понимать питание.<br /><em>Действовать точнее.</em></h1>
          <p className="hero-lead">NutriMind превращает данные анкеты о целях, привычках, нагрузке и ограничениях в структурированные ориентиры по питанию — с приоритетом безопасности и понятным объяснением каждого шага.</p>
          <div className="button-row"><a className="button" href="#start">Начать анализ <span aria-hidden="true">↗</span></a><a className="text-link" href="#report">Посмотреть пример отчёта <span aria-hidden="true">↓</span></a></div>
          <div className="hero-notes"><span>Сначала ограничения</span><span>Без медицинских диагнозов</span><span>14 дней калибровки</span></div>
        </div>
        <div className="dashboard" aria-label="Демонстрационный вид интерфейса отчёта">
          <div className="dashboard-top"><span className="demo-label">Демонстрационный пример</span><span>NutriMind / Обзор</span></div>
          <div className="dashboard-title"><div><small>ФОКУС ОТЧЁТА</small><h2>Восстановление после нагрузки</h2></div><span className="status">Safety checked</span></div>
          <div className="dashboard-grid">
            <article className="priority-card"><span className="card-index">01 / ПРИОРИТЕТ</span><div className="priority-icon">↗</div><h3>Приём пищи после вечерней тренировки</h3><p>В демо-профиле полноценный приём пищи отмечен позже 90 минут после нагрузки.</p><div className="metric"><span>Наблюдение из анкеты</span><b>90+ мин</b></div></article>
            <div className="mini-stack"><article><small>ЦЕЛЬ ДЕМО-ПРОФИЛЯ</small><b>Результативность<br />и восстановление</b></article><article className="safe-card"><small>ЖЁСТКОЕ ИСКЛЮЧЕНИЕ</small><b>Арахис</b><span>Применяется до рейтинга продуктов</span></article></div>
          </div>
          <div className="dashboard-footer"><span>Профиль: взрослый спортсмен · хоккей</span><span>Данные не являются рекомендацией вам</span></div>
        </div>
      </section>

      <section className="signal-strip" aria-label="Ключевые принципы"><span>Анкета</span><i /><span>Проверка ограничений</span><i /><span>Структурированный отчёт</span><i /><span>Калибровка</span></section>

      <section className="section shell safety" id="safety">
        <div className="section-heading"><div><p className="eyebrow">Безопасность по умолчанию</p><h2>Ограничения важнее<br />любого рейтинга.</h2></div><p>Safety-правила применяются до формирования продуктовых ориентиров. Если данных недостаточно или требуется специалист, интерфейс должен прямо об этом сообщить.</p></div>
        <div className="safety-grid">{safetyItems.map(([n,t,d]) => <article key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></article>)}</div>
      </section>

      <section className="section process" id="process">
        <div className="shell"><p className="eyebrow light">Путь пользователя</p><h2>От контекста — к ясному плану.</h2><div className="process-grid">{process.map(([n,t,d]) => <article key={n}><span>{n}</span><div><h3>{t}</h3><p>{d}</p></div></article>)}</div></div>
      </section>

      <section className="section shell report" id="report">
        <div className="report-heading"><div><p className="eyebrow">Пример результата</p><h2>Не набор цифр.<br />Система приоритетов.</h2></div><div className="demo-callout"><b>Демонстрационный пример</b><span>Все данные ниже относятся только к вымышленному демо-профилю и не являются расчётом или рекомендацией для посетителя.</span></div></div>
        <div className="report-board">
          <aside><span className="demo-label">Демонстрационный пример</span><h3>Профессиональный хоккеист</h3><p>Взрослый · 28 лет<br />5–6 тренировок в неделю<br />Цель: результативность и восстановление</p><div className="profile-tag">Только данные файла demo-athlete-profile.json</div></aside>
          <div className="report-content">
            <div className="report-top"><div><small>ГЛАВНАЯ ЗАДАЧА</small><h3>Упростить восстановление после вечерней нагрузки</h3></div><span>01</span></div>
            <div className="report-cards"><article className="warning"><small>ВАЖНОЕ ОГРАНИЧЕНИЕ</small><h4>Арахис исключён</h4><p>Аллерген, его ингредиенты и возможные следы исключаются до рейтинга.</p></article><article><small>НАБЛЮДЕНИЕ</small><h4>Поздний приём пищи</h4><p>В анкете отмечено: полноценный приём пищи — позже 90 минут после тренировки.</p></article><article><small>ДЕМО-ЦЕЛЬ</small><h4>Распределить источники белка</h4><p>В демо-отчёте это сформулировано как практический приоритет, а не диагноз.</p></article></div>
            <div className="next-step"><span>СЛЕДУЮЩИЙ ШАГ В ДЕМО-ОТЧЁТЕ</span><b>Запланировать доступный приём пищи после нагрузки</b><p>Затем наблюдать 14 дней и уточнять стартовые ориентиры по фактической обратной связи.</p></div>
          </div>
        </div>
        <p className="report-disclaimer">Демо-отчёт не подтверждает дефициты, не ставит диагнозы и не заменяет консультацию врача. Числовые сценарии из демонстрационных данных намеренно не показаны как персональный результат.</p>
      </section>

      <section className="section shell audience" id="audience"><div className="section-heading"><div><p className="eyebrow">Для реальной жизни</p><h2>Один подход.<br />Разные задачи.</h2></div><p>NutriMind помогает организовать информацию о питании и подготовиться к осознанным изменениям — самостоятельно или вместе со специалистом.</p></div><div className="audience-grid">{audiences.map(([t,d],i) => <article key={t}><span>0{i+1}</span><h3>{t}</h3><p>{d}</p><i aria-hidden="true">↗</i></article>)}</div></section>

      <section className="final-cta" id="start"><div className="final-glow" /><div className="shell"><p className="eyebrow light">Начните с контекста</p><h2>Питание становится понятнее,<br />когда важное собрано вместе.</h2><p>Публичный превью-экран показывает будущий путь продукта. Анкета и расчётный модуль пока не подключены к этому интерфейсу.</p><a className="button button-light" href="#process">Посмотреть, как это работает <span aria-hidden="true">→</span></a></div></section>

      <footer><div className="shell footer-inner"><Brand /><p>NutriMind предоставляет информационные ориентиры и не является медицинской услугой. При заболеваниях, симптомах и назначениях обратитесь к квалифицированному специалисту.</p><div><b>NutriMind by Pasko</b><span>© 2026</span></div></div></footer>
    </main>
  );
}
