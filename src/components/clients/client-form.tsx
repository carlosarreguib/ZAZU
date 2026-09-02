"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ClientFormState } from "@/app/dashboard/clientes/actions";

const initialState: ClientFormState = {};

export function ClientForm({
  action,
  defaultValues,
  submitLabel,
  onCancel,
}: {
  action: (
    state: ClientFormState,
    formData: FormData,
  ) => Promise<ClientFormState>;
  defaultValues?: { fullName?: string; phone?: string; notes?: string | null };
  submitLabel: string;
  onCancel?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Nombre</Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={defaultValues?.fullName}
          required
          aria-invalid={Boolean(state.fieldErrors?.fullName)}
        />
        {state.fieldErrors?.fullName ? (
          <p className="text-sm text-destructive">{state.fieldErrors.fullName}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultValues?.phone}
          required
          aria-invalid={Boolean(state.fieldErrors?.phone)}
        />
        {state.fieldErrors?.phone ? (
          <p className="text-sm text-destructive">{state.fieldErrors.phone}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={defaultValues?.notes ?? undefined}
          rows={3}
        />
      </div>

      {state.error ? (
        <div role="alert" className="flex flex-col gap-2 text-sm text-destructive">
          <p>{state.error}</p>
          {state.duplicateClientId ? (
            <Link
              href={`/dashboard/clientes/${state.duplicateClientId}`}
              className="font-medium underline-offset-4 hover:underline"
            >
              Ver cliente existente
            </Link>
          ) : null}
        </div>
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
