import { supabase } from "@/integrations/supabase/client";

/**
 * Notify all staff (admin, ca) about an event.
 * Roles are stored in user_roles table — NOT on the profiles table.
 */
export async function notifyStaff(title, message, type = "system") {
  try {
    // Step 1: Get all user_ids that have admin or ca role from user_roles table
    const { data: staffRoles, error: roleError } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "ca"]);

    if (roleError) {
      console.error("Error fetching staff roles for notification:", roleError);
      return;
    }

    if (!staffRoles || staffRoles.length === 0) return;

    // NOTE: The DB column is "body", not "message"
    const notifications = staffRoles.map((r) => ({
      user_id: r.user_id,
      title,
      body: message,
      type,
    }));

    const { error: insertError } = await supabase.from("notifications").insert(notifications);

    if (insertError) {
      console.error("Error inserting notifications for staff:", insertError);
    }
  } catch (err) {
    console.error("Failed to notify staff:", err);
  }
}
