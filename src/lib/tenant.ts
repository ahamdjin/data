export type TenantContext = {
  orgId: string;
  orgSlug?: string;
  userId?: string;
  roles?: string[];
};

export function resolveTenantFromRequest(req: Request | { headers: Headers }): TenantContext | null {
  const h = req instanceof Request ? req.headers : req.headers;
  const orgId = h.get("x-org-id");
  const orgSlug = h.get("x-org-slug");

  if (orgId) return { orgId, orgSlug: orgSlug ?? undefined };
  return null;
}
