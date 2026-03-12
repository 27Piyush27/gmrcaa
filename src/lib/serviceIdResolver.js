import { supabase } from "@/integrations/supabase/client";

const SERVICE_ALIASES = {
  tax: ["tax", "income tax", "gst", "tds", "itr filing", "tax advisory"],
  auditing: ["audit", "auditing", "assurance"],
  "company-law": ["company law", "secretarial", "company incorporation", "compliance"],
  payroll: ["payroll", "salary"],
  "finance-advisory": ["finance advisory", "project finance", "valuation"],
  accounting: ["accounting", "bookkeeping"]
};

const normalize = (value) =>
value.
toLowerCase().
replace(/[^a-z0-9]+/g, " ").
trim();

/**
 * Resolves a service id that exists in the connected DB.
 * Falls back to preferredId if lookup is not possible.
 */
export async function resolveServiceIdForDb(preferredId, serviceTitle) {
  try {
    const { data, error } = await supabase.from("services").select("id, name").limit(200);
    if (error || !data?.length) return preferredId;

    const exact = data.find((s) => s.id === preferredId);
    if (exact) return exact.id;

    const hints = [
    ...(SERVICE_ALIASES[preferredId] || []),
    serviceTitle || "",
    preferredId].

    map(normalize).
    filter(Boolean);

    const match = data.find((s) => {
      const name = normalize(s.name || "");
      return hints.some((hint) => name.includes(hint) || hint.includes(name));
    });

    return match?.id || preferredId;
  } catch {
    return preferredId;
  }
}