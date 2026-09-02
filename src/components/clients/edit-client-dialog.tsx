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
import { ClientForm } from "@/components/clients/client-form";
import { updateClient, type ClientFormState } from "@/app/dashboard/clientes/actions";

export function EditClientDialog({
  clientId,
  fullName,
  phone,
  notes,
}: {
  clientId: string;
  fullName: string;
  phone: string;
  notes: string | null;
}) {
  const [open, setOpen] = useState(false);
  const boundAction = updateClient.bind(
    null,
    clientId,
  ) as (state: ClientFormState, formData: FormData) => Promise<ClientFormState>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="size-4" aria-hidden="true" />
        Editar
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>
        <ClientForm
          action={boundAction}
          defaultValues={{ fullName, phone, notes }}
          submitLabel="Guardar cambios"
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
