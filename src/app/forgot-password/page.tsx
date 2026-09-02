import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Recuperar contraseña — Zazú",
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold">Recuperar contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Te enviaremos un enlace para restablecerla.
        </p>
      </div>
      <ForgotPasswordForm />
    </main>
  );
}
