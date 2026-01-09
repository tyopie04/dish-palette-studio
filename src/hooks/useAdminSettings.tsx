import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminSettings {
  id: string;
  master_prompt: string;
  default_resolution: string;
  default_ratio: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsInput {
  master_prompt?: string;
  default_resolution?: string;
  default_ratio?: string;
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin-settings"],
    queryFn: async (): Promise<AdminSettings | null> => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 60000,
  });
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSettingsInput) => {
      // First check if settings exist
      const { data: existing } = await supabase
        .from("admin_settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("admin_settings")
          .update(input)
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("admin_settings")
          .insert({
            master_prompt: input.master_prompt || '',
            default_resolution: input.default_resolution || '1K',
            default_ratio: input.default_ratio || '1:1',
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
  });
}
