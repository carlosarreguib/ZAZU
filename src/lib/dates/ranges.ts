import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/**
 * Devuelve el rango [inicio, fin] en UTC (ISO) que corresponde al día
 * calendario "hoy" u "hoy + offsetDays" en el timezone del negocio
 * (SPEC.md sección 24). Nunca calcular "hoy" con new Date() a secas: eso
 * usa el timezone del servidor, no el del negocio.
 *
 * La suma de días se hace sobre un Date anclado a mediodía UTC (no
 * medianoche) para evitar que un desplazamiento de un par de horas por DST
 * empuje el cálculo al día de calendario equivocado.
 */
export function dayRangeUtc(
  timezone: string,
  offsetDays = 0,
): { startIso: string; endIso: string; dateStr: string } {
  const todayInTz = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
  const noonUtcAnchor = new Date(`${todayInTz}T12:00:00Z`);
  noonUtcAnchor.setUTCDate(noonUtcAnchor.getUTCDate() + offsetDays);
  const targetDateStr = noonUtcAnchor.toISOString().slice(0, 10);

  const startIso = fromZonedTime(
    `${targetDateStr}T00:00:00`,
    timezone,
  ).toISOString();
  const endIso = fromZonedTime(
    `${targetDateStr}T23:59:59.999`,
    timezone,
  ).toISOString();

  return { startIso, endIso, dateStr: targetDateStr };
}
