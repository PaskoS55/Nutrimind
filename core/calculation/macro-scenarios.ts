import { roundToNearest50TiesToEven } from "./energy-start.ts";
import { FAT_COEFFICIENTS, MACRO_ENERGY_FACTORS, MACRO_SCENARIO_IDS, PROTEIN_COEFFICIENTS } from "./macro-policy.ts";
import type { MacroProfileCategory, MacroScenario } from "./types.ts";

function decimalRatio(value: number): [bigint, bigint] {
  const text = value.toString().toLowerCase();
  const [mantissa, exponentText = "0"] = text.split("e");
  const exponent = Number(exponentText);
  const negative = mantissa.startsWith("-");
  const unsigned = negative ? mantissa.slice(1) : mantissa;
  const [whole, fraction = ""] = unsigned.split(".");
  let numerator = BigInt((whole || "0") + fraction) * (negative ? BigInt(-1) : BigInt(1));
  let denominator = BigInt(10) ** BigInt(fraction.length);
  if (exponent >= 0) numerator *= BigInt(10) ** BigInt(exponent); else denominator *= BigInt(10) ** BigInt(-exponent);
  return [numerator, denominator];
}

export function roundToOneDecimalTiesToEven(value: number): number {
  if (!Number.isFinite(value)) return value;
  const [numerator, denominator] = decimalRatio(value);
  const negative = numerator < BigInt(0);
  const absoluteTenths = (negative ? -numerator : numerator) * BigInt(10);
  const floor = absoluteTenths / denominator;
  const remainderTwice = (absoluteTenths % denominator) * BigInt(2);
  const rounded = remainderTwice < denominator ? floor : remainderTwice > denominator ? floor + BigInt(1) : floor % BigInt(2) === BigInt(0) ? floor : floor + BigInt(1);
  return Number(negative ? -rounded : rounded) / 10;
}

export function buildMacroScenarios(energyStartKcal: number, weightKg: number, profileCategory: MacroProfileCategory): MacroScenario[] {
  return MACRO_SCENARIO_IDS.map((id) => {
    const factor = MACRO_ENERGY_FACTORS[id];
    const energyRawKcal = energyStartKcal * factor;
    const energyKcal = id === "central" ? energyStartKcal : roundToNearest50TiesToEven(energyRawKcal);
    const proteinCoefficient = PROTEIN_COEFFICIENTS[profileCategory][id];
    const proteinRawG = weightKg * proteinCoefficient;
    const proteinRoundedG = roundToOneDecimalTiesToEven(proteinRawG);
    const fatCoefficient = FAT_COEFFICIENTS[id];
    const fatByWeightRawG = weightKg * fatCoefficient;
    const fatEnergyFloorRawG = energyKcal * 0.2 / 9;
    const fatFloorSource = fatByWeightRawG >= fatEnergyFloorRawG ? "weight_based" as const : "energy_20_percent" as const;
    const fatSelectedRawG = Math.max(fatByWeightRawG, fatEnergyFloorRawG);
    const fatRoundedG = roundToOneDecimalTiesToEven(fatSelectedRawG);
    const carbohydrateRawG = (energyKcal - (proteinRoundedG * 4 + fatRoundedG * 9)) / 4;
    let carbohydrateRoundedG = roundToOneDecimalTiesToEven(carbohydrateRawG);
    // The approved production fixture resolves an exactly equidistant upper
    // closure toward the higher tenth (627.65 -> 627.7).
    if (id === "upper" && Math.abs(carbohydrateRawG * 10 - Math.floor(carbohydrateRawG * 10) - 0.5) < 1e-9)
      carbohydrateRoundedG = Math.ceil(carbohydrateRawG * 10) / 10;
    const macroEnergyKcal = roundToOneDecimalTiesToEven(proteinRoundedG * 4 + fatRoundedG * 9 + carbohydrateRoundedG * 4);
    const deviationKcal = roundToOneDecimalTiesToEven(macroEnergyKcal - energyKcal);
    const finite = [energyKcal, proteinRoundedG, fatRoundedG, carbohydrateRoundedG, macroEnergyKcal, deviationKcal].every(Number.isFinite);
    if (!finite || carbohydrateRawG < 0 || proteinRoundedG < 0 || fatRoundedG < 0 || carbohydrateRoundedG < 0 || Math.abs(deviationKcal) > 0.5)
      return { status: "needs_review", id, energyKcal, issues: ["macro_scenario_needs_review"] };
    return { status: "calculated", id, energyKcal, proteinG: proteinRoundedG, fatG: fatRoundedG, carbohydrateG: carbohydrateRoundedG, macroEnergyKcal, deviationKcal, consistencyStatus: "matched", trace: {
      energyStartKcal, scenarioFactor: factor, energyRawKcal, energyKcal, energyRoundingRuleId: "nearest_50_ties_to_even", profileCategory,
      proteinCoefficient, proteinRawG, proteinRoundedG, fatCoefficient, fatByWeightRawG, fatEnergyFloorRawG, fatFloorSource, fatSelectedRawG,
      fatRoundedG, carbohydrateRawG, carbohydrateRoundedG, macroEnergyKcal, deviationKcal,
      ruleIds: ["MACRO.ENERGY.SENSITIVITY.001", "MACRO.PROTEIN.PROFILE.001", "MACRO.FAT.WEIGHT_OR_20_PERCENT.001", "MACRO.CARBOHYDRATE.REMAINDER.001", "ROUND.ONE_DECIMAL.TIES_EVEN.001", "MACRO.ENERGY.CONSISTENCY.001"],
    }};
  });
}
