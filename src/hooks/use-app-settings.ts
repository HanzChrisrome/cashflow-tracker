import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import {
  DEFAULT_WARNING_THRESHOLD,
  THRESHOLD_MAX,
  THRESHOLD_MIN,
} from "@/lib/limit-status";

async function getUserId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

async function fetchWarningThreshold(): Promise<number> {
  const userId = await getUserId();
  if (!userId) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("app_settings")
    .select("warning_threshold")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.warning_threshold ?? DEFAULT_WARNING_THRESHOLD;
}

export function useAppSettings() {
  return useQuery({
    queryKey: queryKeys.appSettings.all,
    queryFn: fetchWarningThreshold,
  });
}

export function useUpdateWarningThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threshold: number) => {
      if (
        !Number.isInteger(threshold) ||
        threshold < THRESHOLD_MIN ||
        threshold > THRESHOLD_MAX
      ) {
        throw new Error(
          `Threshold must be a whole number between ${THRESHOLD_MIN} and ${THRESHOLD_MAX}`,
        );
      }
      const userId = await getUserId();
      if (!userId) throw new Error("Not signed in");

      // Upsert covers users who signed up before per-user settings existed.
      const { error } = await supabase.from("app_settings").upsert(
        {
          user_id: userId,
          warning_threshold: threshold,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      return threshold;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appSettings.all });
    },
  });
}
