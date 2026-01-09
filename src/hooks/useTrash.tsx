import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrashItem {
  id: string;
  name: string;
  thumbnail_url: string;
  original_url: string;
  deleted_at: string;
  deleted_by: string | null;
  deleted_by_email?: string | null;
  organization_id: string | null;
  organization_name?: string | null;
  user_id: string;
}

export function useTrash(organizationId?: string) {
  const queryClient = useQueryClient();

  const trashQuery = useQuery({
    queryKey: ["admin-trash", organizationId],
    queryFn: async (): Promise<TrashItem[]> => {
      let query = supabase
        .from("menu_photos")
        .select("id, name, thumbnail_url, original_url, deleted_at, deleted_by, organization_id, user_id")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (organizationId) {
        query = query.eq("organization_id", organizationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data) return [];

      // Get deleted_by emails
      const deletedByIds = [...new Set(data.filter(d => d.deleted_by).map(d => d.deleted_by!))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", deletedByIds.length > 0 ? deletedByIds : ['00000000-0000-0000-0000-000000000000']);

      const emailMap = new Map(profiles?.map(p => [p.id, p.email]) ?? []);

      // Get organization names
      const orgIds = [...new Set(data.filter(d => d.organization_id).map(d => d.organization_id!))];
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name")
        .in("id", orgIds.length > 0 ? orgIds : ['00000000-0000-0000-0000-000000000000']);

      const orgMap = new Map(orgs?.map(o => [o.id, o.name]) ?? []);

      return data.map(item => ({
        ...item,
        deleted_by_email: item.deleted_by ? emailMap.get(item.deleted_by) : null,
        organization_name: item.organization_id ? orgMap.get(item.organization_id) : null,
      }));
    },
    staleTime: 15000,
  });

  const restorePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase
        .from("menu_photos")
        .update({ deleted_at: null, deleted_by: null })
        .eq("id", photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trash"] });
    },
  });

  const permanentlyDeletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase
        .from("menu_photos")
        .delete()
        .eq("id", photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trash"] });
    },
  });

  return {
    trashItems: trashQuery.data ?? [],
    loading: trashQuery.isLoading,
    restorePhoto,
    permanentlyDeletePhoto,
  };
}
