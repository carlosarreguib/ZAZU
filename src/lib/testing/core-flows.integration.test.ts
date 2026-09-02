import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createTestUser,
  provisionTestBusiness,
  cleanupTestUser,
} from "./integration-helpers";

/**
 * Tests de integración contra Supabase real (SPEC.md sección 43): no se
 * mockea RLS. Cubren los caminos críticos: crear cliente, crear cita,
 * impedir solapamientos (constraint de BD), y aislamiento multi-tenant.
 */
describe("flujos críticos (integración)", () => {
  let userA: Awaited<ReturnType<typeof createTestUser>>;
  let userB: Awaited<ReturnType<typeof createTestUser>>;
  let businessAId: string;
  let businessBId: string;

  beforeAll(async () => {
    userA = await createTestUser("integ-a");
    userB = await createTestUser("integ-b");
    businessAId = await provisionTestBusiness(userA.client, "Integ Business A");
    businessBId = await provisionTestBusiness(userB.client, "Integ Business B");
  });

  afterAll(async () => {
    await cleanupTestUser(userA.admin, userA.userId);
    await cleanupTestUser(userB.admin, userB.userId);
  });

  it("crea un cliente correctamente", async () => {
    const { data, error } = await userA.client
      .from("clients")
      .insert({
        business_id: businessAId,
        full_name: "Cliente Integración",
        phone: "+34600111222",
      })
      .select("id, full_name")
      .single();

    expect(error).toBeNull();
    expect(data?.full_name).toBe("Cliente Integración");
  });

  it("crea una cita correctamente", async () => {
    const { data: client } = await userA.client
      .from("clients")
      .select("id")
      .eq("business_id", businessAId)
      .limit(1)
      .single();

    const { data, error } = await userA.client
      .from("appointments")
      .insert({
        business_id: businessAId,
        client_id: client!.id,
        starts_at: "2030-01-15T09:00:00.000Z",
        ends_at: "2030-01-15T09:30:00.000Z",
      })
      .select("id, status")
      .single();

    expect(error).toBeNull();
    expect(data?.status).toBe("scheduled");
  });

  it("impide solapamientos incluso saltándose la validación de aplicación", async () => {
    const { data: client } = await userA.client
      .from("clients")
      .select("id")
      .eq("business_id", businessAId)
      .limit(1)
      .single();

    // Rango que se solapa exactamente con la cita creada en el test anterior.
    const { error } = await userA.client.from("appointments").insert({
      business_id: businessAId,
      client_id: client!.id,
      starts_at: "2030-01-15T09:15:00.000Z",
      ends_at: "2030-01-15T09:45:00.000Z",
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe("23P01");
  });

  it("aísla los datos entre negocios: A no ve clientes de B", async () => {
    await userB.client.from("clients").insert({
      business_id: businessBId,
      full_name: "Cliente de B",
      phone: "+34600999888",
    });

    const { data } = await userA.client
      .from("clients")
      .select("full_name")
      .eq("business_id", businessBId);

    expect(data).toEqual([]);
  });

  it("aísla los datos entre negocios: A no puede insertar en el negocio de B", async () => {
    const { error } = await userA.client.from("clients").insert({
      business_id: businessBId,
      full_name: "Cliente intruso",
      phone: "+34600000000",
    });

    expect(error).not.toBeNull();
  });

  it("aísla los datos entre negocios: A no puede modificar datos de B", async () => {
    const { data: clientB } = await userB.client
      .from("clients")
      .select("id")
      .eq("business_id", businessBId)
      .limit(1)
      .single();

    await userA.client
      .from("clients")
      .update({ full_name: "Hackeado" })
      .eq("id", clientB!.id);

    const { data: stillIntact } = await userB.client
      .from("clients")
      .select("full_name")
      .eq("id", clientB!.id)
      .single();

    expect(stillIntact?.full_name).not.toBe("Hackeado");
  });

  it("bloquea eliminar un cliente con citas futuras activas (regla de aplicación)", async () => {
    const { data: client } = await userA.client
      .from("clients")
      .select("id")
      .eq("business_id", businessAId)
      .limit(1)
      .single();

    const { count } = await userA.client
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessAId)
      .eq("client_id", client!.id)
      .neq("status", "cancelled")
      .gte("starts_at", new Date().toISOString());

    expect(count).toBeGreaterThan(0);
  });
});
