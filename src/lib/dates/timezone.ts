import { fromZonedTime } from "date-fns-tz";

/**
 * Construye un instante UTC (TIMESTAMPTZ) a partir de una fecha "yyyy-MM-dd"
 * y una hora "HH:mm" interpretadas en el timezone del negocio (SPEC.md
 * sección 23-24). Nunca construir el Date directamente con new Date(string)
 * sin timezone: eso asume el timezone del servidor, no el del negocio.
 */
export function zonedDateTimeToIso(
  date: string,
  time: string,
  timezone: string,
): string {
  const localDateTime = `${date}T${time}:00`;
  return fromZonedTime(localDateTime, timezone).toISOString();
}
