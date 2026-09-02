"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { toggleServiceActive } from "@/app/dashboard/servicios/actions";

export function ServiceActiveToggle({
  serviceId,
  active,
}: {
  serviceId: string;
  active: boolean;
}) {
  const [optimisticActive, setOptimisticActive] = useOptimistic(active);
  const [, startTransition] = useTransition();

  return (
    <Switch
      checked={optimisticActive}
      aria-label={optimisticActive ? "Desactivar servicio" : "Activar servicio"}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          setOptimisticActive(checked);
          const result = await toggleServiceActive(serviceId, checked);
          if (result.error) {
            toast.error(result.error);
          }
        });
      }}
    />
  );
}
