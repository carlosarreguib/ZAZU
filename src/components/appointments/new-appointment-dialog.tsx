"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
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
import { createAppointment } from "@/app/dashboard/citas/actions";

export function NewAppointmentDialog({
  clients,
  services,
  label = "Nueva cita",
  defaultDate,
}: {
  clients: ClientOption[];
  services: ServiceOption[];
  label?: string;
  defaultDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />
        {label}
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva cita</DialogTitle>
        </DialogHeader>
        <AppointmentForm
          action={createAppointment}
          clients={clients}
          services={services}
          defaultValues={{ date: defaultDate }}
          submitLabel="Agendar cita"
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
