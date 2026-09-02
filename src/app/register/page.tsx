import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "Crear cuenta — Zazú",
};

export default function RegisterPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground">
          La agenda sencilla para autónomos que no quieren perder clientes.
        </p>
      </div>
      <RegisterForm />
    </main>
  );
}
