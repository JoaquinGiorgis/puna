/**
 * Ficha del asegurado de cada póliza de la cartera de EJEMPLO.
 * Todo es FICTICIO: personas, empresas, CUIT, teléfonos, asesores y bancos son inventados para la demo.
 * Los identificadores van enmascarados a propósito, para que no se confundan con datos de alguien real.
 * Lo único real es la wallet de cobro del Lote 14 (beneficiario simulado del job en Fuji).
 */
import { demo } from "./data";

export type Insured = {
  kind: "Persona humana" | "Sociedad anónima" | "SRL" | "Cooperativa" | "Sociedad de hecho";
  name: string;
  cuit: string;
  tax: string;
  contact: { name: string; role: string; phone: string; email: string };
  address: string;
  activity: string;
  tenure: string; // tenencia de la tierra
  totalHa: number; // superficie que explota (asegurada o no)
  since: number; // cliente desde
  seasons: number; // campañas aseguradas
  claims: string; // siniestros anteriores, en palabras
  broker: { name: string; license: string };
  lender?: string; // endoso a favor de un acreedor
  payout: { method: string; detail: string; href?: string };
  kyc: string;
  premium: { pct: number; plan: string };
  notes: string;
};

const mail = (user: string) => `${user}@ejemplo.test`;

export const INSURED: Record<string, Insured> = {
  "lote-14": {
    kind: "Sociedad anónima", name: "Agropecuaria Tres Cerros S.A.", cuit: "30-7•••••••-2", tax: "Responsable inscripto",
    contact: { name: "Mariana Ríos", role: "Gerenta de producción", phone: "+54 387 ••• ••21", email: mail("mrios") },
    address: "Ruta Prov. 5 km 38, Anta (Salta)", activity: "Agricultura extensiva: soja y poroto en secano",
    tenure: "Propia (60 %) y arrendada (40 %)", totalHa: 3400, since: 2023, seasons: 3,
    claims: "Ninguno pagado antes de este. En 2024/25 hubo un foco a 6 km que no entró al lote.",
    broker: { name: "Federico Arias · Asesores del Norte", license: "Mat. SSN 8••••" },
    lender: "Endoso parcial a Banco del Ejemplo por el préstamo de campaña",
    payout: { method: "Wallet en Avalanche", detail: demo.job.beneficiary, href: `${demo.chain.explorer}/address/${demo.job.beneficiary}` },
    kyc: "Verificado el 14/08/2026 · estatuto, poderes y beneficiario final",
    premium: { pct: 1.8, plan: "Contado, al emitir" },
    notes: "Lote cercano a monte nativo: el riesgo de fuego de la zona sube de agosto a noviembre.",
  },
  "la-esperanza": {
    kind: "Persona humana", name: "Jorge Daniel Paz", cuit: "20-1•••••••-7", tax: "Responsable inscripto",
    contact: { name: "Jorge Paz", role: "Titular", phone: "+54 387 ••• ••58", email: mail("jpaz") },
    address: "Las Lajitas, Anta (Salta)", activity: "Soja de primera y trigo de cobertura",
    tenure: "Propia", totalHa: 2100, since: 2021, seasons: 5, claims: "Uno por granizo en 2022/23 (póliza tradicional).",
    broker: { name: "Federico Arias · Asesores del Norte", license: "Mat. SSN 8••••" },
    payout: { method: "Transferencia bancaria", detail: "CBU •••• •••• 4417" },
    kyc: "Verificado el 02/08/2026", premium: { pct: 1.8, plan: "Dos cuotas (emisión y cosecha)" },
    notes: "Usa siembra directa; los rastrojos aumentan la carga de combustible.",
  },
  "el-algarrobal": {
    kind: "SRL", name: "El Algarrobal Agro SRL", cuit: "30-7•••••••-5", tax: "Responsable inscripto",
    contact: { name: "Natalia Gómez", role: "Socia gerente", phone: "+54 387 ••• ••90", email: mail("ngomez") },
    address: "Apolinario Saravia, Anta (Salta)", activity: "Poroto alubia y negro para exportación",
    tenure: "Arrendada (contrato a 3 campañas)", totalHa: 1300, since: 2024, seasons: 2, claims: "Ninguno.",
    broker: { name: "Carla Medina · Seguros Medina", license: "Mat. SSN 6••••" },
    lender: "Endoso a Exportadora del Ejemplo S.A. por el anticipo de cosecha",
    payout: { method: "Transferencia bancaria", detail: "CBU •••• •••• 0932" },
    kyc: "Verificado el 21/07/2026", premium: { pct: 2.1, plan: "Contado" },
    notes: "El exportador exige seguro para financiar la campaña.",
  },
  "los-quebrachos": {
    kind: "Sociedad de hecho", name: "Hnos. Villagra Soc. de Hecho", cuit: "30-7•••••••-1", tax: "Responsable inscripto",
    contact: { name: "Ramón Villagra", role: "Socio", phone: "+54 3877 •• ••12", email: mail("rvillagra") },
    address: "J. V. González, Anta (Salta)", activity: "Maíz y ganadería de recría",
    tenure: "Propia", totalHa: 2600, since: 2020, seasons: 6, claims: "Uno por sequía en 2022/23 (índice de otra aseguradora).",
    broker: { name: "Carla Medina · Seguros Medina", license: "Mat. SSN 6••••" },
    payout: { method: "Transferencia bancaria", detail: "CBU •••• •••• 7781" },
    kyc: "Verificado el 30/07/2026", premium: { pct: 1.7, plan: "Dos cuotas" },
    notes: "Tiene pasturas al lado del maíz: un fuego de pastizal puede pasar al cultivo.",
  },
  "santa-rosa": {
    kind: "Sociedad anónima", name: "Santa Rosa Agronegocios S.A.", cuit: "30-6•••••••-9", tax: "Responsable inscripto",
    contact: { name: "Pablo Herrera", role: "Gerente de administración", phone: "+54 387 ••• ••04", email: mail("pherrera") },
    address: "El Quebrachal, Anta (Salta)", activity: "Soja, maíz y algodón",
    tenure: "Propia y arrendada", totalHa: 6800, since: 2019, seasons: 7, claims: "Dos por granizo (2020/21 y 2023/24).",
    broker: { name: "Federico Arias · Asesores del Norte", license: "Mat. SSN 8••••" },
    lender: "Endoso a Banco del Ejemplo por la línea de capital de trabajo",
    payout: { method: "Transferencia bancaria", detail: "CBU •••• •••• 2205" },
    kyc: "Verificado el 11/08/2026 · beneficiario final declarado", premium: { pct: 1.6, plan: "Contado con descuento" },
    notes: "Cliente grande: pide reportes mensuales del estado de todos sus lotes.",
  },
  "el-chanar": {
    kind: "Cooperativa", name: "Cooperativa Agrícola El Chañar Ltda.", cuit: "30-5•••••••-6", tax: "Exenta (cooperativa)",
    contact: { name: "Silvia Cardozo", role: "Secretaria del consejo", phone: "+54 387 ••• ••66", email: mail("scardozo") },
    address: "General Pizarro, Anta (Salta)", activity: "Poroto de 34 socios pequeños, comercialización conjunta",
    tenure: "Campos de los socios", totalHa: 2900, since: 2025, seasons: 1, claims: "Ninguno.",
    broker: { name: "Carla Medina · Seguros Medina", license: "Mat. SSN 6••••" },
    payout: { method: "Transferencia bancaria", detail: "CBU •••• •••• 3350 · la cooperativa reparte entre los socios" },
    kyc: "Verificado el 05/09/2026 · acta del consejo y padrón de socios", premium: { pct: 1.9, plan: "Tres cuotas" },
    notes: "Póliza colectiva: un solo índice por lote, la cooperativa distribuye el pago.",
  },
  "la-florida": {
    kind: "Sociedad anónima", name: "Ingenio del Ejemplo S.A. · Finca La Florida", cuit: "30-5•••••••-4", tax: "Responsable inscripto",
    contact: { name: "Gustavo Ledesma", role: "Jefe de campo", phone: "+54 3878 •• ••45", email: mail("gledesma") },
    address: "Pichanal, Orán (Salta)", activity: "Caña de azúcar para el ingenio propio",
    tenure: "Propia", totalHa: 5200, since: 2022, seasons: 4, claims: "Uno por incendio accidental en 2023/24 (póliza tradicional, 41 días de trámite).",
    broker: { name: "Federico Arias · Asesores del Norte", license: "Mat. SSN 8••••" },
    payout: { method: "Transferencia bancaria", detail: "CBU •••• •••• 1189" },
    kyc: "Verificado el 18/07/2026", premium: { pct: 2.4, plan: "Contado" },
    notes: "La quema de cañaveral está prohibida en la finca: un foco en el lote cuenta como siniestro.",
  },
  "el-palmar": {
    kind: "Persona humana", name: "Lucía Beatriz Albornoz", cuit: "27-2•••••••-3", tax: "Monotributo",
    contact: { name: "Lucía Albornoz", role: "Titular", phone: "+54 3878 •• ••73", email: mail("lalbornoz") },
    address: "Embarcación, San Martín (Salta)", activity: "Soja y maíz de segunda",
    tenure: "Arrendada", totalHa: 1100, since: 2025, seasons: 1, claims: "Ninguno.",
    broker: { name: "Carla Medina · Seguros Medina", license: "Mat. SSN 6••••" },
    payout: { method: "Transferencia bancaria", detail: "CBU •••• •••• 6024" },
    kyc: "Verificado el 27/08/2026", premium: { pct: 1.8, plan: "Dos cuotas" },
    notes: "Primera campaña asegurada contra incendio.",
  },
  "don-ernesto": {
    kind: "Persona humana", name: "Ernesto Ramón Quispe", cuit: "20-1•••••••-0", tax: "Monotributo",
    contact: { name: "Ernesto Quispe", role: "Titular", phone: "+54 3875 •• ••18", email: mail("equispe") },
    address: "Aguaray, San Martín (Salta)", activity: "Poroto y hortalizas",
    tenure: "Propia", totalHa: 600, since: 2024, seasons: 2, claims: "Ninguno.",
    broker: { name: "Federico Arias · Asesores del Norte", license: "Mat. SSN 8••••" },
    payout: { method: "Transferencia bancaria", detail: "CBU •••• •••• 8840" },
    kyc: "Verificado el 09/08/2026", premium: { pct: 2.0, plan: "Tres cuotas" },
    notes: "Lote junto a la ruta 34: más focos por quema de banquinas.",
  },
  "la-aurora": {
    kind: "SRL", name: "La Aurora del Valle SRL", cuit: "30-7•••••••-8", tax: "Responsable inscripto",
    contact: { name: "Andrés Molina", role: "Socio gerente", phone: "+54 3876 •• ••52", email: mail("amolina") },
    address: "San José de Metán (Salta)", activity: "Soja, trigo y garbanzo",
    tenure: "Propia", totalHa: 1900, since: 2021, seasons: 5, claims: "Ninguno por incendio.",
    broker: { name: "Carla Medina · Seguros Medina", license: "Mat. SSN 6••••" },
    payout: { method: "Transferencia bancaria", detail: "CBU •••• •••• 5513" },
    kyc: "Verificado el 16/07/2026", premium: { pct: 1.7, plan: "Contado" },
    notes: "Renovó con la misma suma asegurada que la campaña pasada.",
  },
  "san-jose": {
    kind: "Persona humana", name: "María Inés Saravia", cuit: "27-1•••••••-6", tax: "Responsable inscripto",
    contact: { name: "Tomás Saravia", role: "Hijo, encargado del campo", phone: "+54 3876 •• ••09", email: mail("tsaravia") },
    address: "Rosario de la Frontera (Salta)", activity: "Ganadería de cría sobre pasturas implantadas",
    tenure: "Propia", totalHa: 3500, since: 2022, seasons: 4, claims: "Uno por incendio de pastizal en 2024/25 (póliza tradicional).",
    broker: { name: "Federico Arias · Asesores del Norte", license: "Mat. SSN 8••••" },
    payout: { method: "Transferencia bancaria", detail: "CBU •••• •••• 2671" },
    kyc: "Verificado el 23/08/2026", premium: { pct: 2.6, plan: "Dos cuotas" },
    notes: "En pastura el valor por hectárea es menor, pero el fuego es más frecuente.",
  },
  "el-timbo": {
    kind: "Sociedad anónima", name: "El Timbó Agropecuaria S.A.", cuit: "30-7•••••••-3", tax: "Responsable inscripto",
    contact: { name: "Verónica Juárez", role: "Responsable de seguros", phone: "+54 381 ••• ••87", email: mail("vjuarez") },
    address: "Burruyacú (Tucumán)", activity: "Soja, maíz y limón",
    tenure: "Propia y arrendada", totalHa: 4100, since: 2020, seasons: 6, claims: "Uno por granizo en 2021/22.",
    broker: { name: "Carla Medina · Seguros Medina", license: "Mat. SSN 6••••" },
    lender: "Endoso a Banco del Ejemplo",
    payout: { method: "Transferencia bancaria", detail: "CBU •••• •••• 4098" },
    kyc: "Verificado el 01/08/2026", premium: { pct: 1.7, plan: "Contado" },
    notes: "Asegura en Tucumán y Salta con la misma aseguradora.",
  },
  "el-mistol": {
    kind: "Sociedad anónima", name: "Chaco Salteño Agro S.A.", cuit: "30-7•••••••-7", tax: "Responsable inscripto",
    contact: { name: "Diego Benítez", role: "Administrador", phone: "+54 3735 •• ••31", email: mail("dbenitez") },
    address: "Taco Pozo (Chaco)", activity: "Soja y girasol en zona de desmonte antiguo",
    tenure: "Propia", totalHa: 5600, since: 2023, seasons: 3, claims: "Ninguno pagado. Dos alertas de foco cercano en 2025/26.",
    broker: { name: "Federico Arias · Asesores del Norte", license: "Mat. SSN 8••••" },
    payout: { method: "Transferencia bancaria", detail: "CBU •••• •••• 9952" },
    kyc: "Verificado el 12/08/2026", premium: { pct: 2.2, plan: "Dos cuotas" },
    notes: "Zona con muchos focos en primavera: está en revisión de tasa para la próxima campaña.",
  },
};

/** Requisitos de la Res. SSN 315/2026 (resumen propio desde Marval O'Farrell Mairal, 27/07/2026). */
export const RES315_SOURCE = "https://www.marval.com/Publicacion/la-ssn-regula-los-seguros-parametricos-17665";
/** 1.000.000 UVA ≈ USD 1,35 M (julio 2026, según el mismo resumen). */
export const UVA_1M_USD = 1_350_000;
export const LEGAL_DAYS = 15;
