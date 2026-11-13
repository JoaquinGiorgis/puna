import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // la cartera y el login son de demo: no se indexan
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/cartera", "/ingresar", "/api/"] }] };
}
