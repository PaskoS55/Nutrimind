export function roundToNearest50TiesToEven(value: number): number {
  const scaled = value / 50;
  const floor = Math.floor(scaled);
  const fraction = scaled - floor;
  const rounded = fraction < 0.5 ? floor : fraction > 0.5 ? floor + 1 : floor % 2 === 0 ? floor : floor + 1;
  return rounded * 50;
}

export const calculateEnergyStart = (reeUnrounded: number, palFinal: number) => {
  const raw = reeUnrounded * palFinal;
  return { raw, displayed: roundToNearest50TiesToEven(raw) };
};
