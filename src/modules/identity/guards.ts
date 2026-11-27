import { notFound, redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./session";
import { hasPermission, type Permission } from "./rbac";

/** Use at the top of any protected server component, action or route handler. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Requires a permission. Responds 404 on failure so privileged areas are not advertised. */
export async function requireUserWithPermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) notFound();
  return user;
}
