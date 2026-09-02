/**
 * Normalización de teléfono (SPEC.md sección 16). Limitación explícita del
 * MVP: asume números españoles (prefijo +34). Números internacionales no
 * están soportados — se documenta también en el README.
 *
 * Transformaciones soportadas:
 * - "+34600112233"      -> "34600112233" (ya en formato internacional)
 * - "0034600112233"     -> "34600112233" (prefijo de marcación internacional)
 * - "600112233"         -> "34600112233" (sin prefijo, se asume España)
 * - Espacios, guiones y paréntesis se eliminan antes de aplicar lo anterior.
 */
export function normalizeSpanishPhone(rawPhone: string): string {
  const digitsAndPlus = rawPhone.replace(/[^\d+]/g, "");

  if (digitsAndPlus.startsWith("+34")) {
    return digitsAndPlus.slice(1);
  }

  if (digitsAndPlus.startsWith("0034")) {
    return digitsAndPlus.slice(2);
  }

  if (digitsAndPlus.startsWith("+")) {
    // Otro prefijo internacional: fuera de alcance del MVP, se deja tal
    // cual (sin el "+") para no perder el dato, aunque el enlace de
    // WhatsApp resultante pueda no ser válido.
    return digitsAndPlus.slice(1);
  }

  if (digitsAndPlus.startsWith("34") && digitsAndPlus.length > 9) {
    return digitsAndPlus;
  }

  return `34${digitsAndPlus}`;
}
