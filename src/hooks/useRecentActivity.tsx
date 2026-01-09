import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RecentGeneration {
  id: string;
  prompt: string | null;
  images: string[];
  created_at: string;
  user_id: string;
  user_email: string | null;
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["admin-recent-activity"],
    queryFn: async (): Promise<RecentGeneration[]> => {
      // Fetch recent generations
      const { data: generations, error: genError } = await supabase
        .from("generations")
        .select("id, prompt, images, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(10);

      if (genError) throw genError;

      if (!generations || generations.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(generations.map((g) => g.user_id))];

      // Fetch profiles for those users
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      if (profileError) throw profileError;

      // Create a map of user_id to email
      const emailMap = new Map(profiles?.map((p) => [p.id, p.email]) ?? []);

      // Combine the data
      return generations.map((gen) => ({
        ...gen,
        user_email: emailMap.get(gen.user_id) ?? null,
      }));
    },
    staleTime: 15000, // Cache for 15 seconds
  });
}
