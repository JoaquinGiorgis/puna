/**
 * Sesión de DEMOSTRACIÓN: no hay usuarios ni contraseñas reales. Ingresar solo deja una cookie
 * para que la cartera sepa que pasaste por el login. Nada de esto protege datos.
 */
const COOKIE = "puna_demo";

export function signIn() {
  document.cookie = `${COOKIE}=1; path=/; max-age=${60 * 60 * 12}; samesite=lax`;
}

export function signOut() {
  document.cookie = `${COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function isSignedIn() {
  return document.cookie.split("; ").some((c) => c === `${COOKIE}=1`);
}
