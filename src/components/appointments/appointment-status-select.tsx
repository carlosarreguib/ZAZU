"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MVP_APPOINTMENT_STATUSES, APPOINTMENT_STATUS_LABELS } from "@/lib/validations/appointment";
import { updateAppointmentStatus } from "@/app/dashboard/citas/actions";

export function AppointmentStatusSelect({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: string;
}) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);
  const [, startTransition] = useTransition();

  return (
    <Select
      value={optimisticStatus}
      onValueChange={(next) => {
        startTransition(async () => {
          setOptimisticStatus(next);
          const result = await updateAppointmentStatus(appointmentId, next);
          if (result.error) {
            toast.error(result.error);
          }
        });
      }}
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MVP_APPOINTMENT_STATUSES.map((value) => (
          <SelectItem key={value} value={value}>
            {APPOINTMENT_STATUS_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
