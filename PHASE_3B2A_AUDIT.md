# Phase 3B2A — российский design lock контекста пищевых ограничений

Дата пересмотра: 2026-08-04. Статус: **approved design lock; implementation not started**.

Этот документ заменяет прежнюю jurisdiction-neutral концепцию EU/EAEU/US union taxonomy. Продукт на текущем этапе проектируется исключительно для рынка Российской Федерации. Документ утверждает контракт будущей реализации Phase 3B2A, но не создаёт production-код, каталог, фильтрацию, продукты, порции, меню, медицинские рекомендации или deployment.

## 1. Итог решения

| Решение | Статус |
|---|---|
| `targetMarket: "Russian Federation"` | **approved** |
| `regulatoryScope: "EAEU / Russian Federation"` | **approved** |
| `primaryUiLanguage: "ru"` | **approved** |
| `marketScopeVersion: "nutrimind.market.ru.v1"` | **approved** |
| Нормативная основа allergy taxonomy — ТР ТС 022/2011 в применимой редакции | **approved** |
| EU/US как нормативная основа продукта | **rejected** |
| Гибридная taxonomy: пользовательские коды + umbrella-категории ТР ТС | **approved** |
| Celiac, lactose, aspartame/phenylalanine и sulphites внутри allergy enum | **rejected** |
| Lactose/aspartame/sulphites в Phase 3B2A questionnaire | **deferred** |
| Catalog-supported subset до появления проверенных entities | **approved: `[]`** |
| Регуляторный exception engine в Phase 3B2A | **rejected** |

Русский язык интерфейса сам по себе не обеспечивает юридическое соответствие. Соответствие зависит от применимой редакции регулирования, состава и маркировки конкретной продукции, рынка обращения и документированного human review.

## 2. Репозиторий и границы аудита

Перед пересмотром подтверждено:

- root: `C:/Projects/nutrimind`;
- branch: `main`;
- HEAD: `50e7b3f8f930f164bb11f134cc21fe5df233f4a2`;
- `origin/main...main`: `0 0`;
- исходный status: только `?? PHASE_3B2A_AUDIT.md`;
- второй worktree `C:/Projects/nutrimind-original` не использовался;
- production-код, зависимости, lockfile, тесты, build, browser QA, commit, push и deployment не затрагивались.

Разделы анкеты остаются ровно девятью. `docs/NUTRIMIND_SURVEY_SPEC.md`, расчётные формулы, Phase2D1, Phase3A1, Phase3A2, Phase3B1 и calibration не изменяются.

## 3. Применимая нормативная основа

Основной официальный источник — [ТР ТС 022/2011 «Пищевая продукция в части ее маркировки»](https://eec.eaeunion.org/upload/medialibrary/9db/TrTsPishevkaMarkirovka.pdf), принятый Решением Комиссии Таможенного союза от 9 декабря 2011 г. № 881. Официальная [карточка регламента ЕЭК](https://eec.eaeunion.org/comission/department/deptexreg/tr/PischevkaMarkirovka.php) фиксирует изменения Решениями Совета ЕЭК № 90 от 20.12.2017, № 75 от 14.09.2018 и № 35 от 22.04.2024; последнее вступило в силу 10.11.2024. Изменение № 35 касается адресных сведений изготовителя и не меняет перечень пункта 14 части 4.4.

Нормативный текст используется как основа категорий маркировки для РФ/ЕАЭС, но сам по себе не является медицинской диагностической taxonomy и не гарантирует безопасность конкретного продукта.

Клиническое разделение доменов опирается на [EAACI guideline по IgE-опосредованной пищевой аллергии](https://eaaci.org/guidelines-position-papers/eaaci-guidelines-on-the-management-of-ige-mediated-food-allergy/) и [ACG Clinical Guideline: Diagnosis and Management of Celiac Disease](https://gi.org/guidelines/). Эти источники поддерживают различение подтверждённой пищевой аллергии и целиакии; приложение не ставит и не подтверждает диагноз.

## 4. Точный перечень пункта 14 части 4.4 ТР ТС 022/2011

Регламент вводит перечень словами: «К наиболее распространенным компонентам, употребление которых может вызвать аллергические реакции или противопоказано при отдельных видах заболеваний, относятся:»

1. «арахис и продукты его переработки»;
2. «аспартам и аспартам-ацесульфама соль»;
3. «горчица и продукты ее переработки»;
4. «диоксид серы и сульфиты, если их общее содержание составляет более 10 миллиграммов на один килограмм или 10 миллиграммов на один литр в пересчете на диоксид серы»;
5. «злаки, содержащие глютен, и продукты их переработки»;
6. «кунжут и продукты его переработки»;
7. «люпин и продукты его переработки»;
8. «моллюски и продукты их переработки»;
9. «молоко и продукты его переработки (в том числе лактоза)»;
10. «орехи и продукты их переработки»;
11. «ракообразные и продукты их переработки»;
12. «рыба и продукты ее переработки (кроме рыбного желатина, используемого в качестве основы в препаратах, содержащих витамины и каротиноиды)»;
13. «сельдерей и продукты его переработки»;
14. «соя и продукты ее переработки»;
15. «яйца и продукты их переработки».

Это не следует целиком называть «списком пищевых аллергенов»: формулировка регламента объединяет компоненты, способные вызывать аллергические реакции, и компоненты, противопоказанные при отдельных заболеваниях.

Пункт 13 требует указывать такие компоненты в составе независимо от количества. Пункт 15 отдельно требует для аспартама и аспартам-ацесульфама соли надпись «Содержит источник фенилаланина». Пункт 17 требует указывать возможное наличие компонентов непосредственно после состава, если они не использовались при производстве, но полностью исключить их наличие невозможно.

## 5. Разделение доменов

| Контекст | Решение Phase 3B2A | Причина |
|---|---|---|
| Пользователь сообщил о пищевой аллергии | **approved** | нужен exact hard-exclusion context до будущего ранжирования |
| Целиакия | **approved, отдельный status** | не является пищевой аллергией или wheat allergy |
| Непереносимость лактозы | **deferred** | не равна аллергии на молоко; для неё нет утверждённой policy ближайшего каталога |
| Фенилкетонурия / исключение аспартама | **deferred** | медицински значимый отдельный домен; нельзя сводить к allergy enum |
| Чувствительность к сульфитам | **deferred** | требует порога, контекста и отдельного safety design |
| Другие непереносимости и медицинские ограничения | **deferred** | нельзя автоматически переводить в продукты без отдельной policy |
| Dietary pattern | **approved, отдельный немедицинский status** | требуется для будущей детерминированной совместимости каталога |

Отложенные контексты не интерпретируются как отсутствие ограничений. Если они появятся из неподдерживаемого/старого payload, concrete capability остаётся `abstract_only`. Остаточный риск отложения — каталог Phase 3B2B не сможет безопасно выдавать конкретные примеры пользователям, которым требуется учитывать эти ограничения; он должен честно удерживать concrete output до отдельного этапа.

## 6. Выбор российской allergy taxonomy

### Сравнение вариантов

| Критерий | A. Только umbrella ТР ТС | B. Только детальные подтипы | C. Гибрид |
|---|---|---|---|
| Безопасность | консервативна, но часто чрезмерно широка | риск пропустить umbrella-маркировку | **лучший вариант: exact input + обязательный umbrella mapping** |
| Понятность | знакома по маркировке, но груба | понятна пользователю при известном источнике | подтип с видимой группой |
| Over-exclusion | высокий для злаков/орехов/рыбы | ниже | управляемый, но до verified metadata применяется umbrella-консерватизм |
| Under-exclusion | ниже при точном label matching | высокий без umbrella mapping | ниже при сохранении обоих уровней |
| Соответствие маркировке РФ | прямое | неполное | **прямое через `regulatoryUmbrellaCode`** |
| Catalog filtering | грубое | точное только при полном составе | позволяет coarse label gate и future subtype metadata |
| Multiple allergies | set umbrella codes | set subtype codes | canonical set selectable codes + derived umbrella set |
| Versioning | простое | сложнее | явные версии taxonomy и mapping |
| Тестируемость | высокая | высокая при полном mapping | высокая при закрытой таблице mapping |

**Approved: вариант C, гибрид.** Пользователь выбирает точный доступный подтип; future catalog хранит и проверяет соответствующую umbrella-категорию ТР ТС 022/2011. До появления human-reviewed metadata подтип не снимает umbrella hard exclusion.

## 7. Утверждённая taxonomy

### Версии и scope

- `taxonomyVersion`: `nutrimind.food-allergen.ru.v1` — **approved**;
- `marketScopeVersion`: `nutrimind.market.ru.v1` — **approved**;
- `regulatoryScope`: `EAEU / Russian Federation` — **approved**;
- taxonomy не заявляется исчерпывающей медицинской или юридической классификацией.

### Exact selectable codes, labels and hierarchy

| Порядок | Selectable code | Точная русская label | Regulatory umbrella code | Решение |
|---:|---|---|---|---|
| 1 | `peanut` | `Арахис` | `eaeu_peanut` | **approved** |
| 2 | `mustard` | `Горчица` | `eaeu_mustard` | **approved** |
| 3 | `wheat` | `Пшеница` | `eaeu_gluten_cereals` | **approved** |
| 4 | `rye` | `Рожь` | `eaeu_gluten_cereals` | **approved** |
| 5 | `barley` | `Ячмень` | `eaeu_gluten_cereals` | **approved** |
| 6 | `oats` | `Овёс` | `eaeu_gluten_cereals` | **approved** |
| 7 | `other_gluten_cereal` | `Другой злак, содержащий глютен` | `eaeu_gluten_cereals` | **approved; unresolved for concrete catalog** |
| 8 | `sesame` | `Кунжут` | `eaeu_sesame` | **approved** |
| 9 | `lupin` | `Люпин` | `eaeu_lupin` | **approved** |
| 10 | `molluscs` | `Моллюски` | `eaeu_molluscs` | **approved** |
| 11 | `milk` | `Молоко` | `eaeu_milk` | **approved; не означает lactose intolerance** |
| 12 | `tree_nuts` | `Орехи` | `eaeu_nuts` | **approved umbrella selection** |
| 13 | `crustaceans` | `Ракообразные` | `eaeu_crustaceans` | **approved** |
| 14 | `fish` | `Рыба` | `eaeu_fish` | **approved umbrella selection** |
| 15 | `celery` | `Сельдерей` | `eaeu_celery` | **approved** |
| 16 | `soy` | `Соя` | `eaeu_soy` | **approved** |
| 17 | `egg` | `Яйца` | `eaeu_eggs` | **approved** |

`other_gluten_cereal` — закрытый escape code, а не free text; он делает normalized state `unresolved` и capability `abstract_only`. Неизвестный аллерген вне списка выражается статусом `other`, без свободного текста.

### Злаки

**Approved:** отдельные `wheat`, `rye`, `barley`, `oats` и escape `other_gluten_cereal`, все с mapping в `eaeu_gluten_cereals`. `gluten` не является пользовательским allergy code. Подтип не даёт права автоматически разрешать продукт, на маркировке которого есть umbrella «злаки, содержащие глютен». Овёс не разрешается автоматически при целиакии.

### Орехи

**Approved:** selectable umbrella `tree_nuts` с label `Орехи`. Species-level коды **deferred** до появления российского каталога с доказуемым составом и двусторонним mapping. Это избегает ложной точности: текущая маркировка может сообщать umbrella без вида. Арахис остаётся отдельным `peanut` и не входит в `tree_nuts`.

### Рыба и морепродукты

**Approved:** три самостоятельных кода `fish`, `crustaceans`, `molluscs`; общего кода `seafood` нет. Species-level fish/crustacean/mollusc codes **deferred**. Исключение для рыбного желатина является metadata конкретного ингредиента/применения, а не причиной снять пользовательский hard exclusion при normalization.

### Аспартам, сульфиты и лактоза

- `aspartame` в allergy codes — **rejected**; отдельное поле Phase 3B2A — **deferred**. Future policy должна учитывать phenylalanine-related restriction и маркировку, не диагностируя фенилкетонурию.
- `sulphites` в allergy codes — **rejected**; отдельное поле — **deferred**. Требуются единицы, порог более 10 мг/кг или 10 мг/л в пересчёте на SO₂ и отдельный safety design.
- `lactose` в allergy codes — **rejected**; отдельное поле lactose intolerance — **deferred**. Аллергия на молоко (`milk`) и непереносимость лактозы не взаимозаменяемы.

## 8. Regulatory exceptions и future catalog

**Approved:** Phase 3B2A не реализует exception engine. Прямо применимое исключение пункта 14 — рыбный желатин, используемый как основа в препаратах с витаминами и каротиноидами. Порог диоксида серы/сульфитов и предупреждение об источнике фенилаланина также являются product/label policy, а не questionnaire normalization.

Future catalog metadata должно хранить как минимум:

- exact ingredients и составные компоненты;
- `regulatoryUmbrellaCodes` по версии mapping;
- subtype codes только при подтверждённых данных;
- `contains`, `mayContain`, `notUsedButPresenceCannotBeExcluded`;
- применимое regulatory exception с rule ID, назначением ингредиента и доказательством;
- label text, jurisdiction, source/version, `reviewedAt`, reviewer role и review status;
- gluten relationship, celiac eligibility и необходимость проверки маркировки;
- catalog и taxonomy versions.

Questionnaire normalization никогда не снимает hard exclusion из-за регуляторного исключения. Future catalog проверяет состав, назначение ингредиента и маркировку; при неполных данных entity не допускается. Формулировка о возможном наличии не является гарантией отсутствия cross-contact.

## 9. Catalog-supported subset

| Вариант | Решение |
|---|---|
| A. `[]` до появления каталога | **approved** |
| B. Все normalized codes заранее считать поддержанными | **rejected: ложное обещание покрытия** |
| C. Создавать subset вместе с полностью проверенными entities | **approved future policy** |

Exact Phase 3B2A value:

```ts
catalogSupportedAllergenCodes: readonly []
catalogCoverageVersion: "nutrimind.catalog-coverage.none.v1"
```

Пустой subset означает, что concrete catalog capability недоступна для всех контекстов. Он никогда не означает unrestricted. Phase3B1 abstract slots остаются доступными при валидном Phase3A parent.

## 10. Exact questionnaire decision

Анкета остаётся ровно из девяти разделов. В существующий раздел 4 `Безопасность` помещаются allergy и celiac; в существующий раздел 5 `Текущее питание` — dietary pattern. Нового раздела нет.

### Поля и UI values

1. `foodAllergyStatus` — вопрос `Есть ли пищевые аллергены, которые вам необходимо исключать?`

   - `none` — `Нет известных пищевых аллергий`;
   - `known` — `Да, укажу аллергены`;
   - `other` — `Другой аллерген`;
   - `not_sure` — `Не уверен(а), какой именно`;
   - `prefer_not_to_say` — `Предпочитаю не указывать`.

2. `foodAllergenCodes` — условный multi-select `Какие пищевые аллергены вам необходимо исключать? Можно выбрать несколько.` Значения — exact selectable codes из раздела 7.

3. `celiacStatus` — вопрос `Указывали ли вам ранее, что у вас целиакия?`

   - `no` — `Нет`;
   - `confirmed` — `Да`;
   - `not_sure` — `Не уверен(а)`;
   - `prefer_not_to_say` — `Предпочитаю не указывать`.

   Подсказка: `Ответ используется только для ограничения доступности примеров и не является подтверждением диагноза.`

4. `dietaryPattern` — вопрос `Какой вариант лучше всего описывает ваш текущий тип питания?`

   - `omnivore` — `Ем продукты растительного и животного происхождения`;
   - `vegetarian` — `Не ем мясо, птицу, рыбу и морепродукты; могу употреблять яйца и молочные продукты`;
   - `vegan` — `Не употребляю продукты животного происхождения`;
   - `pescatarian` — `Не ем мясо и птицу; употребляю рыбу или морепродукты`;
   - `other` — `Другой тип питания`;
   - `not_sure` — `Не уверен(а), какой вариант подходит`;
   - `prefer_not_to_say` — `Предпочитаю не указывать`.

### Поведение

- `none` взаимно исключает любые codes;
- `known` требует минимум один supported selectable code;
- дубликаты удаляются, порядок приводится к порядку taxonomy;
- `other`, `not_sure`, `prefer_not_to_say`, missing, empty, unknown, unsupported и malformed не превращаются в `none`;
- `other_gluten_cereal` сохраняется как unresolved escape и не разрешает concrete output;
- скрытие conditional list очищает stale codes;
- free text отсутствует;
- старый `selections[3]` не мигрируется в точный контекст;
- dietary pattern не выводится из цели, спорта, аллергии или иных ответов;
- отдельные поля lactose/sulphites/aspartame сейчас не добавляются — **deferred** по data minimization.

## 11. Exact normalized contract

```ts
type FoodAllergyStatus =
  | "none"
  | "known"
  | "other"
  | "not_sure"
  | "prefer_not_to_say"
  | "not_provided"
  | "unsupported";

type CeliacStatus =
  | "no"
  | "confirmed"
  | "not_sure"
  | "prefer_not_to_say"
  | "not_provided"
  | "unsupported";

type DietaryPattern =
  | "omnivore"
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "other"
  | "not_sure"
  | "prefer_not_to_say"
  | "not_provided"
  | "unsupported";

type RestrictionContextV1 = {
  schemaVersion: "nutrimind.phase3b2.restriction-context.v1";
  marketScopeVersion: "nutrimind.market.ru.v1";
  regulatoryScope: "EAEU / Russian Federation";
  taxonomyVersion: "nutrimind.food-allergen.ru.v1";
  catalogCoverageVersion: "nutrimind.catalog-coverage.none.v1";
  status: "eligible" | "restrictions_present" | "unresolved" |
    "not_provided" | "unsupported" | "malformed";
  foodAllergyStatus: FoodAllergyStatus;
  foodAllergenCodes: FoodAllergenCode[];
  regulatoryUmbrellaCodes: RegulatoryUmbrellaCode[];
  celiacStatus: CeliacStatus;
  dietaryPattern: DietaryPattern;
  catalogSupportedAllergenCodes: [];
  capability: "abstract_only";
  warningCodes: WarningCode[];
  errorCodes: ErrorCode[];
  ruleIds: RuleId[];
};
```

Contract rules — **approved**:

- schema is strict: exact keys, closed enums, no extras and no best-effort repair;
- UI produces only UI values; `not_provided`, `unsupported`, `malformed` are normalization/parser outcomes;
- `regulatoryUmbrellaCodes` are deterministically derived from exact taxonomy mapping, never supplied by free text;
- `none` requires `foodAllergenCodes: []`; `known` requires a nonempty exact supported set;
- any unknown member invalidates the whole submitted set; a partially supported set is not usable;
- celiac never appears in `foodAllergenCodes`;
- contract contains no kcal, macros, hydration, REE, PAL, Phase2D1/Phase3A payload, journal, labs, broad medical answers, raw questionnaire, UI labels, free text or products.

### Storage

- exact key: `nutrimind.phase3b2.restriction-context.v1` — **approved**;
- medium: `sessionStorage` only — **approved**;
- clear the key at the beginning of every new submit, then write only a successfully validated strict object;
- failed normalization cannot retain stale usable context;
- localStorage, IndexedDB, cookies, URL, server persistence, analytics and network transfer — **rejected**;
- Phase2D1, Phase3A and Phase3A2 keys/lifecycles remain unchanged.

## 12. Capability precedence

Precedence is fail-closed and ordered:

1. missing/invalid Phase3A parent affects Phase3A/route under existing rules; restriction context does not alter those contracts;
2. missing JSON, parse error, wrong schema/market/taxonomy/coverage version or extra key → `malformed`/`unsupported` → `abstract_only`;
3. contradictory allergy state/codes, unknown code or partial supported set → `malformed`/`unsupported` → `abstract_only`;
4. `other`, `not_sure`, `prefer_not_to_say`, `not_provided`, `unsupported`, `other_gluten_cereal` → `abstract_only`;
5. confirmed celiac remains separate and would require future reviewed celiac catalog policy; now → `abstract_only`;
6. even fully resolved allergy/celiac/pattern input remains `abstract_only`, because `catalogSupportedAllergenCodes: []` and no catalog exists;
7. Phase3B1 remains available whenever its current Phase3A parent is valid;
8. no empty result or unavailable catalog may fall back to unrestricted examples.

Phase 3B2B may introduce a new nonempty coverage version only together with fully reviewed entities and deterministic gates. It must not reinterpret this v1 `none` from missing or legacy data.

## 13. Old sessions

**Approved:** old, missing, malformed, neutral-union, unknown-version and legacy `selections[3]` sessions fail closed only for future concrete Phase3B2 output. They retain existing valid Phase3A1, Phase3A2 and Phase3B1 behavior. No old marker is migrated to `none`, `known`, celiac or dietary pattern. Пользователь должен заново явно пройти обновлённую анкету для создания v1 российского restriction context.

## 14. Adversarial check

| # | Проверка | Результат |
|---:|---|---|
| 1 | Весь перечень ТР ТС назван аллергенами? | нет; зафиксирована смешанная нормативная формулировка |
| 2 | Целиакия смешана с аллергией? | нет; отдельный status |
| 3 | Лактоза смешана с milk allergy? | нет; lactose deferred |
| 4 | Аспартам смешан с пищевой аллергией? | нет; отдельный deferred domain |
| 5 | Сульфиты стали обычным allergen code без порога? | нет; deferred с точным порогом в policy |
| 6 | Umbrella «орехи» создаёт ложную точность? | нет; label прямо umbrella, species-level deferred |
| 7 | Конкретная аллергия теряется внутри umbrella? | для злаков сохраняется subtype + umbrella; для орехов/рыбы детализация не обещается |
| 8 | Taxonomy обещает юридическое соответствие продукта? | нет; нужны entity, label и human review |
| 9 | Missing/unknown разрешает concrete examples? | нет |
| 10 | Старый session unrestricted? | нет |
| 11 | EU/US exception применяется в РФ? | нет |
| 12 | Собираются лишние медицинские данные? | нет; lactose/aspartame/sulphites и иные ограничения deferred |

## 15. Остаточные риски и граница Phase 3B2B

- Перечень ТР ТС — маркировочный и смешанный, не исчерпывает индивидуальные клинические реакции.
- Umbrella-категории могут давать over-exclusion, но до verified metadata это безопаснее under-exclusion.
- `tree_nuts` и `fish` не дают species-level точности; такая точность отложена намеренно.
- Для `other` и неподдерживаемых аллергенов нет free-text интерпретации; concrete output удерживается.
- Маркировка и рецептура могут меняться; human review имеет срок и не гарантирует отсутствие cross-contact.
- Целиакия требует отдельной catalog policy, проверки маркировки и gluten relationship; овёс не разрешается автоматически.
- Отложенные lactose/aspartame/sulphites ограничивают аудиторию будущего каталога; эти пользователи не должны получать concrete output без следующего safety design.
- `catalogSupportedAllergenCodes: []` означает, что Phase 3B2A нормализует контекст, но ничего конкретного не разрешает.

Phase 3B2A утверждает только поля, deterministic normalization, strict session contract и capability computation. Phase 3B2B — отдельный human-reviewed каталог и coverage version; Phase 3B2C — отдельный workflow для other/unresolved; Phase 3B3 — состав, порции и macro reconciliation. Ни один из этих этапов здесь не начат.

## 16. Финальный design lock

Все implementation-blocking решения Phase 3B2A закрыты:

- рынок и scope — **approved**;
- exact taxonomy/version/labels/order/mapping — **approved**;
- questionnaire fields/statuses/values — **approved**;
- celiac separation — **approved**;
- dietary pattern values — **approved**;
- lactose/aspartame/sulphites — **deferred, not silently normalized**;
- catalog subset `[]` — **approved**;
- strict contract/key/lifecycle — **approved**;
- capability precedence и old-session behavior — **approved**;
- EU/US normative union, free text, fuzzy/substring/LLM classification, exception engine и unrestricted fallback — **rejected**.

Design lock не является разрешением на реализацию. Следующий шаг возможен только по отдельной инструкции владельца.

## 17. Final implementation lock

Статус этого раздела: **approved; не tentative; не example; не subject to implementation choice**. При расхождении с ранними формулировками этого audit применяются точные значения ниже.

### Presentation groups

Группы являются только UI metadata: не являются allergen/umbrella codes, не сохраняются в context и не участвуют в normalization, capability или filtering.

| Order | Group ID | Русская label | Exact allergen-code order |
|---:|---|---|---|
| 1 | `gluten_cereals` | `Злаки, содержащие глютен` | `wheat`, `rye`, `barley`, `oats`, `other_gluten_cereal` |
| 2 | `nuts_peanuts_sesame` | `Орехи, арахис и кунжут` | `tree_nuts`, `peanuts`, `sesame` |
| 3 | `fish_and_seafood` | `Рыба и морепродукты` | `fish`, `crustaceans`, `molluscs` |
| 4 | `milk_and_eggs` | `Молоко и яйца` | `milk`, `eggs` |
| 5 | `other_allergens` | `Другие аллергены` | `soybeans`, `celery`, `mustard`, `lupin` |

Каждый из 17 codes находится ровно в одной непустой группе. Арахис не является орехом; `seafood` не является selectable code; лактоза не является allergy code.

### Canonical user allergen codes and EAEU mapping

Canonical taxonomy/display order равен последовательности групп выше:

| Code | Exact Russian label | EAEU umbrella ID |
|---|---|---|
| `wheat` | `Пшеница` | `eaeu_gluten_cereals` |
| `rye` | `Рожь` | `eaeu_gluten_cereals` |
| `barley` | `Ячмень` | `eaeu_gluten_cereals` |
| `oats` | `Овёс` | `eaeu_gluten_cereals` |
| `other_gluten_cereal` | `Другой злак, содержащий глютен` | `eaeu_gluten_cereals` |
| `tree_nuts` | `Орехи` | `eaeu_tree_nuts` |
| `peanuts` | `Арахис` | `eaeu_peanuts` |
| `sesame` | `Кунжут` | `eaeu_sesame` |
| `fish` | `Рыба` | `eaeu_fish` |
| `crustaceans` | `Ракообразные` | `eaeu_crustaceans` |
| `molluscs` | `Моллюски` | `eaeu_molluscs` |
| `milk` | `Молоко` | `eaeu_milk` |
| `eggs` | `Яйца` | `eaeu_eggs` |
| `soybeans` | `Соя` | `eaeu_soybeans` |
| `celery` | `Сельдерей` | `eaeu_celery` |
| `mustard` | `Горчица` | `eaeu_mustard` |
| `lupin` | `Люпин` | `eaeu_lupin` |

Предыдущие singular architecture codes `peanut`, `egg`, `soy` заменены окончательными `peanuts`, `eggs`, `soybeans`. Запрещены selectable codes `gluten`, `cereals_containing_gluten`, `seafood`, `lactose`, `sulphites`, `aspartame`, `phenylalanine` и individual tree-nut species. Umbrella IDs — только future catalog metadata и не сохраняются в пользовательском context.

### WarningCode

Закрытый enum и canonical order:

1. `CATALOG_NOT_IMPLEMENTED`
2. `CATALOG_COVERAGE_EMPTY`
3. `REGULATORY_EXCEPTIONS_NOT_MODELED`
4. `PRODUCT_CROSS_CONTACT_NOT_ASSESSED`
5. `DEFERRED_RESTRICTION_DOMAINS_NOT_COVERED`
6. `RESTRICTION_CONTEXT_UNRESOLVED`
7. `RESTRICTION_CONTEXT_NOT_PROVIDED`
8. `RESTRICTION_CONTEXT_UNSUPPORTED`
9. `RESTRICTION_CONTEXT_MALFORMED`

Каждый сохранённый valid context содержит первые пять codes. `unresolved`, `not_provided`, `unsupported`, `malformed` добавляют соответственно один status-specific code; `resolved` не добавляет. Codes deduplicated и canonical-order. Отсутствующий/старый session не создаётся искусственно.

### ErrorCode

Закрытый enum и canonical order:

1. `ALLERGY_STATUS_NOT_PROVIDED`
2. `ALLERGY_STATUS_UNSUPPORTED`
3. `ALLERGY_STATUS_MALFORMED`
4. `ALLERGEN_CODES_REQUIRED`
5. `ALLERGEN_CODES_FORBIDDEN`
6. `ALLERGEN_CODES_MALFORMED`
7. `ALLERGEN_CODE_UNSUPPORTED`
8. `CELIAC_STATUS_NOT_PROVIDED`
9. `CELIAC_STATUS_UNSUPPORTED`
10. `CELIAC_STATUS_MALFORMED`
11. `DIETARY_PATTERN_NOT_PROVIDED`
12. `DIETARY_PATTERN_UNSUPPORTED`
13. `DIETARY_PATTERN_MALFORMED`
14. `CONTEXT_JSON_MALFORMED`
15. `CONTEXT_SCHEMA_UNSUPPORTED`
16. `CONTEXT_MARKET_UNSUPPORTED`
17. `CONTEXT_TAXONOMY_UNSUPPORTED`
18. `CONTEXT_CATALOG_COVERAGE_UNSUPPORTED`
19. `CONTEXT_SHAPE_MALFORMED`
20. `CONTEXT_STATUS_CONFLICT`

Missing/empty field → corresponding `*_NOT_PROVIDED`; unknown string → `*_UNSUPPORTED`; wrong type/structure → `*_MALFORMED`. `known` without nonempty supported array → `ALLERGEN_CODES_REQUIRED`. Codes with `none`, `other`, `not_sure`, `withheld` or `not_provided` → `ALLERGEN_CODES_FORBIDDEN`. Non-string array → `ALLERGEN_CODES_MALFORMED`. Любой unknown string code → `ALLERGEN_CODE_UNSUPPORTED`; mixed set целиком unsupported, raw value не хранится. Parser meanings follow the exact `CONTEXT_*` names. Codes deduplicated, canonical-order and contain no raw values or UI labels.

Overall status precedence: `malformed` → `unsupported` → `unresolved` → `not_provided` → `resolved`. `resolved` and `unresolved` may have `errorCodes: []`; not-provided, unsupported and malformed retain their field/parser errors.

### RuleId

Каждый successfully created and validated context содержит полный массив в canonical order:

1. `FOOD_RESTRICTION.RU_MARKET_SCOPE.001`
2. `FOOD_RESTRICTION.EXPLICIT_NONE_ONLY.001`
3. `FOOD_RESTRICTION.MULTIPLE_EXACT_CODES.001`
4. `FOOD_RESTRICTION.UNKNOWN_FAIL_CLOSED.001`
5. `FOOD_RESTRICTION.NO_FUZZY_MATCHING.001`
6. `FOOD_RESTRICTION.CELIAC_SEPARATE.001`
7. `FOOD_RESTRICTION.DIETARY_PATTERN_SEPARATE.001`
8. `FOOD_RESTRICTION.DEFERRED_DOMAINS_EXCLUDED.001`
9. `FOOD_RESTRICTION.REGULATORY_EXCEPTIONS_NOT_MODELED.001`
10. `FOOD_RESTRICTION.CATALOG_NOT_IMPLEMENTED.001`
11. `FOOD_RESTRICTION.CATALOG_COVERAGE_EMPTY.001`
12. `FOOD_RESTRICTION.OLD_SESSION_NO_CONCRETE_OUTPUT.001`
13. `FOOD_RESTRICTION.PHASE3A_REMAINS_AVAILABLE.001`
14. `FOOD_RESTRICTION.PHASE3B1_REMAINS_AVAILABLE.001`
15. `FOOD_RESTRICTION.SESSION_ONLY.001`
16. `FOOD_RESTRICTION.NO_PRODUCT_SAFETY_GUARANTEE.001`

Rule IDs — stable application-policy metadata; не зависят от ответов, не меняют capability, не попадают в Phase3A/Phase3A2/URL и не являются UI labels. Старый/отсутствующий context не создаётся ради RuleId.

### Contract minimization correction

Context хранит только stable user/domain codes, exact WarningCode/ErrorCode/RuleId и version discriminators. В отличие от предварительного контракта раздела 11 он **не хранит** presentation group IDs, `regulatoryUmbrellaCodes`, EAEU mapping IDs, русские labels, raw unsupported values, нормативные тексты, source URLs или продукты. Exact field name для market discriminator: `marketVersion`.

Overall statuses: `resolved | unresolved | not_provided | unsupported | malformed`. Exact capability/future-filter value: `futureFilterMode: "abstract_only"`; пустое coverage никогда не означает unrestricted.
