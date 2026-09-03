import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-4 sm:px-10">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo-zazu.png" alt="" width={32} height={32} priority className="h-8 w-8" />
        <span className="text-lg font-semibold tracking-tight">Zazú</span>
      </Link>
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
