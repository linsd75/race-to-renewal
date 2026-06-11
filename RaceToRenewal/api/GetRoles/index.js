"use strict";

/**
 * Roles function for Azure Static Web Apps (rolesSource = /api/GetRoles).
 *
 * The pre-configured Entra ID provider (/.auth/login/aad) is MULTI-TENANT,
 * so by itself it would let any work/school account from ANY org sign in.
 * This function grants the custom "msft" role ONLY when the signed-in user's
 * tenant ID matches an allowed tenant — i.e. a Microsoft employee. All routes
 * in staticwebapp.config.json require the "msft" role, so non-Microsoft
 * accounts authenticate but receive no role and are denied (redirected to login).
 *
 * No app registration and no client secret are required for this setup.
 *
 * Configure allowed tenants via the app setting ALLOWED_TENANT_IDS
 * (comma-separated GUIDs). Defaults to the Microsoft corporate tenant.
 */

const DEFAULT_MICROSOFT_TENANT = "72f988bf-86f1-41af-91ab-2d7cd011db47";
const TENANT_CLAIM_TYPES = [
  "http://schemas.microsoft.com/identity/claims/tenantid",
  "tid"
];

module.exports = async function (context, req) {
  const allowed = (process.env.ALLOWED_TENANT_IDS || DEFAULT_MICROSOFT_TENANT)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const body = (req && req.body) || {};
  const claims = Array.isArray(body.claims) ? body.claims : [];

  let tenantId = "";
  for (const c of claims) {
    if (c && TENANT_CLAIM_TYPES.includes(c.typ)) {
      tenantId = String(c.val || "").toLowerCase();
      if (tenantId) break;
    }
  }
  // Fallback if the platform ever surfaces tenantId directly on the body.
  if (!tenantId && body.tenantId) tenantId = String(body.tenantId).toLowerCase();

  const roles = tenantId && allowed.includes(tenantId) ? ["msft"] : [];

  context.res = {
    headers: { "Content-Type": "application/json" },
    body: { roles }
  };
};
