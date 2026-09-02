"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ServiceForm } from "@/components/services/service-form";
import { updateService, type ServiceFormState } from "@/app/dashboard/servicios/actions";

export function EditServiceDialog({
  serviceId,
  name,
  durationMinutes,
}: {
  serviceId: string;
  name: string;
  durationMinutes: number;
}) {
  const [open, setOpen] = useState(false);
  const boundAction = updateService.bind(
    null,
    serviceId,
  ) as (state: ServiceFormState, formData: FormData) => Promise<ServiceFormState>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="size-4" aria-hidden="true" />
        Editar
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar servicio</DialogTitle>
        </DialogHeader>
        <ServiceForm
          action={boundAction}
          defaultValues={{ name, durationMinutes }}
          submitLabel="Guardar cambios"
          onCancel={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
