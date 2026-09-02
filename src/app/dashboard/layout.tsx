import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { requireBusiness } from "@/lib/auth/session";

// El dashboard autenticado no necesita SEO (SPEC.md sección 42).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * La protección de la ruta /dashboard la aplica el proxy (src/proxy.ts) a
 * nivel de sesión. Aquí además exigimos que el usuario pertenezca a un
 * negocio (requireBusiness), ya que toda la app asume un negocio activo
 * (SPEC.md sección 5.1), y que haya completado el onboarding (sección 10).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, business } = await requireBusiness();

  if (business && !business.onboarding_completed_at) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <DashboardNav />
      <div className="flex flex-1 flex-col">
        <DashboardHeader businessName={business?.name} userEmail={user.email} />
        <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
