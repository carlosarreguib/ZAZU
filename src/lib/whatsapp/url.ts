import { normalizeSpanishPhone } from "@/lib/whatsapp/phone";

/**
 * Genera la URL wa.me correcta: número en formato internacional sin "+" ni
 * ceros a la izquierda, texto codificado con encodeURIComponent (SPEC.md
 * sección 16). No usar la API de WhatsApp Business, Twilio ni Zapier.
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalizedPhone = normalizeSpanishPhone(phone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
