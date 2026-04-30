import { supabase } from "@/integrations/supabase/client";

/**
 * Notify all staff (admin, ca) about an event.
 */
export async function notifyStaff(title, message, type = "system") {
  try {
    const { data: staffMembers, error: fetchError } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["admin", "ca"]);

    if (fetchError) {
      console.error("Error fetching staff for notification:", fetchError);
      return;
    }

    if (!staffMembers || staffMembers.length === 0) return;

    const notifications = staffMembers.map((staff) => ({
      user_id: staff.id,
      title,
      message,
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
