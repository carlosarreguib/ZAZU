"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Settings, Stethoscope, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Agenda", icon: Home },
  { href: "/dashboard/citas", label: "Citas", icon: CalendarDays },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/servicios", label: "Servicios", icon: Stethoscope },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="sticky top-0 z-40 flex justify-between gap-1 border-b bg-background px-1 py-1 md:static md:flex-col md:justify-start md:border-b-0 md:border-r md:px-3 md:py-4"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            aria-label={label}
            title={label}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-2 text-xs font-medium transition-colors md:flex-row md:flex-none md:gap-2 md:px-3 md:text-sm",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-5 md:size-4" aria-hidden="true" />
            <span className="max-w-full truncate md:max-w-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
