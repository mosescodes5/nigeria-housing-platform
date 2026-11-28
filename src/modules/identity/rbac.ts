export const ROLES = ["TENANT", "BUYER", "LANDLORD", "AGENT", "ADMIN", "SUPPORT"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "property:browse",
  "property:create",
  "property:favourite",
  "property:enquire",
  "property:moderate",
  "business:review",
  "listing:manage_own",
  "application:submit",
  "savings:manage_own",
  "savings:view_any",
  "ledger:view_any",
  "users:manage",
  "legal:publish",
  "audit:view",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const MATRIX: Record<Role, readonly Permission[]> = {
  TENANT: ["property:browse", "property:favourite", "property:enquire", "application:submit", "savings:manage_own"],
  BUYER: ["property:browse", "property:favourite", "property:enquire", "application:submit", "savings:manage_own"],
  LANDLORD: ["property:browse", "property:create", "listing:manage_own"],
  AGENT: ["property:browse", "property:create", "listing:manage_own"],
  SUPPORT: ["property:browse", "savings:view_any", "audit:view"],
  ADMIN: [
    "property:browse",
    "property:moderate",
    "business:review",
    "savings:view_any",
    "ledger:view_any",
    "users:manage",
    "legal:publish",
    "audit:view",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return MATRIX[role].includes(permission);
}

/** Server-side guard: throws instead of returning, so handlers cannot forget to check. */
export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Forbidden: role ${role} lacks ${permission}`);
  }
}

/** Ownership check for customer-owned records (savings, applications, etc.). */
export function canAccessOwnRecord(actor: { id: string; role: Role }, ownerId: string): boolean {
  return actor.id === ownerId;
}
