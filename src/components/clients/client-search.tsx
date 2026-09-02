"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ClientSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="relative w-full max-w-sm">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        placeholder="Buscar por nombre o teléfono"
        aria-label="Buscar clientes"
        className="pl-9"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams);
          if (e.target.value) {
            params.set("q", e.target.value);
          } else {
            params.delete("q");
          }
          router.replace(`/dashboard/clientes?${params.toString()}`);
        }}
      />
    </div>
  );
}
