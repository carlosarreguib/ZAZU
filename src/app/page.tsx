import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Placeholder landing page. The real landing (hero, secciones, CTA) se
 * implementa en la Fase 11 según SPEC.md sección 26.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Zazú</h1>
      <p className="max-w-md text-muted-foreground">
        No pierdas citas por un simple olvido.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/register">Probar Zazú gratis</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Iniciar sesión</Link>
        </Button>
      </div>
    </main>
  );
}
