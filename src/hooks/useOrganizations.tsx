import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  primary_color: string | null;
  logo_url: string | null;
  owner_id: string | null;
  disabled: boolean;
  created_at: string;
  updated_at: string;
  owner_email?: string | null;
  generations_count?: number;
  last_active?: string | null;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  primary_color?: string;
  owner_email?: string;
}

export interface UpdateOrganizationInput {
  id: string;
  name?: string;
  primary_color?: string;
  logo_url?: string;
  disabled?: boolean;
}

export function useOrganizations() {
  return useQuery({
    queryKey: ["admin-organizations"],
    queryFn: async (): Promise<Organization[]> => {
      // Fetch organizations
      const { data: orgs, error: orgsError } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (orgsError) throw orgsError;
      if (!orgs) return [];

      // Fetch owner emails
      const ownerIds = orgs.filter(o => o.owner_id).map(o => o.owner_id!);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", ownerIds.length > 0 ? ownerIds : ['00000000-0000-0000-0000-000000000000']);

      const emailMap = new Map(profiles?.map(p => [p.id, p.email]) ?? []);

      // Fetch generation counts per organization
      const { data: genCounts } = await supabase
        .from("generations")
        .select("organization_id");

      const countMap = new Map<string, number>();
      genCounts?.forEach(g => {
        if (g.organization_id) {
          countMap.set(g.organization_id, (countMap.get(g.organization_id) ?? 0) + 1);
        }
      });

      // Fetch last active dates
      const { data: lastActive } = await supabase
        .from("generations")
        .select("organization_id, created_at")
        .order("created_at", { ascending: false });

      const lastActiveMap = new Map<string, string>();
      lastActive?.forEach(g => {
        if (g.organization_id && !lastActiveMap.has(g.organization_id)) {
          lastActiveMap.set(g.organization_id, g.created_at);
        }
      });

      return orgs.map(org => ({
        ...org,
        owner_email: org.owner_id ? emailMap.get(org.owner_id) : null,
        generations_count: countMap.get(org.id) ?? 0,
        last_active: lastActiveMap.get(org.id) ?? null,
      }));
    },
    staleTime: 30000,
  });
}

export function useOrganization(id: string | null) {
  return useQuery({
    queryKey: ["admin-organization", id],
    queryFn: async (): Promise<Organization | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrganizationInput) => {
      // First, find or note the owner
      let ownerId: string | null = null;
      
      if (input.owner_email) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", input.owner_email)
          .maybeSingle();
        
        ownerId = profile?.id ?? null;
      }

      const { data, error } = await supabase
        .from("organizations")
        .insert({
          name: input.name,
          slug: input.slug,
          primary_color: input.primary_color || '#ff6b35',
          owner_id: ownerId,
        })
        .select()
        .single();

      if (error) throw error;

      // If owner exists, update their profile with org ID
      if (ownerId && data) {
        await supabase
          .from("profiles")
          .update({ organization_id: data.id })
          .eq("id", ownerId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateOrganizationInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] });
    },
  });
}

export function useOrganizationDetails(orgId: string | null) {
  return useQuery({
    queryKey: ["admin-organization-details", orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const [orgResult, photosResult, generationsResult] = await Promise.all([
        supabase.from("organizations").select("*").eq("id", orgId).single(),
        supabase.from("menu_photos").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(20),
        supabase.from("generations").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(10),
      ]);

      if (orgResult.error) throw orgResult.error;

      return {
        organization: orgResult.data,
        menuPhotos: photosResult.data ?? [],
        generations: generationsResult.data ?? [],
      };
    },
    enabled: !!orgId,
  });
}
