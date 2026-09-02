"use client";

import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { buildReminderUrlForAppointment } from "@/app/dashboard/citas/whatsapp-actions";
import {
  markReminderPrepared,
  markReminderSent,
} from "@/app/dashboard/citas/reminders-actions";

export function WhatsAppReminderButton({
  appointmentId,
  alreadySent,
}: {
  appointmentId: string;
  alreadySent: boolean;
}) {
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(alreadySent);

  if (sent) {
    return (
      <span className="text-sm font-medium text-primary">
        ✓ Recordatorio enviado
      </span>
    );
  }

  if (awaitingConfirmation) {
    return (
      <div className="flex flex-col items-end gap-1">
        <p className="text-sm text-muted-foreground">¿Has enviado el mensaje?</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAwaitingConfirmation(false)}
            disabled={isPending}
          >
            Volver
          </Button>
          <Button
            size="sm"
            className="bg-[#25D366] text-white hover:bg-[#1ebe57]"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const result = await markReminderSent(appointmentId);
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                setSent(true);
              });
            }}
          >
            Sí, enviado
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await buildReminderUrlForAppointment(appointmentId);
          if (result.error || !result.url) {
            toast.error(result.error ?? "No se pudo generar el recordatorio.");
            return;
          }
          window.open(result.url, "_blank", "noopener,noreferrer");
          await markReminderPrepared(appointmentId);
          setAwaitingConfirmation(true);
        });
      }}
    >
      <MessageCircle className="size-4" aria-hidden="true" />
      Recordar por WhatsApp
    </Button>
  );
}
