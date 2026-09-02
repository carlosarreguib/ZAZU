"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  updateReminderTemplate,
  type ReminderTemplateFormState,
} from "@/app/dashboard/configuracion/actions";

const initialState: ReminderTemplateFormState = {};

const VARIABLES = [
  { name: "{{client_name}}", description: "Nombre del cliente" },
  { name: "{{service}}", description: "Nombre del servicio" },
  { name: "{{date}}", description: "Fecha de la cita" },
  { name: "{{time}}", description: "Hora de la cita" },
  { name: "{{business_name}}", description: "Nombre de tu negocio" },
];

export function ReminderTemplateForm({
  defaultTemplate,
}: {
  defaultTemplate: string;
}) {
  const [state, formAction, isPending] = useActionState(
    updateReminderTemplate,
    initialState,
  );

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="template">Mensaje de recordatorio</Label>
        <Textarea
          id="template"
          name="template"
          defaultValue={defaultTemplate}
          rows={4}
          required
          aria-invalid={Boolean(state.fieldErrors?.template)}
        />
        {state.fieldErrors?.template ? (
          <p className="text-sm text-destructive">{state.fieldErrors.template}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        <p>Variables disponibles:</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {VARIABLES.map((v) => (
            <li key={v.name}>
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                {v.name}
              </code>{" "}
              {v.description}
            </li>
          ))}
        </ul>
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
        {isPending ? "Guardando..." : "Guardar plantilla"}
      </Button>
    </form>
  );
}
