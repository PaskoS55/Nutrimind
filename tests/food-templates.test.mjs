import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { getNeutralFoodGroupSlots, FOOD_TEMPLATE_POLICY_IDS } from "../core/food-templates/neutral-slots.ts";

const expected = [
  ["protein_source", "Источник белка"],
  ["carbohydrate_source", "Источник углеводов"],
  ["vegetables_fruit_berries", "Овощи, фрукты или ягоды"],
  ["fat_source", "Источник жиров"],
];

test("neutral template exposes exactly four ordered approved slots", () => {
  const slots = getNeutralFoodGroupSlots();
  assert.deepEqual(slots.map(({ id, label }) => [id, label]), expected);
  assert.deepEqual(slots.map((slot) => slot.displayOrder), [1, 2, 3, 4]);
  assert.equal(new Set(slots.map((slot) => slot.id)).size, 4);
});

test("neutral template is immutable and invariant across caller context", () => {
  const slots = getNeutralFoodGroupSlots();
  assert.equal(Object.isFrozen(slots), true);
  assert.equal(slots.every(Object.isFrozen), true);
  for (const _context of ["three_meals", "three_meals_plus_snack", "four_occasions", "snack", "lower", "central", "upper", "rest", "training", "double_training", "before_first", "adjacent", "after_last"]) assert.strictEqual(getNeutralFoodGroupSlots(), slots);
});

test("pure template has no product, portion, nutrition, restriction, browser, or network fields", () => {
  const serialized = JSON.stringify(getNeutralFoodGroupSlots());
  assert.doesNotMatch(serialized, /brand|ingredient|recipe|serving|portion|gram|kcal|calorie|proteinG|fatG|carbohydrateG|allergen.?safe|gluten.?free|vegan|vegetarian/i);
  const source = getNeutralFoodGroupSlots.toString();
  assert.doesNotMatch(source, /window|storage|fetch|react|questionnaire|goal|athlete|timing/i);
});

test("production markup uses native closed disclosure and exact safety language", () => {
  const source = readFileSync(new URL("../app/meal-structure/meal-structure-client.tsx", import.meta.url), "utf8");
  assert.match(source, /<details className="food-template-details">/);
  assert.doesNotMatch(source, /<details[^>]*\sopen(?:=|>)/);
  for (const text of ["Категории для самостоятельной сборки", "Категории не определяют конкретный продукт, порцию или состав блюда", "Необязательно использовать все категории в каждом приёме", "Рассчитанные КБЖУ и расположение приёмов не изменены", "риска перекрёстного контакта"]) assert.match(source, new RegExp(text));
});

test("Phase 3B1 adds no schema or storage transport", () => {
  const files = ["../core/food-templates/types.ts", "../core/food-templates/neutral-slots.ts"].map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");
  assert.doesNotMatch(files, /schemaVersion|sessionStorage|localStorage|indexedDB|cookie|URL|fetch|analytics/i);
});
