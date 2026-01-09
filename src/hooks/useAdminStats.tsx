import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdminStats {
  totalClients: number;
  totalGenerations: number;
  generationsThisMonth: number;
  totalMenuPhotos: number;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async (): Promise<AdminStats> => {
      // Get first day of current month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Fetch all counts in parallel
      const [
        clientsResult,
        generationsResult,
        generationsThisMonthResult,
        menuPhotosResult,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("generations").select("*", { count: "exact", head: true }),
        supabase
          .from("generations")
          .select("*", { count: "exact", head: true })
          .gte("created_at", firstDayOfMonth),
        supabase.from("menu_photos").select("*", { count: "exact", head: true }),
      ]);

      return {
        totalClients: clientsResult.count ?? 0,
        totalGenerations: generationsResult.count ?? 0,
        generationsThisMonth: generationsThisMonthResult.count ?? 0,
        totalMenuPhotos: menuPhotosResult.count ?? 0,
      };
    },
    staleTime: 30000, // Cache for 30 seconds
  });
}
