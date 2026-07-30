import Image from "next/image";
import Link from "next/link";
import ProductHeader from "./components/ProductHeader";

const steps = [
  [
    "01",
    "Анкета",
    "Девять разделов фиксируют исходные данные, рацион, нагрузку и контекст.",
  ],
  [
    "02",
    "Safety-проверка",
    "Аллергии и медицинские ограничения проверяются раньше любых пищевых приоритетов.",
  ],
  [
    "03",
    "Демо-отчёт",
    "Наблюдения, диапазоны и основания собраны в прозрачную структуру.",
  ],
  [
    "04",
    "Калибровка",
    "Через 14 дней данные можно уточнить по фактической динамике и самочувствию.",
  ],
];

export default function Home() {
  return (
    <main className="home-page">
      <ProductHeader className="home-product-header">
        <nav className="home-nav" aria-label="Основная навигация">
          <a href="#approach">Как это работает</a>
          <a href="#safety">Безопасность</a>
          <a href="#audience">Для кого</a>
        </nav>
        <div className="header-actions">
          <Link className="header-link" href="/report-demo">
            Демо-отчёт
          </Link>
          <Link className="primary-action" href="/questionnaire">
            Начать анализ <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </ProductHeader>

      <section className="original-hero">
        <div className="original-hero-copy">
          <Image
            className="hero-lockup"
            src="/brand/nutrimind-lockup.svg"
            width={310}
            height={64}
            alt="NutriMind by Pasko"
            priority
          />
          <p className="eyebrow">Персональная система питания</p>
          <h1>
            Питание, которое
            <br />
            понимает <em>вас.</em>
          </h1>
          <p className="hero-lead">
            NutriMind структурирует данные о вашем питании, нагрузке и целях — и
            объясняет, что именно стоит изменить и почему.
          </p>
          <div className="hero-actions">
            <Link className="primary-action hero-button" href="/questionnaire">
              Пройти анализ <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-action" href="/report-demo">
              Посмотреть пример отчёта
            </Link>
          </div>
          <ul className="trust-row" aria-label="Принципы продукта">
            <li>Учёт аллергий</li>
            <li>Научный подход</li>
            <li>Понятные объяснения</li>
          </ul>
        </div>

        <div
          className="analysis-preview"
          aria-label="Демонстрационный пример анализа NutriMind"
        >
          <div className="analysis-preview-head">
            <span>
              <Image
                src="/brand/nutrimind-symbol.svg"
                width={26}
                height={13}
                alt=""
              />
              Ваш анализ
            </span>
            <small>Демонстрационный пример</small>
          </div>
          <div className="analysis-score-row">
            <div className="score-ring">
              <b>Демо</b>
              <span>пример</span>
            </div>
            <div>
              <p className="eyebrow">Баланс рациона</p>
              <h2>Хорошая основа</h2>
              <p>Три точки роста заметно улучшат структуру восстановления.</p>
            </div>
          </div>
          <div className="preview-metrics">
            <div>
              <span>Энергия · демо</span>
              <b>
                3550–4050 <small>ккал</small>
              </b>
            </div>
            <div>
              <span>Белок · демо</span>
              <b>
                155–172 <small>г</small>
              </b>
            </div>
          </div>
          <div className="preview-priority">
            <span>Важно сейчас</span>
            <div>
              <b>01</b>
              <p>
                <strong>Приём пищи после тренировки</strong>
                <small>По данным демонстрационного профиля</small>
              </p>
              <i>→</i>
            </div>
          </div>
          <p className="preview-safety">
            ✓ Аллергия на арахис исключена до рейтинга продуктов
          </p>
          <p className="demo-boundary">
            Все значения относятся только к вымышленному демо-профилю. Это не
            рекомендация посетителю.
          </p>
        </div>
      </section>

      <section className="approach-section site-section" id="approach">
        <div className="section-intro">
          <p className="eyebrow">Подход NutriMind</p>
          <h2>
            ИНТЕЛЛЕКТ.
            <br />
            ПИТАНИЕ.
            <br />
            <em>РЕЗУЛЬТАТ.</em>
          </h2>
        </div>
        <p className="section-copy">
          Не универсальное меню и не список запретов. NutriMind соединяет
          контекст человека, правила безопасности и объяснимые приоритеты в одну
          спокойную систему действий.
        </p>
      </section>

      <section className="steps-section site-section">
        <div className="section-intro">
          <p className="eyebrow">Как это работает</p>
          <h2>
            От контекста
            <br />к калибровке.
          </h2>
        </div>
        <div className="steps-list">
          {steps.map(([number, title, text]) => (
            <article key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="safety-section site-section" id="safety">
        <div className="section-intro">
          <p className="eyebrow">Безопасность прежде всего</p>
          <h2>
            Границы,
            <br />
            которые нельзя
            <br />
            обойти.
          </h2>
          <p className="section-copy">
            Медицинский gateway может потребовать проверки специалистом до
            персонализированного результата.
          </p>
        </div>
        <div className="safety-rules">
          <article>
            <span>01</span>
            <h3>Жёсткие исключения</h3>
            <p>
              Аллергии исключаются до рейтинга продуктов. При целиакии
              применяется строгий безглютеновый режим.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Без медицинских утверждений</h3>
            <p>
              NutriMind не ставит диагнозы и не подтверждает дефициты без
              числовых лабораторных результатов.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Защита несовершеннолетних</h3>
            <p>
              Несовершеннолетним не показывается числовой КБЖУ; сценарий
              предусматривает участие взрослого и специалиста.
            </p>
          </article>
        </div>
      </section>

      <section className="audience-section site-section" id="audience">
        <div className="section-intro">
          <p className="eyebrow">Для кого</p>
          <h2>
            Один продукт.
            <br />
            Разный контекст.
          </h2>
        </div>
        <div className="audience-list">
          <span>Спортсмены</span>
          <span>Тренеры</span>
          <span>Родители</span>
          <span>Обычные пользователи</span>
        </div>
      </section>

      <section className="home-final">
        <p className="eyebrow">Начните с анкеты</p>
        <h2>
          Питание становится яснее,
          <br />
          когда видна вся система.
        </h2>
        <div className="hero-actions">
          <Link className="primary-action hero-button" href="/questionnaire">
            Пройти анализ <span aria-hidden="true">↗</span>
          </Link>
          <Link className="text-action" href="/report-demo">
            Открыть демонстрационный отчёт
          </Link>
        </div>
      </section>

      <footer className="site-footer">
        <BrandFooter />
        <p>
          Информационный сервис. Не заменяет консультацию врача или диетолога,
          не ставит диагнозы и не предназначен для экстренных медицинских
          ситуаций.
        </p>
        <nav>
          <Link href="/questionnaire">Анкета</Link>
          <Link href="/report-demo">Демо-отчёт</Link>
        </nav>
      </footer>
    </main>
  );
}

function BrandFooter() {
  return (
    <div>
      <Image
        src="/brand/nutrimind-lockup.svg"
        width={230}
        height={48}
        alt="NutriMind by Pasko"
      />
      <small>ИНТЕЛЛЕКТ. ПИТАНИЕ. РЕЗУЛЬТАТ.</small>
    </div>
  );
}
