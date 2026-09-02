import { test, expect } from "@playwright/test";

/**
 * E2E del camino crítico completo (SPEC.md secciones 43 y 50): registro,
 * onboarding, login, crear cliente, crear cita, ver la cita en "Hoy",
 * abrir el recordatorio de WhatsApp y marcarlo como enviado.
 */
test("registro, onboarding, cliente, cita y recordatorio de WhatsApp", async ({
  page,
  context,
}) => {
  const email = `e2e+${Date.now()}@example.com`;
  const password = "E2ETestPassword123";

  await test.step("registro", async () => {
    await page.goto("/register");
    await page.fill('input[name="fullName"]', "E2E Owner");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/onboarding/);
  });

  await test.step("onboarding de 3 pasos", async () => {
    await page.fill("input#businessName", "E2E Clínica");
    await page.click('button:has-text("Continuar")');
    await page.fill("input#contactName", "E2E Owner");
    await page.click('button:has-text("Continuar")');
    await page.fill("input#serviceName", "Fisioterapia");
    await page.fill("input#durationMinutes", "50");
    await page.click('button:has-text("Tu agenda está lista")');
    await page.waitForURL(/\/dashboard/);
  });

  await test.step("crear cliente y cita para hoy", async () => {
    await page.click('button:has-text("Nueva cita")');
    await page.click('button:has-text("Selecciona un cliente")');
    await page.click('button:has-text("Crear nuevo cliente")');
    await page.fill("#new-client-name", "Cliente E2E");
    await page.fill("#new-client-phone", "+34600111222");
    await page.click('button:has-text("Crear"):not(:has-text("nuevo"))');
    await page.waitForTimeout(500);

    await page.click('[role="combobox"]:has-text("Selecciona un servicio")');
    await page.getByRole("option", { name: /fisioterapia/i }).click();

    const today = new Date().toISOString().slice(0, 10);
    await page.fill("input#date", today);
    await page.fill("input#time", "23:45");
    await page.click('button:has-text("Agendar cita")');
    await page.waitForSelector('[role="dialog"]', {
      state: "detached",
      timeout: 15000,
    });
  });

  await test.step("la cita aparece en la vista Hoy", async () => {
    await page.goto("/dashboard");
    await expect(page.getByText("Cliente E2E")).toBeVisible();
  });

  await test.step("abrir recordatorio de WhatsApp con el numero y mensaje correctos", async () => {
    const [popup] = await Promise.all([
      context.waitForEvent("page"),
      page.click('button:has-text("Recordar por WhatsApp")'),
    ]);
    const url = new URL(popup.url());
    expect(url.searchParams.get("phone")).toBe("34600111222");
    expect(url.searchParams.get("text")).toContain("Cliente E2E");
    await popup.close();
  });

  await test.step("marcar el recordatorio como enviado", async () => {
    await page.click('button:has-text("Sí, enviado")');
    await expect(page.getByText("Recordatorio enviado")).toBeVisible();
  });
});
