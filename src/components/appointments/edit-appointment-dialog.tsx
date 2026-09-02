"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import type { ClientOption } from "@/components/clients/client-selector";
import type { ServiceOption } from "@/components/services/service-selector";
import {
  updateAppointment,
  type AppointmentFormState,
} from "@/app/dashboard/citas/actions";

export function EditAppointmentDialog({
  appointmentId,
  clients,
  services,
  defaultValues,
}: {
  appointmentId: string;
  clients: ClientOption[];
  services: ServiceOption[];
  defaultValues: {
    clientId: string;
    serviceId?: string;
    date: string;
    time: string;
    durationMinutes: number;
    notes?: string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const boundAction = updateAppointment.bind(
    null,
    appointmentId,
  ) as (
    state: AppointmentFormState,
    formData: FormData,
  ) => Promise<AppointmentFormState>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="size-4" aria-hidden="true" />
        Editar
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar cita</DialogTitle>
        </DialogHeader>
        <AppointmentForm
          action={boundAction}
          clients={clients}
          services={services}
          defaultValues={defaultValues}
          submitLabel="Guardar cambios"
          onCancel={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
