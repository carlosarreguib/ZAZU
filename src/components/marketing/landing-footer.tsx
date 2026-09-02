import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="flex flex-col items-center gap-2 border-t px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-10">
      <p>© {new Date().getFullYear()} Zazú</p>
      <div className="flex gap-4">
        <Link href="/privacidad" className="hover:text-foreground">
          Privacidad
        </Link>
        <Link href="/terminos" className="hover:text-foreground">
          Términos
        </Link>
      </div>
    </footer>
  );
}
