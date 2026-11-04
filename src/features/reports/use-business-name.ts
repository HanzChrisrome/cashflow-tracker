import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

export const FALLBACK_BUSINESS_NAME = "Cashflow Tracker";

async function fetchBusinessName(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  const name =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email;
  return name?.trim() || FALLBACK_BUSINESS_NAME;
}

export function useBusinessName() {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: fetchBusinessName,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
