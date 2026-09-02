"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ServiceOption = {
  id: string;
  name: string;
  durationMinutes: number;
};

export function ServiceSelector({
  services,
  value,
  onChange,
}: {
  services: ServiceOption[];
  value: string | null;
  onChange: (serviceId: string, durationMinutes: number) => void;
}) {
  return (
    <Select
      value={value ?? undefined}
      onValueChange={(serviceId) => {
        const service = services.find((s) => s.id === serviceId);
        if (service) {
          onChange(service.id, service.durationMinutes);
        }
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecciona un servicio" />
      </SelectTrigger>
      <SelectContent>
        {services.map((service) => (
          <SelectItem key={service.id} value={service.id}>
            {service.name} · {service.durationMinutes} min
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
