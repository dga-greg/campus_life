/** All money is an integer number of pesewas (100 pesewas = GH₵1). */
export type Pesewas = number;

export function cedis(amount: number): Pesewas {
  return Math.round(amount * 100);
}

export function isValidPesewas(value: unknown): value is Pesewas {
  return typeof value === "number" && Number.isSafeInteger(value);
}

export function formatCedis(value: Pesewas): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const whole = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const frac = (abs % 100).toString().padStart(2, "0");
  return `${sign}GH₵${whole}.${frac}`;
}
