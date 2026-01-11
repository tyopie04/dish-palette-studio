import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActiveStyle {
  id: string;
  name: string;
  description: string | null;
  prompt_modifier: string;
  thumbnail_url: string | null;
  category: string;
  is_default: boolean;
}

export function useActiveStyles() {
  return useQuery({
    queryKey: ["active-styles"],
    queryFn: async (): Promise<ActiveStyle[]> => {
      const { data, error } = await supabase
        .from("styles")
        .select("id, name, description, prompt_modifier, thumbnail_url, category, is_default")
        .eq("status", "active")
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60000, // Cache for 1 minute
  });
}
