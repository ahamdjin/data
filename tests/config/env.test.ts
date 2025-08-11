import { describe, it, expect, vi } from "vitest";

// IMPORTANT: import lazily to allow env injection
describe("env", () => {
  it("fails when DATABASE_URL missing", async () => {
    const OLD = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    await expect(async () => {
      vi.resetModules();
      await import("@/config/env");
    }).rejects.toThrow(/DATABASE_URL/i);
    if (OLD) process.env.DATABASE_URL = OLD;
  });

  it("loads with valid env", async () => {
    const OLD = { ...process.env };
    process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgres://user:pass@localhost:5432/db";
    vi.resetModules();
    const { env } = await import("@/config/env");
    expect(env.server.DATABASE_URL).toMatch(/^postgres:/);
    process.env = OLD as any;
  });
});
