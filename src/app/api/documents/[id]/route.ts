import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasPermission } from "@/modules/identity/rbac";
import { getCurrentUser } from "@/modules/identity/session";
import { getStorage, StorageUnavailableError } from "@/modules/storage/storage";

export const dynamic = "force-dynamic";

/** Private documents are only ever served after an owner-or-reviewer check. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await params;
  const doc = await db.propertyDocument.findUnique({ where: { id }, include: { property: { select: { ownerId: true } } } });
  const allowed = doc && (doc.property.ownerId === user.id || hasPermission(user.role, "property:moderate"));
  // Same response whether it is missing or forbidden, so document IDs cannot be probed.
  if (!doc || !allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let bytes: Uint8Array | null;
  try {
    bytes = await getStorage().get(doc.storageKey);
  } catch (e) {
    if (e instanceof StorageUnavailableError) return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
    throw e;
  }
  if (!bytes) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const safeName = encodeURIComponent(doc.originalName);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename*=UTF-8''${safeName}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
