import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures the current user is authenticated AND either an active member or an admin.
 * Admins (super_admin / admin) bypass the membership activation gate and get full access.
 */
export async function requireActiveOrAdmin() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw redirect({ to: "/auth" });

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id);
  const isAdmin = (roles ?? []).some((r) => r.role === "super_admin" || r.role === "admin");
  if (isAdmin) return;

  const { data: prof } = await supabase
    .from("profiles")
    .select("membership_status")
    .eq("id", data.user.id)
    .maybeSingle();
  if (prof && prof.membership_status !== "active") {
    throw redirect({ to: "/activate" });
  }
}
