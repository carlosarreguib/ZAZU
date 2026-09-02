import Link from "next/link";
import {
  CalendarPlus,
  MessageCircle,
  TrendingDown,
  Sparkles,
  Zap,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/marketing/landing-header";
import { LandingFooter } from "@/components/marketing/landing-footer";

const STEPS = [
  {
    icon: CalendarPlus,
    title: "Añade la cita",
    description: "Crea la cita de tu cliente en segundos, desde el móvil o el ordenador.",
  },
  {
    icon: MessageCircle,
    title: "Recuerda al cliente",
    description: "Pulsa un botón y WhatsApp se abre con el mensaje ya preparado.",
  },
  {
    icon: TrendingDown,
    title: "Reduce las citas perdidas",
    description: "Tus clientes llegan a tiempo porque no se olvidan de su cita.",
  },
];

const REASONS = [
  { icon: Sparkles, title: "Fácil", description: "Sin manuales ni configuraciones raras." },
  { icon: Zap, title: "Rápido", description: "Abre Zazú y en 10 segundos sabes quién tienes hoy." },
  {
    icon: ShieldCheck,
    title: "Sin configuraciones complicadas",
    description: "Tu agenda está lista en menos de un minuto.",
  },
  {
    icon: UserRound,
    title: "Pensado para autónomos",
    description: "Hecho para quien trabaja solo, no para grandes equipos.",
  },
];

export default function Home() {
  return (
    <>
      <LandingHeader />

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-20 text-center sm:py-28">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            No pierdas citas por un simple olvido.
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground text-balance">
            Zazú organiza tu agenda y te permite recordar a tus clientes por
            WhatsApp en segundos.
          </p>
          <Button asChild size="lg">
            <Link href="/register">Probar Zazú gratis</Link>
          </Button>
        </section>

        <section className="border-t bg-secondary/40 px-6 py-20 sm:py-24">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-12">
            <h2 className="text-center text-2xl font-semibold tracking-tight">
              Cómo funciona
            </h2>
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <div key={step.title} className="flex flex-col items-center gap-3 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <step.icon className="size-6" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Paso {i + 1}
                  </p>
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 sm:py-24">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-12">
            <h2 className="text-center text-2xl font-semibold tracking-tight">
              Por qué Zazú
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {REASONS.map((reason) => (
                <div key={reason.title} className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <reason.icon className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-medium">{reason.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {reason.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t bg-secondary/40 px-6 py-20 text-center sm:py-24">
          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">Precio</h2>
            <p className="text-3xl font-semibold">
              Próximamente desde 9,90 €<span className="text-lg font-normal text-muted-foreground">/mes</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Sin permanencia. Sin sorpresas.
            </p>
            <Button asChild size="lg" className="mt-2">
              <Link href="/register">Probar Zazú gratis</Link>
            </Button>
          </div>
        </section>
      </main>

      <LandingFooter />
    </>
  );
}
