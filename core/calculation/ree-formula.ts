export interface MifflinInputs { ageYears: number; heightCm: number; weightKg: number }

export const mifflinStJeorMale = ({ ageYears, heightCm, weightKg }: MifflinInputs) =>
  10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;

export const mifflinStJeorFemale = ({ ageYears, heightCm, weightKg }: MifflinInputs) =>
  10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;

export const roundToNearest5Kcal = (value: number) => Math.round(value / 5) * 5;
