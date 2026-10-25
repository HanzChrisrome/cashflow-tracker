import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

export function useProviders() {
  return useQuery({
    queryKey: queryKeys.providers.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}
