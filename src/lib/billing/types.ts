/**
 * Punto de extensión arquitectónico para suscripciones (SPEC.md sección
 * 40). No implementar Stripe ni lógica de facturación en el MVP — solo
 * los tipos que permitirán añadirlo en V3 sin rediseñar el modelo.
 */

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

export type Plan = {
  id: string;
  name: string;
  priceEurCents: number;
};

export type Subscription = {
  businessId: string;
  plan: Plan | null;
  status: SubscriptionStatus;
};
