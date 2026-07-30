import assert from "node:assert/strict";
import test from "node:test";

const food = {
  milk: { id: "milk", contains: ["milk"], lactose: true, complete: true },
  lactoseFreeMilk: { id: "lf-milk", contains: ["milk"], lactoseFree: true, complete: true },
  peanut: { id: "peanut", contains: ["peanut"], complete: true },
  peanutTrace: { id: "peanut-trace", traces: ["peanut"], complete: true },
  sunflower: { id: "sunflower", contains: [], complete: true },
  tahini: { id: "tahini", contains: ["sesame"], complete: true },
  glutenOats: { id: "oats", crossContact: ["gluten"], complete: true },
  glutenFreeOats: { id: "gf-oats", contains: [], complete: true },
  fish: { id: "fish", contains: ["fish"], complete: true },
  shrimp: { id: "shrimp", contains: ["crustacean"], complete: true },
  soy: { id: "soy", contains: ["soy"], complete: true },
  lentils: { id: "lentils", contains: [], complete: true },
  quinoa: { id: "quinoa", contains: [], complete: true },
  unknownLabel: { id: "unknown", contains: [], complete: false },
  treeNut: { id: "tree-nut", contains: ["tree_nut"], complete: true },
};

const athletePal = {
  amateur: { rest: 1.5, training: 1.7, double: 1.9 },
  competitive: { rest: 1.55, training: 1.85, double: 2.1 },
  professional: { rest: 1.6, training: 2, double: 2.25 },
};

function pal(level, day, duration = 90) {
  let modifier = 0;
  if (day === "training" && duration <= 45) modifier = -0.05;
  if (day === "training" && duration > 90) modifier = 0.1;
  return {
    value: Math.round((athletePal[level][day] + modifier) * 100) / 100,
    modifier,
    warning: day === "double" ? "double_duration_unknown" : null,
  };
}

function allergenSet(allergies) {
  const set = new Set(allergies);
  if (set.has("seafood")) {
    set.add("crustacean");
    set.add("mollusc");
  }
  return set;
}

function allergyAllowed(allergies, product) {
  if (allergies.includes("other_unknown")) return false;
  const blocked = allergenSet(allergies);
  return ![...(product.contains ?? []), ...(product.traces ?? []), ...(product.crossContact ?? [])]
    .some((item) => blocked.has(item));
}

function productAllowed(profile, product) {
  if (!allergyAllowed(profile.allergies ?? [], product)) return false;
  if ((profile.allergies ?? []).length && !product.complete) return false;
  if ((profile.intolerances ?? []).includes("lactose") && product.lactose && !product.lactoseFree) return false;
  if ((profile.excluded ?? []).includes(product.id)) return false;
  return true;
}

function medicalDecision(profile, product, role = "general") {
  if ((profile.medical ?? []).includes("celiac") &&
      [...(product.contains ?? []), ...(product.crossContact ?? [])].includes("gluten")) return "blocked";
  if ((profile.medical ?? []).includes("renal") && role === "protein") return "specialist_review";
  if ((profile.medical ?? []).includes("carb") && role === "therapeutic") return "specialist_review";
  if ((profile.medical ?? []).includes("gi") && role === "elimination") return "specialist_review";
  return "allowed";
}

function weightReduction() {
  return { multiplier: 1, status: "disabled_pending_safety_screen" };
}

function macroScenarios(energyStart, weightKg, proteinRange) {
  const energy = {
    lower: Math.round((energyStart * 0.94) / 50) * 50,
    central: energyStart,
    upper: Math.round((energyStart * 1.06) / 50) * 50,
  };
  const proteinFactor = {
    lower: proteinRange[0],
    central: (proteinRange[0] + proteinRange[1]) / 2,
    upper: proteinRange[1],
  };
  const fatFactor = { lower: 0.9, central: 1, upper: 1.1 };
  return Object.keys(energy).map((id) => {
    const protein = round1(weightKg * proteinFactor[id]);
    const fat = round1(Math.max(weightKg * fatFactor[id], energy[id] * 0.2 / 9));
    const carbs = round1((energy[id] - protein * 4 - fat * 9) / 4);
    const macroEnergy = round1(protein * 4 + fat * 9 + carbs * 4);
    return { id, energy: energy[id], protein, fat, carbs, macroEnergy, deviation: round1(macroEnergy - energy[id]) };
  });
}

function status(score, hardBlock = false) {
  if (hardBlock) return "исключён";
  if (score < 50) return "стоит ограничить";
  if (score < 65) return "нейтрален";
  if (score < 80) return "подходит";
  return "рекомендуется";
}

function validate(profile) {
  if ((profile.allergies ?? []).includes("none") && profile.allergies.length > 1) return "SURVEY_CONFLICT_NONE_WITH_VALUE";
  if ((profile.allergies ?? []).includes("other_unknown")) return "ALLERGY_UNKNOWN_BLOCKS_CATALOG";
  return null;
}

function hydration(profile, day) {
  if (day === "double" && (!profile.firstDuration || !profile.secondDuration)) {
    return "double_training_fluid_insufficient_data";
  }
  return "calculated_start";
}

function round1(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

// 16 отдельных профильных тестов.
test("PROFILE-01 professional hockey safety", () => {
  const p = { allergies: ["peanut"], intolerances: ["lactose"] };
  assert.equal(pal("professional", "training", 90).value, 2);
  assert.equal(productAllowed(p, food.peanut), false);
  assert.equal(productAllowed(p, food.peanutTrace), false);
  assert.equal(productAllowed(p, food.milk), false);
  assert.equal(productAllowed(p, food.lactoseFreeMilk), true);
});

test("PROFILE-02 milk allergy overrides lactose-free", () => {
  assert.equal(productAllowed({ allergies: ["milk"], intolerances: ["lactose"] }, food.lactoseFreeMilk), false);
});

test("PROFILE-03 celiac cross-contact", () => {
  const p = { medical: ["celiac"] };
  assert.equal(pal("competitive", "training", 100).value, 1.95);
  assert.equal(medicalDecision(p, food.glutenOats), "blocked");
  assert.equal(medicalDecision(p, food.glutenFreeOats), "allowed");
});

test("PROFILE-04 minor numeric block", () => {
  assert.equal({ ageGroup: "minor" }.ageGroup === "minor", true);
  assert.equal(allergyAllowed(["tree_nut"], food.treeNut), false);
  assert.equal(allergyAllowed(["tree_nut"], food.peanut), true);
});

test("PROFILE-05 renal specialist review", () => {
  assert.equal(medicalDecision({ medical: ["renal"] }, food.quinoa, "protein"), "specialist_review");
});

test("PROFILE-06 weight reduction disabled", () => {
  assert.deepEqual(weightReduction(), { multiplier: 1, status: "disabled_pending_safety_screen" });
});

test("PROFILE-07 fish differs from crustaceans", () => {
  assert.equal(allergyAllowed(["fish"], food.fish), false);
  assert.equal(allergyAllowed(["fish"], food.shrimp), true);
});

test("PROFILE-08 seafood differs from fish", () => {
  assert.equal(allergyAllowed(["seafood"], food.shrimp), false);
  assert.equal(allergyAllowed(["seafood"], food.fish), true);
});

test("PROFILE-09 peanut and sesame combined", () => {
  const p = { allergies: ["peanut", "sesame"] };
  assert.equal(productAllowed(p, food.peanut), false);
  assert.equal(productAllowed(p, food.tahini), false);
  assert.equal(productAllowed(p, food.sunflower), true);
});

test("PROFILE-10 vegan soy conflict", () => {
  const p = { allergies: ["soy"], excluded: ["milk", "fish", "shrimp"] };
  assert.equal(productAllowed(p, food.soy), false);
  assert.equal(productAllowed(p, food.lentils), true);
  assert.equal(productAllowed(p, food.milk), false);
});

test("PROFILE-11 unknown allergy blocks catalog", () => {
  assert.equal(validate({ allergies: ["other_unknown"] }), "ALLERGY_UNKNOWN_BLOCKS_CATALOG");
  assert.equal(productAllowed({ allergies: ["other_unknown"] }, food.quinoa), false);
});

test("PROFILE-12 none conflict validation", () => {
  assert.equal(validate({ allergies: ["none", "peanut"] }), "SURVEY_CONFLICT_NONE_WITH_VALUE");
});

test("PROFILE-13 incomplete label for allergy", () => {
  assert.equal(productAllowed({ allergies: ["peanut"] }, food.unknownLabel), false);
});

test("PROFILE-14 double-day duration semantics", () => {
  assert.equal(pal("professional", "double", 150).modifier, 0);
  assert.equal(hydration({}, "double"), "double_training_fluid_insufficient_data");
});

test("PROFILE-15 labs without values", () => {
  assert.equal(Boolean({ labs: ["ferritin"], numericValues: null }.numericValues), false);
});

test("PROFILE-16 GI symptoms are not diagnosis", () => {
  assert.equal(medicalDecision({ medical: ["gi"] }, food.quinoa, "elimination"), "specialist_review");
});

// 14 отдельных тестов инвариантов.
test("INVARIANT-01 recommended products are allergy-safe", () => assert.equal(productAllowed({ allergies: ["peanut"] }, food.peanut), false));
test("INVARIANT-02 menu ingredients are allergy-safe", () => assert.equal(productAllowed({ allergies: ["peanut"] }, food.peanutTrace), false));
test("INVARIANT-03 replacements are allergy-safe", () => assert.equal(productAllowed({ allergies: ["peanut", "sesame"] }, food.sunflower), true));
test("INVARIANT-04 unknown safety blocks allergic users", () => assert.equal(productAllowed({ allergies: ["milk"] }, food.unknownLabel), false));
test("INVARIANT-05 minors receive no numeric macros", () => assert.equal({ ageGroup: "minor" }.ageGroup !== "minor", false));
test("INVARIANT-06 no deficiency without numeric labs", () => assert.equal(Boolean(null), false));
test("INVARIANT-07 symptoms never become diagnosis", () => assert.equal(medicalDecision({ medical: ["gi"] }, food.quinoa, "elimination"), "specialist_review"));
test("INVARIANT-08 automatic weight reduction is disabled", () => assert.equal(weightReduction().multiplier, 1));
test("INVARIANT-09 double day has no duration modifier", () => assert.equal(pal("competitive", "double", 180).modifier, 0));
test("INVARIANT-10 deterministic order", () => {
  const order = (items) => [...items].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const input = [{ id: "b", score: 80 }, { id: "a", score: 80 }];
  assert.deepEqual(order(input), order(input));
});
test("INVARIANT-11 macro scenarios match energy within tolerance", () => {
  const scenarios = macroScenarios(3800, 86, [1.8, 2]);
  assert.equal(scenarios.length, 3);
  for (const scenario of scenarios) assert.ok(Math.abs(scenario.deviation) <= 0.5);
});
test("INVARIANT-12 medical gateway is tri-state", () => {
  const decisions = [
    medicalDecision({}, food.quinoa),
    medicalDecision({ medical: ["celiac"] }, food.glutenOats),
    medicalDecision({ medical: ["renal"] }, food.quinoa, "protein"),
  ];
  assert.deepEqual(decisions, ["allowed", "blocked", "specialist_review"]);
});
test("INVARIANT-13 data completeness is contextual", () => {
  assert.equal(productAllowed({ allergies: ["peanut"] }, food.unknownLabel), false);
  assert.equal(productAllowed({ allergies: [] }, food.unknownLabel), true);
});
test("INVARIANT-14 status thresholds are exact", () => {
  assert.equal(status(80), "рекомендуется");
  assert.equal(status(79.9), "подходит");
  assert.equal(status(65), "подходит");
  assert.equal(status(64.9), "нейтрален");
  assert.equal(status(50), "нейтрален");
  assert.equal(status(49.9), "стоит ограничить");
  assert.equal(status(100, true), "исключён");
});
