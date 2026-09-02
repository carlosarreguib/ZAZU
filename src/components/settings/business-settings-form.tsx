"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateBusinessSettings,
  type BusinessSettingsFormState,
} from "@/app/dashboard/configuracion/actions";

const initialState: BusinessSettingsFormState = {};

export function BusinessSettingsForm({
  defaultValues,
}: {
  defaultValues: { name: string; contactName: string; phone: string | null };
}) {
  const [state, formAction, isPending] = useActionState(
    updateBusinessSettings,
    initialState,
  );

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nombre del negocio</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues.name}
          required
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        {state.fieldErrors?.name ? (
          <p className="text-sm text-destructive">{state.fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contactName">Nombre de contacto</Label>
        <Input
          id="contactName"
          name="contactName"
          defaultValue={defaultValues.contactName}
          required
          aria-invalid={Boolean(state.fieldErrors?.contactName)}
        />
        {state.fieldErrors?.contactName ? (
          <p className="text-sm text-destructive">
            {state.fieldErrors.contactName}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Teléfono (opcional)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultValues.phone ?? undefined}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-primary">Guardado correctamente.</p>
      ) : null}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}
