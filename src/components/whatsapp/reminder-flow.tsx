"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatTime } from "@/lib/dates/format";
import { buildReminderUrlForAppointment } from "@/app/dashboard/citas/whatsapp-actions";
import {
  markReminderPrepared,
  markReminderSent,
} from "@/app/dashboard/citas/reminders-actions";

export type ReminderFlowItem = {
  id: string;
  startsAt: string;
  clientName: string;
  serviceName: string | null;
};

/**
 * Flujo secuencial "Recordar citas de mañana" (SPEC.md sección 15): abre
 * WhatsApp para cada cita pendiente de recordatorio, una a una, pidiendo
 * confirmación antes de avanzar a la siguiente.
 */
export function ReminderFlow({
  items,
  timezone,
}: {
  items: ReminderFlowItem[];
  timezone: string;
}) {
  const [open, setOpen] = useState(false);
  // Instantánea de los pendientes al abrir el diálogo: los props "items"
  // pueden cambiar (revalidatePath vuelve a ejecutar el Server Component
  // padre) mientras el flujo sigue abierto; sin esta instantánea, el índice
  // local queda desincronizado del array recibido y el flujo se rompe a
  // mitad de camino (detectado probando el flujo con más de una cita).
  const [queue, setQueue] = useState<ReminderFlowItem[]>([]);
  const [index, setIndex] = useState(0);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const current = queue[index];
  const isLast = index === queue.length - 1;

  function handleOpen(next: boolean) {
    setOpen(next);
    if (next) {
      setQueue(items);
      setIndex(0);
      setAwaitingConfirmation(false);
    } else {
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleOpen(true)}
        disabled={items.length === 0}
      >
        <MessageCircle className="size-4" aria-hidden="true" />
        Recordar citas de mañana
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Recordatorios de mañana</DialogTitle>
        </DialogHeader>

        {current ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {index + 1} de {queue.length}
            </p>
            <div>
              <p className="text-lg font-medium">{current.clientName}</p>
              <p className="text-sm text-muted-foreground">
                Mañana · {formatTime(current.startsAt, timezone)}
                {current.serviceName ? ` · ${current.serviceName}` : ""}
              </p>
            </div>

            {!awaitingConfirmation ? (
              <Button
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await buildReminderUrlForAppointment(current.id);
                    if (result.error || !result.url) {
                      toast.error(result.error ?? "No se pudo generar el recordatorio.");
                      return;
                    }
                    window.open(result.url, "_blank", "noopener,noreferrer");
                    await markReminderPrepared(current.id);
                    setAwaitingConfirmation(true);
                  });
                }}
              >
                Abrir WhatsApp
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  ¿Has enviado el mensaje?
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={isPending}
                    onClick={() => setAwaitingConfirmation(false)}
                  >
                    Volver
                  </Button>
                  <Button
                    className="flex-1 bg-[#25D366] text-white hover:bg-[#1ebe57]"
                    disabled={isPending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await markReminderSent(current.id);
                        if (result.error) {
                          toast.error(result.error);
                          return;
                        }
                        setAwaitingConfirmation(false);
                        if (isLast) {
                          handleOpen(false);
                        } else {
                          setIndex((i) => i + 1);
                        }
                      });
                    }}
                  >
                    Sí, enviado
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No quedan recordatorios pendientes.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
