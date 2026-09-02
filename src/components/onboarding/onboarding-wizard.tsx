"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  completeOnboarding,
  type OnboardingFormState,
} from "@/app/onboarding/actions";

const TOTAL_STEPS = 3;
const initialState: OnboardingFormState = {};

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("50");
  const [state, formAction, isPending] = useActionState(
    completeOnboarding,
    initialState,
  );

  const canAdvanceStep1 = businessName.trim().length > 0;
  const canAdvanceStep2 = contactName.trim().length > 0;
  const canSubmit =
    serviceName.trim().length > 0 && Number(durationMinutes) > 0;

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <p className="text-center text-sm text-muted-foreground">
        Paso {step} de {TOTAL_STEPS}
      </p>

      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 text-center">
            <h2 className="text-lg font-medium">¿Cómo se llama tu negocio?</h2>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="businessName">Nombre del negocio</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <Button
            type="button"
            disabled={!canAdvanceStep1}
            onClick={() => setStep(2)}
          >
            Continuar
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 text-center">
            <h2 className="text-lg font-medium">¿Cómo te llamas?</h2>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contactName">Tu nombre</Label>
            <Input
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Atrás
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={!canAdvanceStep2}
              onClick={() => setStep(3)}
            >
              Continuar
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="businessName" value={businessName} />
          <input type="hidden" name="contactName" value={contactName} />

          <div className="flex flex-col gap-1 text-center">
            <h2 className="text-lg font-medium">Crea tu primer servicio</h2>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="serviceName">Nombre del servicio</Label>
            <Input
              id="serviceName"
              name="serviceName"
              placeholder="Fisioterapia"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              autoFocus
              required
              aria-invalid={Boolean(state.fieldErrors?.serviceName)}
            />
            {state.fieldErrors?.serviceName ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.serviceName}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="durationMinutes">Duración (minutos)</Label>
            <Input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              required
              aria-invalid={Boolean(state.fieldErrors?.durationMinutes)}
            />
            {state.fieldErrors?.durationMinutes ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.durationMinutes}
              </p>
            ) : null}
          </div>

          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              disabled={isPending}
            >
              Atrás
            </Button>
            <Button type="submit" className="flex-1" disabled={!canSubmit || isPending}>
              {isPending ? "Guardando..." : "Tu agenda está lista"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
