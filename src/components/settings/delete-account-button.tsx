"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { deleteAccount } from "@/app/dashboard/configuracion/delete-account-actions";

export function DeleteAccountButton() {
  return (
    <ConfirmDialog
      trigger={
        <Button variant="destructive">
          <Trash2 className="size-4" aria-hidden="true" />
          Eliminar mi cuenta y mis datos
        </Button>
      }
      title="¿Eliminar tu cuenta y todos tus datos?"
      description="Se borrarán de forma irreversible tu negocio, clientes, servicios, citas y recordatorios. Esta acción no se puede deshacer."
      confirmLabel="Eliminar todo"
      onConfirm={() => deleteAccount()}
    />
  );
}
