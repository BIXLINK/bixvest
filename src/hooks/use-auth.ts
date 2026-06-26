import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null as User | null, loading };
}

export function useProfile() {
  const { session, loading } = useSession();
  const query = useQuery({
    queryKey: ["profile", session?.user.id],
    enabled: !!session?.user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session!.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  return { ...query, sessionLoading: loading, user: session?.user ?? null };
}

export function useIsAdmin() {
  const { session } = useSession();
  return useQuery({
    queryKey: ["is-admin", session?.user.id],
    enabled: !!session?.user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session!.user.id);
      if (error) throw error;
      return (data ?? []).some(r => r.role === "super_admin" || r.role === "admin");
    },
  });
}
