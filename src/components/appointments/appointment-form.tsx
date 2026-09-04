"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClientSelector, type ClientOption } from "@/components/clients/client-selector";
import { ServiceSelector, type ServiceOption } from "@/components/services/service-selector";
import type { AppointmentFormState } from "@/app/dashboard/citas/actions";

const initialState: AppointmentFormState = {};

export function AppointmentForm({
  action,
  clients,
  services,
  defaultValues,
  submitLabel,
  onCancel,
  onSuccess,
}: {
  action: (
    state: AppointmentFormState,
    formData: FormData,
  ) => Promise<AppointmentFormState>;
  clients: ClientOption[];
  services: ServiceOption[];
  defaultValues?: {
    clientId?: string;
    serviceId?: string;
    date?: string;
    time?: string;
    durationMinutes?: number;
    notes?: string | null;
  };
  submitLabel: string;
  onCancel?: () => void;
  onSuccess?: (appointmentId: string) => void;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [clientId, setClientId] = useState(defaultValues?.clientId ?? "");
  const [serviceId, setServiceId] = useState(defaultValues?.serviceId ?? "");
  const [durationMinutes, setDurationMinutes] = useState(
    defaultValues?.durationMinutes ?? 30,
  );

  useEffect(() => {
    if (state.success && state.appointmentId) {
      onSuccess?.(state.appointmentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.appointmentId]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="serviceId" value={serviceId} />

      <div className="flex flex-col gap-2">
        <Label>Cliente</Label>
        <ClientSelector clients={clients} value={clientId} onChange={setClientId} />
        {state.fieldErrors?.clientId ? (
          <p className="text-sm text-destructive">{state.fieldErrors.clientId}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Servicio</Label>
        <ServiceSelector
          services={services}
          value={serviceId}
          onChange={(id, duration) => {
            setServiceId(id);
            setDurationMinutes(duration);
          }}
        />
        {state.fieldErrors?.serviceId ? (
          <p className="text-sm text-destructive">{state.fieldErrors.serviceId}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="date">Fecha</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={defaultValues?.date}
            required
            className="w-full min-w-0"
            aria-invalid={Boolean(state.fieldErrors?.date)}
          />
          {state.fieldErrors?.date ? (
            <p className="text-sm text-destructive">{state.fieldErrors.date}</p>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="time">Hora</Label>
          <Input
            id="time"
            name="time"
            type="time"
            defaultValue={defaultValues?.time}
            required
            className="w-full min-w-0"
            aria-invalid={Boolean(state.fieldErrors?.time)}
          />
          {state.fieldErrors?.time ? (
            <p className="text-sm text-destructive">{state.fieldErrors.time}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="durationMinutes">Duración (minutos)</Label>
        <Input
          id="durationMinutes"
          name="durationMinutes"
          type="number"
          min={1}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={defaultValues?.notes ?? undefined}
          rows={2}
        />
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
        <Button
          type="submit"
          className="flex-1"
          disabled={isPending || !clientId || !serviceId}
        >
          {isPending ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
