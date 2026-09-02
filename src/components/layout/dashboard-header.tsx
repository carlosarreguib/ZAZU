import Link from "next/link";

/**
 * Header estructural del dashboard. El nombre real del negocio y el menú de
 * usuario (avatar, cerrar sesión) se conectan a Supabase en la Fase 3.
 */
export function DashboardHeader({ businessName }: { businessName?: string }) {
  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-3 md:px-6">
      <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
        Zazú
      </Link>
      {businessName ? (
        <span className="text-sm text-muted-foreground">{businessName}</span>
      ) : null}
    </header>
  );
}
