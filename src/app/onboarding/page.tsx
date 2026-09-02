import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { requireBusiness } from "@/lib/auth/session";

export const metadata = {
  title: "Configura tu agenda — Zazú",
};

export default async function OnboardingPage() {
  const { business } = await requireBusiness();

  if (business?.onboarding_completed_at) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold">Configura tu agenda</h1>
        <p className="text-sm text-muted-foreground">
          Solo 3 pasos rápidos para empezar.
        </p>
      </div>
      <OnboardingWizard />
    </main>
  );
}
