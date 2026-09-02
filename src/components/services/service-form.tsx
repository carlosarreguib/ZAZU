"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ServiceFormState } from "@/app/dashboard/servicios/actions";

const initialState: ServiceFormState = {};

export function ServiceForm({
  action,
  defaultValues,
  submitLabel,
  onCancel,
  onSuccess,
}: {
  action: (
    state: ServiceFormState,
    formData: FormData,
  ) => Promise<ServiceFormState>;
  defaultValues?: { name?: string; durationMinutes?: number };
  submitLabel: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
          required
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        {state.fieldErrors?.name ? (
          <p className="text-sm text-destructive">{state.fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="durationMinutes">Duración (minutos)</Label>
        <Input
          id="durationMinutes"
          name="durationMinutes"
          type="number"
          min={1}
          defaultValue={defaultValues?.durationMinutes}
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
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
