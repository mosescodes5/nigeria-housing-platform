import { hasPermission, type Role } from "@/modules/identity/rbac";

export type FavouriteState = "hidden" | "anon" | "saved" | "unsaved";

export function favouriteState(user: { role: Role } | null, saved: ReadonlySet<string>, propertyId: string): FavouriteState {
  if (!user) return "anon";
  if (!hasPermission(user.role, "property:favourite")) return "hidden";
  return saved.has(propertyId) ? "saved" : "unsaved";
}
