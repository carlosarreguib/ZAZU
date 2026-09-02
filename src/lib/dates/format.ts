import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

/**
 * Utilidades centralizadas de formato de fecha/hora respetando el timezone
 * del negocio (SPEC.md sección 24). Nunca formatear TIMESTAMPTZ con el
 * timezone del servidor: siempre pasar el timezone del negocio.
 */

export function formatDate(isoDate: string, timezone: string): string {
  return formatInTimeZone(new Date(isoDate), timezone, "d 'de' MMMM", {
    locale: es,
  });
}

export function formatDateLong(isoDate: string, timezone: string): string {
  return formatInTimeZone(new Date(isoDate), timezone, "EEEE d 'de' MMMM", {
    locale: es,
  });
}

export function formatTime(isoDate: string, timezone: string): string {
  return formatInTimeZone(new Date(isoDate), timezone, "HH:mm");
}

export function formatDateTime(isoDate: string, timezone: string): string {
  return formatInTimeZone(new Date(isoDate), timezone, "d MMM HH:mm", {
    locale: es,
  });
}
