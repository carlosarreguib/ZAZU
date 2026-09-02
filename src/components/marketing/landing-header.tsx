import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-4 sm:px-10">
      <span className="text-lg font-semibold tracking-tight">Zazú</span>
      <nav className="flex items-center gap-3">
        <Button asChild variant="ghost">
          <Link href="/login">Iniciar sesión</Link>
        </Button>
        <Button asChild>
          <Link href="/register">Probar gratis</Link>
        </Button>
      </nav>
    </header>
  );
}
