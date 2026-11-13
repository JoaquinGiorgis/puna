/**
 * Contacto de la landing. Valida el formulario y registra el pedido en el log del servidor.
 * Todavía no envía email ni lo guarda en un CRM: para eso, conectar acá el proveedor (Resend, HubSpot, etc.).
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Formulario inválido." }, { status: 400 });
  }
  if (clip(body.website, 200)) return Response.json({ ok: true }); // bot: se descarta en silencio

  const name = clip(body.name, 120);
  const email = clip(body.email, 200);
  const company = clip(body.company, 160);
  const message = clip(body.message, 2000);
  if (!name) return Response.json({ error: "Falta tu nombre." }, { status: 422 });
  if (!EMAIL.test(email)) return Response.json({ error: "Revisá el email." }, { status: 422 });

  console.info("[contacto]", JSON.stringify({ at: new Date().toISOString(), name, email, company, message }));
  return Response.json({ ok: true });
}
