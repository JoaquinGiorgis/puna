import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Sirve los artefactos publicados por los agentes (puna-artifacts://<sha256>.<ext>) desde
 * ARTIFACTS_DIR o ../out/artifacts. Solo nombres <sha256>.json|npz: nada de rutas arbitrarias.
 * El navegador igual verifica sha256(contenido) == nombre. En un host sin esos archivos responde 404.
 */
const NAME = /^[0-9a-f]{64}\.(json|npz)$/;

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  if (!NAME.test(name)) return new Response("nombre inválido", { status: 400 });
  const dir = process.env.ARTIFACTS_DIR ?? path.join(/* turbopackIgnore: true */ process.cwd(), "..", "out", "artifacts");
  try {
    const data = await readFile(path.join(dir, name));
    return new Response(new Uint8Array(data), {
      headers: {
        "content-type": name.endsWith(".json") ? "application/json; charset=utf-8" : "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("no está en este host", { status: 404 });
  }
}
