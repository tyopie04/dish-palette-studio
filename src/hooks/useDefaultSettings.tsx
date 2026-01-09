import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDefaultSettings() {
  return useQuery({
    queryKey: ["default-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("default_resolution, default_ratio")
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn("Could not fetch default settings:", error);
        return { default_resolution: "2K", default_ratio: "1:1" };
      }
      
      return data || { default_resolution: "2K", default_ratio: "1:1" };
    },
    staleTime: 300000, // 5 minutes - these don't change often
  });
}
