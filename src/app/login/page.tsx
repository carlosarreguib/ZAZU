import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Iniciar sesión — Zazú",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const { registered } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground">
          Accede a tu agenda de Zazú.
        </p>
      </div>
      {registered ? (
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          Te hemos enviado un email de confirmación. Confírmalo y después
          inicia sesión aquí.
        </p>
      ) : null}
      <LoginForm />
    </main>
  );
}
