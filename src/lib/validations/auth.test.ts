import { describe, expect, it } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth";

describe("registerSchema", () => {
  it("acepta datos válidos", () => {
    expect(
      registerSchema.safeParse({
        fullName: "Ana Profesional",
        email: "ana@example.com",
        password: "12345678",
      }).success,
    ).toBe(true);
  });

  it("rechaza email inválido", () => {
    expect(
      registerSchema.safeParse({
        fullName: "Ana",
        email: "no-es-un-email",
        password: "12345678",
      }).success,
    ).toBe(false);
  });

  it("rechaza contraseña de menos de 8 caracteres", () => {
    expect(
      registerSchema.safeParse({
        fullName: "Ana",
        email: "ana@example.com",
        password: "1234567",
      }).success,
    ).toBe(false);
  });

  it("rechaza nombre vacío", () => {
    expect(
      registerSchema.safeParse({
        fullName: "",
        email: "ana@example.com",
        password: "12345678",
      }).success,
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("acepta credenciales válidas", () => {
    expect(
      loginSchema.safeParse({ email: "ana@example.com", password: "x" }).success,
    ).toBe(true);
  });

  it("rechaza contraseña vacía", () => {
    expect(loginSchema.safeParse({ email: "ana@example.com", password: "" }).success).toBe(
      false,
    );
  });
});

describe("forgotPasswordSchema", () => {
  it("rechaza email vacío", () => {
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("acepta cuando ambas contraseñas coinciden", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "12345678",
        confirmPassword: "12345678",
      }).success,
    ).toBe(true);
  });

  it("rechaza cuando las contraseñas no coinciden", () => {
    const result = resetPasswordSchema.safeParse({
      password: "12345678",
      confirmPassword: "distinta1",
    });
    expect(result.success).toBe(false);
  });
});
