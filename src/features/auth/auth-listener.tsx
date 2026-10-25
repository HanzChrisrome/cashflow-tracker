import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function AuthListener() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        queryClient.clear();
        router.invalidate(); // re-runs the guard, which redirects to /login
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return null;
}
