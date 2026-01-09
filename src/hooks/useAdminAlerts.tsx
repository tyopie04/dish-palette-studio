import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdminAlerts {
  failedGenerationsToday: number;
  inactiveClients: number;
}

export function useAdminAlerts() {
  return useQuery({
    queryKey: ["admin-alerts"],
    queryFn: async (): Promise<AdminAlerts> => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get all profiles to check for inactive clients
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, updated_at");

      if (profilesError) throw profilesError;

      // Count clients with no activity in last 7 days
      // We check their last generation or menu photo upload
      const profileIds = profiles?.map(p => p.id) ?? [];
      
      let inactiveCount = 0;
      
      if (profileIds.length > 0) {
        // Get last activity for each user
        const { data: recentGenerations } = await supabase
          .from("generations")
          .select("user_id, created_at")
          .in("user_id", profileIds)
          .gte("created_at", sevenDaysAgo);

        const { data: recentPhotos } = await supabase
          .from("menu_photos")
          .select("user_id, created_at")
          .in("user_id", profileIds)
          .gte("created_at", sevenDaysAgo);

        const activeUserIds = new Set([
          ...(recentGenerations?.map(g => g.user_id) ?? []),
          ...(recentPhotos?.map(p => p.user_id) ?? []),
        ]);

        inactiveCount = profileIds.filter(id => !activeUserIds.has(id)).length;
      }

      // For now, we don't track failed generations in the DB
      // This would require adding a status column to generations table
      const failedGenerationsToday = 0;

      return {
        failedGenerationsToday,
        inactiveClients: inactiveCount,
      };
    },
    staleTime: 60000, // Cache for 1 minute
  });
}
