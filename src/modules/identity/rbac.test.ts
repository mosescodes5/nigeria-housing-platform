import { describe, expect, it } from "vitest";
import { canAccessOwnRecord, hasPermission, requirePermission } from "./rbac";

describe("rbac", () => {
  it("lets only admins publish legal documents", () => {
    expect(hasPermission("ADMIN", "legal:publish")).toBe(true);
    for (const role of ["TENANT", "BUYER", "LANDLORD", "AGENT", "SUPPORT"] as const) {
      expect(hasPermission(role, "legal:publish")).toBe(false);
    }
  });

  it("does not let tenants see other users' savings or the ledger", () => {
    expect(hasPermission("TENANT", "savings:view_any")).toBe(false);
    expect(hasPermission("TENANT", "ledger:view_any")).toBe(false);
  });

  it("does not let landlords moderate listings", () => {
    expect(hasPermission("LANDLORD", "property:moderate")).toBe(false);
  });

  it("limits favourites and enquiries to tenants and buyers", () => {
    expect(hasPermission("TENANT", "property:enquire")).toBe(true);
    expect(hasPermission("BUYER", "property:favourite")).toBe(true);
    for (const role of ["LANDLORD", "AGENT", "SUPPORT", "ADMIN"] as const) {
      expect(hasPermission(role, "property:enquire")).toBe(false);
    }
  });

  it("separates the landlord/agent portal, applications and admin review", () => {
    expect(hasPermission("LANDLORD", "listing:manage_own")).toBe(true);
    expect(hasPermission("AGENT", "listing:manage_own")).toBe(true);
    expect(hasPermission("TENANT", "listing:manage_own")).toBe(false);
    expect(hasPermission("TENANT", "application:submit")).toBe(true);
    expect(hasPermission("LANDLORD", "application:submit")).toBe(false);
    expect(hasPermission("LANDLORD", "business:review")).toBe(false);
    expect(hasPermission("ADMIN", "business:review")).toBe(true);
    expect(hasPermission("SUPPORT", "property:moderate")).toBe(false);
  });

  it("requirePermission throws when forbidden", () => {
    expect(() => requirePermission("AGENT", "users:manage")).toThrow(/Forbidden/);
  });

  it("restricts own-record access to the owner", () => {
    expect(canAccessOwnRecord({ id: "u1", role: "TENANT" }, "u1")).toBe(true);
    expect(canAccessOwnRecord({ id: "u1", role: "TENANT" }, "u2")).toBe(false);
    // Even admins use explicit permissions, not implicit ownership.
    expect(canAccessOwnRecord({ id: "a1", role: "ADMIN" }, "u2")).toBe(false);
  });
});
