"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createClientInline } from "@/app/dashboard/clientes/actions";
import { formatClientName } from "@/lib/clients/name";

export type ClientOption = {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string;
};

export function ClientSelector({
  clients,
  value,
  onChange,
}: {
  clients: ClientOption[];
  value: string | null;
  onChange: (clientId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [localClients, setLocalClients] = useState(clients);

  const selected = localClients.find((c) => c.id === value);

  const filtered = useMemo(() => {
    if (!search.trim()) return localClients;
    const q = search.trim().toLowerCase();
    return localClients.filter(
      (c) =>
        formatClientName(c.firstName, c.lastName).toLowerCase().includes(q) ||
        c.phone.includes(q),
    );
  }, [localClients, search]);

  async function handleCreate(forceCreate = false) {
    setError(null);
    setDuplicate(null);
    setIsPending(true);
    const result = await createClientInline(
      newFirstName,
      newLastName || undefined,
      newPhone,
      forceCreate,
    );
    setIsPending(false);

    if (result.error) {
      setError(result.error);
      if (result.duplicateClientId && result.duplicateClientName) {
        setDuplicate({ id: result.duplicateClientId, name: result.duplicateClientName });
      }
      return;
    }

    if (result.clientId) {
      const created = {
        id: result.clientId,
        firstName: newFirstName.trim(),
        lastName: newLastName.trim() || null,
        phone: newPhone.trim(),
      };
      setLocalClients((prev) => [...prev, created]);
      onChange(result.clientId);
      setCreating(false);
      setNewFirstName("");
      setNewLastName("");
      setNewPhone("");
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start font-normal"
        >
          {selected
            ? `${formatClientName(selected.firstName, selected.lastName)} · ${selected.phone}`
            : "Selecciona un cliente"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {!creating ? (
          <div className="flex flex-col">
            <div className="border-b p-2">
              <Input
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                  Sin resultados.
                </p>
              ) : (
                filtered.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      onChange(client.id);
                      setOpen(false);
                    }}
                  >
                    <span className="font-medium">
                      {formatClientName(client.firstName, client.lastName)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {client.phone}
                    </span>
                  </button>
                ))
              )}
            </div>
            <div className="border-t p-1">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setCreating(true);
                  setNewFirstName(search);
                }}
              >
                <Plus className="size-4" aria-hidden="true" />
                Crear nuevo cliente
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-3">
            <p className="text-sm font-medium">Nuevo cliente</p>
            <div className="flex flex-col gap-1">
              <Label htmlFor="new-client-name">Nombre</Label>
              <Input
                id="new-client-name"
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="new-client-lastname">Apellido (opcional)</Label>
              <Input
                id="new-client-lastname"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="new-client-phone">Teléfono</Label>
              <Input
                id="new-client-phone"
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </div>
            {error ? (
              <div className="text-sm text-destructive">
                <p>{error}</p>
                {duplicate ? (
                  <button
                    type="button"
                    className="font-medium underline-offset-4 hover:underline"
                    onClick={() => {
                      onChange(duplicate.id);
                      setCreating(false);
                      setOpen(false);
                    }}
                  >
                    Usar {duplicate.name}
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setCreating(false);
                  setError(null);
                  setDuplicate(null);
                }}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={!newFirstName.trim() || !newPhone.trim() || isPending}
                onClick={() => handleCreate(false)}
              >
                {isPending ? "Creando..." : "Crear"}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
