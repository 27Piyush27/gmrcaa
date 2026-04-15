import { servicesData } from "@/lib/servicesData";

// Build a fallback map: backendServiceId -> title
const SERVICE_NAME_FALLBACK = Object.fromEntries(
  servicesData.map((s) => [s.backendServiceId, s.title])
);

/**
 * Resolves a human-readable service name from a service request object.
 * First checks the joined `services.name` from Supabase, then falls back
 * to matching against the local servicesData by id or backendServiceId.
 */
export function resolveServiceName(request) {
  // 1. Prefer joined Supabase services.name
  if (request.services?.name) return request.services.name;
  // 2. Try matching by frontend service ID (e.g., "income-tax-filing")
  const byFrontendId = servicesData.find((s) => s.id === request.service_id);
  if (byFrontendId) return byFrontendId.title;
  // 3. Try matching by backend service ID (e.g., "tax")
  if (SERVICE_NAME_FALLBACK[request.service_id]) {
    return SERVICE_NAME_FALLBACK[request.service_id];
  }
  // 4. Last resort: raw service_id
  return request.service_id;
}
