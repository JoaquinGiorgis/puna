/** Formatos en español rioplatense: coma decimal, punto de miles. */

export const pct = (bps: number, digits = 1) =>
  `${(bps / 100).toLocaleString("es-AR", { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;

export const int = (n: number) => n.toLocaleString("es-AR");

export const avax = (wei: string | bigint, digits = 4) => {
  const v = Number(BigInt(wei)) / 1e18;
  return `${v.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: digits })} AVAX`;
};

export const short = (h: string, a = 6, b = 4) => (h.length > a + b + 1 ? `${h.slice(0, a)}…${h.slice(-b)}` : h);

export const hhmmss = (unix: number) =>
  new Date(unix * 1000).toLocaleTimeString("es-AR", { hour12: false, timeZone: "America/Argentina/Buenos_Aires" });

export const txUrl = (explorer: string, hash: string) => `${explorer}/tx/${hash}`;
export const addrUrl = (explorer: string, a: string) => `${explorer}/address/${a}`;
