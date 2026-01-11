import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Style {
  id: string;
  name: string;
  description: string | null;
  prompt_modifier: string;
  thumbnail_url: string | null;
  organization_id: string | null;
  organization_name?: string | null;
  has_color_picker: boolean;
  category: string;
  status: 'active' | 'inactive';
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStyleInput {
  name: string;
  description?: string;
  prompt_modifier: string;
  thumbnail_url?: string;
  organization_id?: string | null;
  has_color_picker?: boolean;
  category?: string;
  status?: 'active' | 'inactive';
  is_default?: boolean;
}

export interface UpdateStyleInput {
  id: string;
  name?: string;
  description?: string;
  prompt_modifier?: string;
  thumbnail_url?: string;
  organization_id?: string | null;
  has_color_picker?: boolean;
  category?: string;
  status?: 'active' | 'inactive';
  is_default?: boolean;
}

export function useStyles(filterOrgId?: string) {
  return useQuery({
    queryKey: ["admin-styles", filterOrgId],
    queryFn: async (): Promise<Style[]> => {
      let query = supabase
        .from("styles")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterOrgId === "global") {
        query = query.is("organization_id", null);
      } else if (filterOrgId && filterOrgId !== "all") {
        query = query.eq("organization_id", filterOrgId);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data) return [];

      // Get organization names
      const orgIds = [...new Set(data.filter(s => s.organization_id).map(s => s.organization_id!))];
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name")
        .in("id", orgIds.length > 0 ? orgIds : ['00000000-0000-0000-0000-000000000000']);

      const orgMap = new Map(orgs?.map(o => [o.id, o.name]) ?? []);

      return data.map(style => ({
        ...style,
        status: style.status as 'active' | 'inactive',
        organization_name: style.organization_id ? orgMap.get(style.organization_id) : null,
      }));
    },
    staleTime: 30000,
  });
}

export function useCreateStyle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateStyleInput) => {
      const { data, error } = await supabase
        .from("styles")
        .insert({
          name: input.name,
          description: input.description || null,
          prompt_modifier: input.prompt_modifier,
          thumbnail_url: input.thumbnail_url || null,
          organization_id: input.organization_id || null,
          has_color_picker: input.has_color_picker ?? false,
          category: input.category || 'Studio',
          status: input.status || 'active',
          is_default: input.is_default ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-styles"] });
    },
  });
}

export function useUpdateStyle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateStyleInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from("styles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-styles"] });
    },
  });
}

export function useDeleteStyle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (styleId: string) => {
      const { error } = await supabase
        .from("styles")
        .delete()
        .eq("id", styleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-styles"] });
    },
  });
}
