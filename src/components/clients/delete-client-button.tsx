"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { deleteClient } from "@/app/dashboard/clientes/actions";

export function DeleteClientButton({ clientId }: { clientId: string }) {
  const router = useRouter();

  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline">
          <Trash2 className="size-4" aria-hidden="true" />
          Eliminar
        </Button>
      }
      title="¿Seguro que quieres eliminar este cliente?"
      description="Esta acción no se puede deshacer."
      confirmLabel="Eliminar cliente"
      onConfirm={async () => {
        const result = await deleteClient(clientId);
        if (result.success) {
          router.push("/dashboard/clientes");
        }
        return result;
      }}
    />
  );
}
