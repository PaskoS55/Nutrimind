# Аудит репозитория NutriMind

Дата аудита: 2026-07-30  
Версия спецификаций: `0.1.1-draft`  
Область: весь отслеживаемый репозиторий, с углублённой проверкой `app/`, `db/`, `worker/`, `tests/`, `docs/` и связанных `data/`, `drizzle/`, `examples/`, `scripts/`, `build/`  
Ограничение: исходный код и спецификации не изменялись; этот файл — единственный результат аудита.

## 1. Резюме

Репозиторий представляет собой качественно оформленный демонстрационный UI и набор достаточно подробных спецификаций будущего продукта, но не работающий production SaaS персонального питания. Production-контур расчёта, safety-фильтрации, рекомендаций, продуктовой базы, хранения анкет и отчётов отсутствует.

Главный архитектурный разрыв: правила `0.1.1-draft` реализованы лишь как локальные функции внутри `tests/nutrimind-core.test.mjs`. Приложение их не импортирует и не исполняет. `app/page.tsx` показывает статический пятишаговый прототип анкеты и заранее заданный отчёт, не связанный ни с ответами пользователя, ни с `data/survey-schema.json`, ни с `data/demo-report.json`.

Текущую версию нельзя использовать для реальных пользователей. Особенно критично, что UI способен показать числовые КБЖУ, меню и утверждение о проверке аллергий любому посетителю, включая несовершеннолетнего или пользователя с нераспознанной аллергией, потому что ответы фактически не валидируются и не участвуют в формировании результата.

Итоговая классификация:

| Область | Состояние | Классификация |
|---|---|---|
| Визуальный интерфейс и адаптивные стили | Рабочий одностраничный клиентский UI | prototype/demo |
| Анкета в UI | 5 упрощённых шагов вместо 9 разделов | demo |
| Схема анкеты | 9 разделов и ветвления описаны в JSON | approved design artifact, не runtime |
| Расчётное ядро | Нет модуля приложения | отсутствует; test-only модель |
| Рекомендательный движок | Нет модуля приложения | отсутствует; test-only фрагменты |
| Продуктовая база | Drizzle schema пуста | отсутствует |
| Отчёт, меню и продуктовые карточки | Захардкожены в JSX | demo/mock |
| Авторизация | Есть неиспользуемый helper ChatGPT и фальшивое окно входа | scaffold/demo |
| Хранение данных | Нет таблиц, репозиториев и API | отсутствует |
| Worker/Sites-сборка | Техническая обвязка Vinext/Cloudflare | infrastructure scaffold |
| Тесты | 30 self-contained unit-тестов + 1 smoke test артефакта | prototype contract tests |

## 2. Текущая архитектура

### 2.1. Runtime-поток

```text
Browser
  -> один маршрут Next.js `/`
  -> `app/page.tsx` (`"use client"`)
  -> локальный React state выбирает home / quiz / report / dashboard / coach / admin
  -> статические JSX-данные

Cloudflare Worker
  -> обработчик оптимизации изображений
  -> Vinext App Router handler

Не подключены к потоку:
  data/survey-schema.json
  data/demo-athlete-profile.json
  data/demo-report.json
  db/index.ts
  app/chatgpt-auth.ts
  функции из tests/nutrimind-core.test.mjs
```

Физически существует только маршрут `/`. Все «экраны» переключаются локальным состоянием и не имеют URL, server-side boundary, загрузки данных или контроля доступа.

### 2.2. `app/`

- `app/page.tsx` — монолитный клиентский компонент, содержащий landing, анкету, отчёт, dashboard, кабинет тренера, admin и login modal.
- `quizSteps` — отдельный массив из 5 демонстрационных шагов. Он не соответствует 9-раздельной утверждённой анкете и не строится из `survey-schema.json`.
- Числовые поля первого шага не записываются в state. Для них нет `value`, `onChange`, парсинга, диапазонов или обязательности.
- Выборы остальных шагов сохраняются только в памяти вкладки и после последнего шага игнорируются.
- `Report`, `Needs`, `Products`, `DayMenu`, `Dashboard`, `Coach`, `Admin` полностью статичны.
- Кнопки PDF, приглашения спортсмена, действий рекомендаций, меню, mobile navigation, сохранения и выхода не имеют соответствующей бизнес-функции.
- `Login` принимает любые или пустые значения и переводит в dashboard без аутентификации.
- `app/chatgpt-auth.ts` содержит разумную нормализацию redirect path и чтение доверенных заголовков среды, но нигде не используется. Сам по себе helper не создаёт сессию, роли или авторизацию ресурсов.
- `app/layout.tsx` всё ещё содержит metadata `Starter Project`, английский `lang="en"` и starter-description, хотя интерфейс русскоязычный.
- `app/globals.css` — большой единый слой стилей. Он относится к работающему прототипу внешнего вида, но не имеет компонентной изоляции.

### 2.3. `db/` и `drizzle/`

- `db/schema.ts` намеренно пуст и экспортирует только `{}`.
- `db/index.ts` умеет создать Drizzle client для D1 binding `DB`, но вызывающего кода нет.
- Таблиц пользователей, ролей, согласий, анкет, ответов, отчётов, версий правил, audit trace, продуктов, аллергенов, ингредиентов и источников нет.
- В `drizzle/meta/_journal.json` нет прикладных миграций.
- `examples/d1/` — шаблон notes API и пример схемы; это не NutriMind-код и не подключено к приложению.
- В `.openai/hosting.json` D1 binding может быть указан для платформы, однако наличие binding не означает наличие рабочей модели данных.

### 2.4. `worker/`, build и hosting

- `worker/index.ts` — стандартный Vinext/Cloudflare entry point.
- Он обслуживает image optimization и передаёт остальные запросы App Router handler.
- Интерфейс `Env` объявляет `DB`, но Worker напрямую его не использует; прикладных API, фоновых задач, очередей и scheduled jobs нет.
- `build/sites-vite-plugin.ts` пакует hosting manifest и каталог миграций в `dist`.
- `scripts/*` в основном обеспечивают Sites-окружение, ограниченную по времени сборку и проверку наличия `default.fetch`.
- Это полезная production-подобная инфраструктурная заготовка, но она проверяет форму deployment artifact, а не корректность нутриционной системы.
- Развёртывание в ходе аудита не выполнялось.

### 2.5. `tests/`

`tests/nutrimind-core.test.mjs` содержит 30 тестов: 16 профилей и 14 инвариантов. В том же файле объявлены собственные mock-food records и функции `pal`, `allergyAllowed`, `productAllowed`, `medicalDecision`, `weightReduction`, `macroScenarios`, `status`, `validate`, `hydration`.

Это исполняемая модель части спецификации, но не тест production-кода:

- ни одна функция не импортируется из `app/`, `db/` или отдельного core-модуля;
- прохождение тестов доказывает только согласованность тестового файла с самим собой;
- UI может нарушать эти инварианты, не вызывая падения тестов;
- тест несовершеннолетних проверяет простое булево выражение, а не блокировку результата;
- тест отсутствия лабораторных значений проверяет `Boolean(null)`, а не генерацию текста отчёта;
- deterministic-order тест сравнивает два вызова одной локальной сортировки на одном input и не проверяет версии, hash или сохранённый результат;
- allergy mock не моделирует рекурсивные ингредиенты, `derived_from`, полноценную таксономию, provenance и область блокировки;
- медицинский gateway покрывает лишь несколько условных строковых флагов;
- нет тестов реальной анкеты, API, БД, доступа по ролям, persistence, миграций, race conditions, audit trail или UI safety-output.

`tests/rendered-html.test.mjs` проверяет только HTTP 200, HTML content type и development preview meta в собранном Worker. Он не проверяет содержимое или безопасность продукта.

### 2.6. `docs/` и `data/`

- Четыре основные спецификации `0.1.1-draft` подробно задают расчёт, продуктовую модель и safety-first pipeline.
- `docs/NUTRIMIND_SURVEY_SPEC.md` остаётся исходной утверждаемой анкетой и, согласно правилам репозитория, не должен переписываться молча.
- `data/survey-schema.json` корректно декларирует `sectionCount: 9`, ветки adult/minor и athlete/general, приоритет safety и pending-approval вопросы.
- `data/demo-athlete-profile.json` и `data/demo-report.json` явно маркированы `isDemonstration: true` и согласованы с примером расчётного ядра существенно лучше, чем UI.
- JSON-файлы не импортируются runtime-кодом, поэтому сейчас являются документационными fixtures, а не данными приложения.
- `docs/TEST_REPORT_0.1.1.md` фиксирует исторический PASS, но не указывает, что core-функции находятся внутри теста и не являются production implementation.

## 3. Сопоставление реализации со спецификациями

### 3.1. `CALCULATION_CORE_SPEC.md`

| Требование | Реализация | Разрыв |
|---|---|---|
| Предварительная валидация входа | Только упрощённые проверки в тесте | Нет runtime validation и error model |
| Mifflin–St Jeor, raw audit, округление | Формула косвенно отражена demo JSON; в приложении нет | Отсутствует core service |
| PAL presets и ограничения | Частично повторены в тесте | Нет runtime, audit и маркировки demo PAL в UI |
| Goal multiplier и блокировка снижения | Test-only `weightReduction()` | UI всегда показывает один статичный результат |
| Три согласованных сценария КБЖУ | Test-only и demo JSON | UI показывает один иной набор значений |
| Блок числовых КБЖУ несовершеннолетним | Тривиальный assert в тесте | Полностью отсутствует в UI/runtime |
| 14-дневная калибровка | Только текст/fixture | Нет модели наблюдений и алгоритма |
| Разделение видов воды | Только docs/demo JSON | UI сводит всё к `3,2 л` |
| Double-day semantics | Локальная test-only проверка | Нет реального входа и результата |
| Структурированный output object | Пример в документации | Нет типов, схемы и API |
| Trace `ответ → правило → коэффициент → результат` | Fixture содержит 3 строки | Не генерируется и не сохраняется |

Отдельное несоответствие документации: исходная `NUTRIMIND_SURVEY_SPEC.md` говорит о диапазоне энергии `±100 ккал`, тогда как core `0.1.1-draft` задаёт три сценария `0,94 / 1,00 / 1,06`. По `AGENTS.md` расчётная логика должна следовать core-spec, не переписывая исходную анкету молча. Это расхождение надо оформить явным решением/версией, а не переносить в код произвольно.

### 3.2. `NUTRIMIND_SURVEY_SPEC.md`

| Требование | Реализация |
|---|---|
| Девять разделов | Есть только в JSON; UI содержит 5 шагов |
| Athlete/general branching | Нет в UI |
| Adult/minor branching и guardian | Нет в UI |
| Пол для формулы | Нет в UI |
| Полный safety-раздел | Заменён одной группой из 5 опций |
| `none` взаимоисключается с конкретными значениями | UI single-select случайно исключает конфликт, но не реализует полную multi-модель |
| «Другая аллергия» и блокировка до нормализации | Нет |
| Раздельные аллергии/непереносимости/medical | Нет; UI смешивает «лактозу», «глютен», «орехи», «рыбу и морепродукты» |
| Текущее питание | Один агрегированный выбор вместо 6 вопросов |
| Нагрузка и timing | Нет полного набора |
| Самочувствие | Нет |
| Гидратация | Нет |
| Анализы, лекарства, согласие | Нет |
| Запрещённые pending questions | В JSON/UI не добавлены, ограничение соблюдено |

Имена полей между документами и JSON также не унифицированы (`audience`/`userType`, `age`/`ageYears`, `sex`/`sexForFormula`, `level`/`sportLevel` и др.). До реализации нужен один канонический input contract и явный mapper, иначе правила легко будут читать не те поля.

### 3.3. `RECOMMENDATION_RULES_SPEC.md`

Из 11 стадий pipeline ни одна не реализована в runtime. В тесте есть лишь упрощённые аналоги валидации, нескольких фильтров, medical tri-state и порогов статусов.

Отсутствуют:

- version validation;
- рекурсивное разрешение аллергенов ингредиентов и рецептов;
- `derived_from`, актуальность `free_from_claim`, jurisdiction и provenance;
- полноценный medical gateway;
- нормализация непереносимостей и пользовательских исключений;
- contextual data completeness;
- пищевые роли;
- расчёт всех компонентов Score;
- tie-break по data quality, warning count и product id;
- diversity selection;
- безопасные replacements;
- `candidate_shortage` без ослабления фильтра;
- explanations и полный audit trace;
- воспроизводимость по версиям.

UI-списки продуктов и меню не проходят даже фиктивный фильтр. Надпись «Исключены продукты с учётом ваших аллергий» и утверждение «Все рекомендации проверены» не подтверждены вычислением.

### 3.4. `PRODUCT_DATABASE_SPEC.md`

Ни одна прикладная таблица спецификации не существует. Нет `food_item`, variants, nutrients, allergens, ingredient graph, dietary flags, medical rules, portions, sources, market availability, completeness, version history или индексов.

Следовательно, невозможны:

- безопасная проверка продукта, блюда и вложенного ингредиента;
- различение `contains`, `may_contain`, `cross_contact`, `unknown`;
- разграничение молочной аллергии и непереносимости лактозы;
- доказуемая маркировка branded-продукта;
- проверка единиц и basis;
- конфликт источников и консервативный выбор;
- воспроизведение старого отчёта;
- soft delete использованных версий;
- редакционный audit.

## 4. Несогласованность демонстрационных данных

Есть два разных демонстрационных отчёта для визуально одного и того же взрослого спортсмена:

| Показатель | `data/demo-report.json` | `app/page.tsx` |
|---|---:|---:|
| Энергия | 3800 ккал central | 2840 ккал |
| Белок | 163,4 г central | 165 г |
| Жиры | 86 г central | 86 г |
| Углеводы | 593,1 г central | 354 г |
| Меню | Не задано | 2810 ккал / 168 / 84 / 348 |
| PAL | 2,00, явно demo | Не показан |
| Расчётный trace | Есть | Нет |

UI-набор `2840 / 165 / 86 / 354` математически даёт около `2842 ккал`, то есть внутренне близок по энергии, но не следует утверждённому demo-профилю с REE `1906,25` и PAL `2,00`. Меню также не совпадает с показанными потребностями. Пользователь не видит, что цифры являются несвязанным mock-результатом.

Дополнительно:

- фраза «Точные потребности» противоречит обязательному позиционированию как расчётного стартового ориентира;
- `2 840 ккал — Оптимально` выглядит как измеренная потребность;
- UI не показывает обязательное предупреждение о demo PAL;
- статичное меню содержит generic «йогурт без лактозы», «семена», «творожный продукт» без branded-записи, состава и проверки возможных следов арахиса;
- dashboard показывает фиктивный трёхнедельный прогресс без данных наблюдений;
- coach/admin показывают фиктивных людей, системные статусы и продуктовые правила как реальные.

## 5. Production-код, scaffold и demo/mock

### Можно сохранить как основу

- визуальную систему и адаптивные стили — при сохранении утверждённого дизайна;
- `worker/index.ts` и Vinext/Sites build integration после hardening и интеграционных тестов;
- безопасную нормализацию return path из `app/chatgpt-auth.ts`, если выбран именно этот auth-механизм;
- `data/survey-schema.json` как исходную структурированную схему после введения runtime-валидации и канонических типов;
- спецификации и demo fixtures как versioned contracts/test fixtures.

### Demo/mock, подлежащие замене или строгой маркировке

- `quizSteps` и вся логика `Quiz`;
- все числа и тексты персонального `Report`, `Needs`, `Products`, `DayMenu`;
- `Dashboard`, включая прогресс и расписание;
- список спортсменов и агрегаты `Coach`;
- статистика, правила и health status `Admin`;
- `Login` modal и переход без проверки credentials;
- no-op действия PDF, сохранения, приглашений и карточек;
- demo profile/report как источник реального UI — их можно использовать только при явном demo mode;
- `examples/d1/notes` — удалить из production surface или оставить только как явно изолированный пример;
- функции расчёта внутри теста — заменить импортами из production-модулей.

## 6. Отсутствующие production-модули

Минимально необходимы:

1. Канонические типы и runtime schemas для анкеты, расчётного входа/выхода и ошибок.
2. Survey engine: 9 разделов, ветвления, required/visible rules, mutually exclusive `none`, draft persistence и consent.
3. Safety preflight: возраст, неизвестная аллергия, medical flags, блокировка reduction и output capabilities.
4. Чистое versioned calculation core: REE, PAL, goals, macro scenarios, hydration, calibration eligibility и audit trace.
5. Нормализованная продуктовая БД и миграции согласно спецификации.
6. Import/curation pipeline с provenance, версиями, conflict handling и quality gates.
7. Allergen resolver для вариантов, ингредиентов, рецептов, следов и cross-contact.
8. Medical/intolerance/exclusion gateway с tri-state decisions.
9. Recommendation engine: roles, scoring, deterministic ordering, diversity, replacements и shortage behavior.
10. Report composer, который показывает только разрешённые capabilities и обязательные notices.
11. Persistence layer для пользователей, consent, survey submissions, immutable report snapshots, version bundle и audit trace.
12. Реальная authentication/authorization и RBAC для user/guardian/coach/admin.
13. Privacy/security layer для чувствительных данных: минимизация, шифрование, retention, удаление, доступ и аудит.
14. API/application service layer; клиент не должен сам принимать safety-critical решения.
15. PDF/export, построенный из того же immutable report snapshot, а не отдельного шаблона с иной логикой.
16. Observability без утечки медицинских и персональных данных.
17. Production test suites и CI, тестирующие реальные модули и migrations.

## 7. Safety-critical gaps

### Критические — блокируют использование с реальными людьми

1. **Ответы не влияют на результат.** Любой пользователь получает один и тот же числовой отчёт и меню.
2. **Нет возрастного gateway.** Несовершеннолетний может получить числовые КБЖУ и граммовки без специалиста/опекуна.
3. **Нет реального allergen gate.** Статические продукты и блюда показываются без состава, следов, cross-contact и provenance.
4. **Ложная гарантия безопасности.** UI заявляет, что аллергии применены, хотя вычисления нет.
5. **Нет unresolved-allergy block.** «Другая» аллергия вообще отсутствует в UI.
6. **Нет medical tri-state в runtime.** Заболевания и назначения врача не собираются и не могут ограничить результат.
7. **Нет блокировки weight reduction.** UI не моделирует safety-screen или capability-based suppression.
8. **Нет лабораторного evidence model.** Нельзя гарантировать запрет подтверждённых дефицитов на всех output paths.
9. **Нет единого safety pipeline для продуктов, замен, рецептов, меню и PDF.** Самих production paths пока тоже нет.
10. **Нет неизменяемого audit trace и версий данных.** Нельзя объяснить или воспроизвести решение.

### Высокие

- «Точные потребности» и «Оптимально» создают ложную точность.
- Фиктивные кабинеты выглядят как реальные персональные/медицинские данные и реальные статусы системы.
- Нет auth/RBAC: любой экран доступен локальным переключением state.
- Нет consent enforcement, privacy boundary между спортсменом и тренером и политики доступа к медицинскому контексту.
- Нет server-side validation; будущая client-only реализация была бы обходима.
- Нет транзакционной связи report snapshot с input hash и версиями правил/продуктов.
- Не определено поведение при частичном сбое источников или недостатке безопасных кандидатов в runtime.

## 8. Технический долг

### Архитектура

- Монолитный `app/page.tsx` смешивает навигацию, UI, demo fixtures и поведение ролей.
- Клиентский state используется вместо маршрутов, серверных boundaries и domain/application layers.
- Нет разделения domain, application, infrastructure и presentation.
- Нет dependency direction: фактически доменного слоя нет.
- Схема анкеты, demo profile и core spec используют разные названия полей.
- Версия package `0.1.0` расходится с архитектурой `0.1.1-draft`; version bundle отсутствует.

### Качество и сопровождение

- `any` в props `Quiz` скрывает контракт формы.
- Большие однострочные JSX-компоненты затрудняют review и точечное тестирование.
- Metadata и locale остались от starter template.
- Нет error/loading/empty/blocked/specialist-review states.
- Нет accessibility-проверок; часть иконок/кнопок не имеет ясного текстового назначения.
- Нет schema validation для JSON fixtures.
- Нет migration verification на чистой БД.
- Нет линтинга/типизации как отдельного Windows-portable шага.

### Тестовая инфраструктура

- `npm test` сначала повторно запускает build, поэтому команда `npm run build` + `npm test` из checklist собирает проект дважды.
- Все npm scripts зависят от `bash`; в текущей Windows PowerShell-среде штатный `npm test` падает до сборки (`bash is not recognized`).
- Прямой запуск core-тестов дал `30 passed / 0 failed`, но это test-only функции.
- Прямой render-test упал из-за отсутствующего `dist/server/index.js`, что ожидаемо без сборки.
- ESLint shim для Windows в текущем `node_modules` отсутствует; проверка lint не была выполнена.
- Зафиксированный `docs/TEST_REPORT_0.1.1.md` нельзя считать текущим доказательством production correctness.
- Нет coverage и mutation testing для safety правил.

## 9. Рекомендуемый порядок реализации

Порядок намеренно ставит контракты и safety раньше UI-подключения.

### Этап 0 — решения и границы

1. Зафиксировать, что текущий режим — только demo и визуально маркировать его до любого внешнего использования.
2. Утвердить канонические имена полей и version bundle.
3. Разрешить документированное расхождение `±100 ккал` против сценариев `±6%` без молчаливого изменения survey spec.
4. Отдельно утвердить safety-screen для снижения энергии. До этого reduction остаётся выключенным.
5. Не добавлять pending PAL/RPE/double-session вопросы без согласования.

### Этап 1 — исполняемые контракты и safety core

1. Создать runtime schemas и domain-типы.
2. Реализовать validation/capability gate.
3. Перенести расчёт из тестов в чистые versioned production-модули.
4. Переписать тесты так, чтобы они импортировали production code.
5. Добавить property/boundary tests для округления, minors, medical flags и output suppression.

Критерий выхода: ни один числовой или продуктовый output не создаётся без успешного preflight; 16 профилей и 14 инвариантов проверяют реальный код.

### Этап 2 — продуктовая БД и safety filtering

1. Реализовать Drizzle schema, constraints, indexes и migrations.
2. Создать versioned source/import/curation pipeline.
3. Реализовать recursive allergen resolver и contextual completeness.
4. Реализовать intolerance, medical и user-exclusion gateways.
5. Добавить fixtures для вложенных рецептов, конфликтующих источников, истёкших claims и unknown safety.

Критерий выхода: hard block невозможно компенсировать рейтингом; неизвестно никогда не считается безопасным.

### Этап 3 — recommendation engine

1. Реализовать пищевые роли и score components.
2. Добавить детерминированные tie-breaks, diversity и shortage behavior.
3. Прогонять replacements и меню через тот же safety pipeline.
4. Генерировать полный explanation/audit trace.

Критерий выхода: одинаковый input hash и version bundle воспроизводят идентичный упорядоченный результат.

### Этап 4 — persistence, auth и privacy

1. Ввести user/guardian/coach/admin модель и RBAC.
2. Реализовать consent, draft answers, immutable submissions и reports.
3. Ограничить тренерский доступ минимально необходимыми данными.
4. Определить retention, deletion, encryption, audit access и redaction логов.
5. Подключить выбранный auth flow server-side; удалить фальшивый login behavior.

### Этап 5 — подключение UI без редизайна

1. Разнести существующий интерфейс по маршрутам/компонентам, сохранив утверждённый внешний вид.
2. Построить 9 разделов из утверждённой схемы и реализовать ветвления.
3. Показывать `blocked`, `limited_input`, `specialist_review` как первичные состояния.
4. Заменить hardcoded report на immutable report snapshot.
5. Разрешать продукты, меню и PDF только через capabilities результата.
6. Demo fixtures показывать только по явному demo route/mode с заметной маркировкой.

### Этап 6 — production hardening

1. Интеграционные тесты API/DB/Worker и end-to-end тесты всех 16 safety profiles.
2. Тесты ролей и утечек данных, migration tests, backup/restore и incident paths.
3. Cross-platform CI с отдельными build, typecheck, lint, unit, integration и E2E jobs.
4. Проверка секретов, dependency/security scanning и privacy review.
5. Независимая предметная/клиническая проверка формул, текстов и safety behavior.
6. Публикация только после отдельного разрешения владельца.

## 10. Приоритетный backlog

| Приоритет | Работа | Причина |
|---|---|---|
| P0 | Явно изолировать/маркировать demo output | Предотвращает принятие mock-значений за персональные рекомендации |
| P0 | Канонический contract + runtime validation | Основа всех safety решений |
| P0 | Age/allergy/medical/reduction capability gate | Блокирует наиболее опасные outputs |
| P0 | Production calculation core и реальные tests | Убирает ложное покрытие test-only логики |
| P0 | Product DB + allergen graph + provenance | Без этого нельзя безопасно рекомендовать продукты |
| P1 | Recommendation pipeline и audit trace | Делает результат детерминированным и объяснимым |
| P1 | Persistence, auth, RBAC, consent/privacy | Необходимы для SaaS и чувствительных данных |
| P1 | Полная 9-раздельная анкета | Даёт утверждённый вход для расчёта |
| P1 | Report capability rendering и PDF из snapshot | Исключает обход safety через отдельные output paths |
| P2 | Coach/admin реальные workflows | Только после auth и privacy boundary |
| P2 | 14-дневная калибровка | После надёжного хранения наблюдений |
| P2 | Operational hardening и observability | Перед разрешённым production launch |

## 11. Проверки, выполненные при аудите

- Просмотрены все отслеживаемые файлы и структура репозитория; `package-lock.json` оценён как lockfile зависимостей, бинарный логотип — как визуальный asset.
- Проверены `app/`, `db/`, `worker/`, `tests/`, `docs/`, `data/`, build/config/scripts и example D1.
- Выполнено сопоставление четырёх указанных спецификаций с runtime-кодом.
- Поиск типовых признаков секретов не обнаружил закоммиченных токенов, ключей или паролей; найденный password input является пустым demo-полем.
- `node --test tests/nutrimind-core.test.mjs`: `30 passed / 0 failed`.
- `tests/rendered-html.test.mjs`: не запущен успешно без `dist`; отсутствует собранный Worker artifact.
- `npm test`: не запущен успешно в текущей Windows-среде, потому что npm script требует `bash`.
- Публикация, deployment, подключение внешних сервисов и изменение исходников не выполнялись.

## 12. Заключение

NutriMind сейчас находится на стадии «утверждённые спецификации + визуальный prototype + test-only reference model». Наиболее ценная часть репозитория — документы `0.1.1-draft`, девятираздельная JSON-схема и сформулированные safety-инварианты. Наиболее опасная часть — внешне убедительный отчёт с персонально выглядящими числами и гарантиями безопасности, которые не подкреплены runtime-логикой.

Следующая разработка должна начинаться не с расширения интерфейса, а с исполняемых контрактов, production safety gate и расчётного ядра, тестируемого через imports. Продукты и меню нельзя подключать до появления версионированной базы, рекурсивного allergen filtering и доказуемого provenance. Текущий UI целесообразно сохранить как визуальную оболочку, но все данные внутри него должны быть либо явно обозначенным demo, либо результатом единого server-side safety pipeline.
