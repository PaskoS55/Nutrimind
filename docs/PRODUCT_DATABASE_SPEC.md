# NutriMind by Pasko — Product Database Specification

Версия: `0.1.1-draft`  
Статус: архитектурная основа для проверки; не для публикации и реальных пользователей  
Связанные документы: [`NUTRIMIND_SURVEY_SPEC.md`](./NUTRIMIND_SURVEY_SPEC.md), [`CALCULATION_CORE_SPEC.md`](./CALCULATION_CORE_SPEC.md)

## 1. Цель

База должна позволять NutriMind:

- хранить продукты, ингредиенты, блюда и брендированные товары отдельно;
- проверять аллерген на уровне продукта, ингредиента и возможных следов;
- учитывать непереносимости и медицинские ограничения отдельно от аллергий;
- ранжировать только уже безопасные продукты;
- показывать происхождение нутриентных данных;
- воспроизводить результат по версии данных;
- не рекомендовать продукт при неполной информации о безопасности.

## 2. Основной принцип безопасности

```text
неизвестно ≠ безопасно
```

Если для продукта отсутствует обязательная аллергенная информация, он получает статус `safety_unknown` и не участвует в персональных рекомендациях пользователю с аллергией.

## 3. Типы сущностей

| Сущность | Назначение |
|---|---|
| `food_item` | единица подбора: продукт, ингредиент, блюдо или брендированный товар |
| `food_variant` | форма продукта: сырой, приготовленный, замороженный, безлактозный и т. п. |
| `nutrient` | справочник нутриентов и единиц |
| `food_nutrient` | значение нутриента на 100 г, 100 мл или порцию |
| `allergen` | нормализованный справочник аллергенов |
| `food_allergen` | связь продукта с аллергеном и типом доказательства |
| `ingredient` | нормализованный ингредиент |
| `food_ingredient` | состав продукта с порядком и долей, если известна |
| `dietary_flag` | глютен, лактоза, веганский статус и другие технологические свойства |
| `medical_constraint_rule` | ссылка на правило, требующее исключения или ручной проверки |
| `portion` | бытовая порция и масса |
| `source_record` | происхождение и дата данных |
| `market_availability` | страна, язык, GTIN, бренд и статус продажи |

## 4. Таблица `food_item`

| Поле | Тип | Обязательное | Описание |
|---|---|---:|---|
| `id` | UUID | да | внутренний неизменяемый идентификатор |
| `canonical_name` | text | да | нормализованное название |
| `display_name_ru` | text | да | название для интерфейса |
| `display_name_en` | text | нет | международное название |
| `food_type` | enum | да | `generic`, `ingredient`, `recipe`, `branded` |
| `category_id` | FK | да | категория NutriMind |
| `foodex2_code` | text | нет | код классификации EFSA FoodEx2 |
| `fdc_id` | text | нет | идентификатор USDA FoodData Central |
| `gtin` | text | нет | штрихкод брендированного продукта |
| `brand_name` | text | нет | бренд |
| `market_country` | ISO-3166 | нет | рынок конкретного товара |
| `data_quality_grade` | enum | да | `A`, `B`, `C`, `D`, `blocked` |
| `safety_status` | enum | да | `verified`, `partial`, `unknown`, `blocked` |
| `version` | integer | да | версия записи |
| `valid_from` | datetime | да | начало действия |
| `valid_to` | datetime | нет | конец действия |
| `is_active` | boolean | да | доступность для новых рекомендаций |

FoodEx2 используется как внешний классификационный слой, а не как единственный источник нутриентов. EFSA описывает FoodEx2 как стандартизированную систему классификации и описания пищевых продуктов: [EFSA Data Standardisation](https://www.efsa.europa.eu/en/data/data-standardisation).

## 5. Нутриенты

### 5.1. Таблица `nutrient`

```text
id
code
name_ru
name_en
unit
nutrient_group
reference_basis
source_priority
```

Минимальный набор:

- энергия, ккал и кДж;
- белок;
- жиры;
- насыщенные жирные кислоты;
- углеводы;
- сахара;
- клетчатка;
- натрий и соль;
- калий;
- кальций;
- магний;
- железо;
- цинк;
- селен;
- витамин D;
- витамин B12;
- фолаты;
- витамин C;
- тиамин, рибофлавин, ниацин;
- омега‑3: ALA, EPA, DHA;
- вода;
- холестерин — как информационное поле, без автоматического медицинского вывода.

### 5.2. Таблица `food_nutrient`

| Поле | Описание |
|---|---|
| `food_item_id` | продукт |
| `nutrient_id` | нутриент |
| `amount` | числовое значение |
| `unit` | единица |
| `basis_amount` | обычно 100 |
| `basis_unit` | `g`, `ml`, `serving` |
| `method` | `analytical`, `label`, `calculated`, `imputed`, `unknown` |
| `min_value`, `max_value` | диапазон, если источник его даёт |
| `sample_count` | число образцов, если доступно |
| `source_record_id` | происхождение |
| `measured_at` | дата измерения |

Нельзя смешивать значения «на порцию» и «на 100 г» без явного преобразования.

## 6. Аллергены

### 6.1. Таксономия

Справочник хранит:

```text
id
canonical_code
parent_id
display_name
synonyms[]
jurisdictions[]
cross_reactivity_group
default_policy
```

Минимальный европейский набор следует Annex II Regulation (EU) No 1169/2011:

1. злаки, содержащие глютен;
2. ракообразные;
3. яйца;
4. рыба;
5. арахис;
6. соя;
7. молоко;
8. орехи с отдельными дочерними типами;
9. сельдерей;
10. горчица;
11. кунжут;
12. диоксид серы и сульфиты выше установленного порога;
13. люпин;
14. моллюски.

Источник: [Regulation (EU) No 1169/2011, Annex II](https://eur-lex.europa.eu/eli/reg/2011/1169/oj/eng) и [разъяснение Европейской комиссии](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=oj%3AJOC_2017_428_R_0001).

Архитектура должна поддерживать отдельные региональные наборы. Нельзя считать европейский перечень исчерпывающим для всех стран.

### 6.2. Таблица `food_allergen`

| Поле | Допустимые значения |
|---|---|
| `food_item_id` | UUID |
| `allergen_id` | UUID |
| `relation` | `contains`, `derived_from`, `may_contain`, `cross_contact`, `free_from_claim`, `unknown` |
| `source` | `ingredient_list`, `manufacturer_statement`, `lab_test`, `curator`, `inferred` |
| `confidence` | `verified`, `high`, `medium`, `low` |
| `jurisdiction` | ISO/регион |
| `label_text` | исходный текст маркировки |
| `verified_at` | дата |
| `expires_at` | срок повторной проверки |

### 6.3. Карта анкеты к таксономии

| Ответ анкеты | Блокируемые коды |
|---|---|
| Молоко | `milk` и все производные, включая безлактозные молочные продукты |
| Яйца | `egg` и яйца всех птиц |
| Арахис | `peanut` |
| Орехи | все дочерние `tree_nut:*`; арахис отдельно |
| Рыба | `fish:*`; морепродукты отдельно |
| Морепродукты | `crustacean:*`, `mollusc:*`; рыба отдельно |
| Пшеница | `wheat`; не эквивалентна автоматически всем глютеновым злакам |
| Соя | `soy` |
| Кунжут | `sesame` |
| Другая | до классификации `safety_unknown`, рекомендации заблокированы |

## 7. Непереносимости и свойства продукта

Аллергия и непереносимость не объединяются.

### 7.1. Таблица `dietary_flag`

Примеры:

- `contains_lactose`;
- `lactose_free_certified`;
- `contains_gluten`;
- `gluten_free_certified`;
- `contains_fructose`;
- `contains_legumes`;
- `vegan`;
- `vegetarian`;
- `alcohol`;
- `caffeine`;
- `high_sodium`;
- `high_added_sugar`.

Пороговые свойства должны иметь:

```text
value
unit
threshold_rule_id
evidence_source
```

Флаг `lactose_free` не делает продукт безопасным при аллергии на молочный белок.

## 8. Ингредиенты и рецепты

### 8.1. Ингредиентный состав

```text
food_ingredient:
  food_item_id
  ingredient_id
  position
  percentage_min
  percentage_max
  is_compound_ingredient
  source_text
```

Аллергены блюда — объединение:

1. прямых аллергенов блюда;
2. аллергенов всех ингредиентов;
3. аллергенов составных ингредиентов;
4. возможных следов и перекрёстного контакта.

Ни один уровень вложенности не может быть пропущен.

### 8.2. Пересчёт рецепта

```text
RecipeNutrient =
Σ(IngredientWeight × NutrientPerGram × RetentionFactor)
÷ FinalRecipeWeight
```

`RetentionFactor` применяется только при наличии надёжного источника. В противном случае запись помечается `calculated_without_retention` и получает более низкую оценку качества.

## 9. Порции

```text
portion:
  id
  food_item_id
  label
  grams
  source
  min_grams
  max_grams
  locale
```

Рейтинг продуктов выполняется на стандартизованных данных на 100 г. Пользовательские объяснения могут показывать обычную порцию.

## 10. Источники и качество данных

Приоритет:

1. `A` — аналитические данные официальной базы или подтверждённая маркировка конкретного товара;
2. `B` — официальный расчётный/агрегированный источник;
3. `C` — маркировка без независимой проверки;
4. `D` — пользовательский или краудсорсинговый источник;
5. `blocked` — противоречивые или неполные сведения о безопасности.

Базовые источники:

- [USDA FoodData Central](https://fdc.nal.usda.gov/) — нутриентный состав и API; система содержит отдельные типы Foundation, FNDDS, Branded и другие: [документация](https://fdc.nal.usda.gov/data-documentation).
- [EFSA FoodEx2](https://www.efsa.europa.eu/en/data/data-standardisation) — классификация.
- [Open Food Facts API](https://openfoodfacts.github.io/openfoodfacts-server/api/) — вспомогательные данные брендированных товаров, ингредиентов и аллергенов; из-за краудсорсинговой природы не может единолично подтверждать безопасность.
- локальная редакционная база NutriMind — только с журналом изменений и источником каждой записи.

## 11. Проверка конфликтов источников

Если два источника расходятся:

1. аллергенная информация выбирает более строгий вариант;
2. аналитический официальный нутриент имеет приоритет над краудсорсинговым;
3. маркировка конкретного GTIN имеет приоритет для этого товара над средним значением категории;
4. конфликт не скрывается: `data_conflict = true`;
5. продукт исключается из персонального подбора до редакционной проверки, если конфликт касается безопасности.

## 12. Полнота данных и область блокировки

Полнота хранится не одним флагом:

```yaml
data_completeness:
  identity: complete | incomplete | conflicting
  nutrition: complete | partial | invalid
  ingredients: complete | partial | missing
  allergens: complete | partial | missing | conflicting
  provenance: complete | missing
  blocking_scope: none | allergic_users | role | all_users
```

| Ситуация | С аллергией | Без аллергии |
|---|---|---|
| Нет полного состава или аллергенной декларации | блокировать | разрешить только общую нутриентную роль без заявления об аллергенной безопасности |
| Не проверены возможные следы | блокировать | добавить `allergen_data_limited` |
| Противоречивые аллергенные источники | блокировать для всех | блокировать для всех |
| Неизвестна идентичность продукта | блокировать для всех | блокировать для всех |
| Нет обязательного нутриента для роли | блокировать роль | блокировать роль |
| Неверные единицы или отрицательные значения | блокировать для всех | блокировать для всех |
| Нет происхождения данных | блокировать для всех | блокировать для всех |

## 13. Исправленный пример generic-записи

Запись остаётся `generic`, поэтому не содержит производителя, GTIN или рынка. Источник нутриентов — официальный агрегированный источник, а не маркировка конкретного товара.

```json
{
  "id": "food_01H...",
  "canonical_name": "yogurt_greek_lactose_free_plain",
  "display_name_ru": "Йогурт греческий безлактозный",
  "food_type": "generic",
  "category_id": "fermented_dairy",
  "brand_name": null,
  "gtin": null,
  "market_country": null,
  "data_quality_grade": "B",
  "safety_status": "partial",
  "nutrients_per_100g": {
    "energy_kcal": 73,
    "protein_g": 9.5,
    "fat_g": 2.0,
    "carbohydrate_g": 4.1,
    "calcium_mg": 120
  },
  "allergens": [
    { "code": "milk", "relation": "contains", "confidence": "verified" }
  ],
  "dietary_flags": [
    {
      "code": "lactose_free_composition_variant",
      "value": true,
      "certification": false
    }
  ],
  "provenance": {
    "source": "official_aggregated_food_composition_database",
    "source_record_id": "resolved_at_import",
    "verified_at": "2026-07-30"
  },
  "data_completeness": {
    "identity": "complete",
    "nutrition": "complete",
    "ingredients": "partial",
    "allergens": "partial",
    "provenance": "complete",
    "blocking_scope": "allergic_users"
  }
}
```

Вывод:

- используется как агрегированный нутриентный шаблон;
- для рекомендации покупки требуется отдельная `branded`-запись с брендом, GTIN, рынком и актуальной маркировкой;
- при непереносимости лактозы конкретный товар требует подтверждения и учёта индивидуальной переносимости;
- запрещён при аллергии на молоко;
- generic-запись не подтверждает отсутствие следов у конкретного товара;
- не может называться «безмолочным».

## 14. Индексы и ограничения базы

Обязательные ограничения:

- уникальность активной версии `GTIN + market_country`;
- невозможность активировать продукт без `safety_status`;
- невозможность маркировать одновременно `contains(allergen)` и `free_from_claim(allergen)` без `data_conflict`;
- каскадная проверка аллергенов рецепта;
- журнал изменений для аллергенов, состава и медицинских флагов;
- мягкое удаление записей, использованных в старых отчётах.

Рекомендуемые индексы:

```text
food_item(canonical_name)
food_item(gtin, market_country)
food_allergen(food_item_id, allergen_id, relation)
food_nutrient(food_item_id, nutrient_id)
food_ingredient(food_item_id, ingredient_id)
dietary_flag(food_item_id, code)
```

## 15. Версионирование

- Каждый отчёт хранит версии продуктовой записи и источника.
- Обновление маркировки не переписывает старый отчёт.
- Критическое обновление аллергенов немедленно деактивирует старую запись для новых рекомендаций.
- Миграции справочника аллергенов требуют регрессионного запуска всех сценариев из `TEST_SCENARIOS.md`.
