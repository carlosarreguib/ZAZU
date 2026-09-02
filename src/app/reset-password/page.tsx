import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = {
  title: "Restablecer contraseña — Zazú",
};

export default function ResetPasswordPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold">Restablecer contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Elige una nueva contraseña para tu cuenta.
        </p>
      </div>
      <ResetPasswordForm />
    </main>
  );
}
