export const RHO0 = 1.225; // kg/m³ at sea level, ISA

/** ISA density ratio σ = ρ/ρ0 for a geometric altitude in metres (troposphere). */
export function sigma(altM: number): number {
  const h = Math.max(0, Math.min(altM, 11000));
  return Math.pow(1 - 2.2558e-5 * h, 4.2559);
}

export function density(altM: number): number {
  return RHO0 * sigma(altM);
}
