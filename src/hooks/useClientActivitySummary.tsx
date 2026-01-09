import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientActivitySummary {
  clientId: string;
  clientName: string;
  clientEmail: string | null;
  organizationId: string | null;
  organizationName: string | null;
  generationsLast7Days: number;
  uploadsLast7Days: number;
  lastActive: string | null;
}

export function useClientActivitySummary() {
  return useQuery({
    queryKey: ["client-activity-summary"],
    queryFn: async (): Promise<ClientActivitySummary[]> => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch all profiles with their organizations
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, display_name, organization_id");

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) return [];

      const profileIds = profiles.map(p => p.id);
      const orgIds = [...new Set(profiles.map(p => p.organization_id).filter(Boolean))];

      // Fetch organizations
      const { data: organizations } = orgIds.length > 0
        ? await supabase.from("organizations").select("id, name").in("id", orgIds)
        : { data: [] };

      const orgMap = new Map<string, string>(
        organizations?.map(o => [o.id, o.name] as [string, string]) ?? []
      );

      // Fetch generations in last 7 days
      const { data: generations } = await supabase
        .from("generations")
        .select("user_id, created_at")
        .in("user_id", profileIds)
        .gte("created_at", sevenDaysAgo);

      // Fetch menu photos (uploads) in last 7 days
      const { data: menuPhotos } = await supabase
        .from("menu_photos")
        .select("user_id, created_at")
        .in("user_id", profileIds)
        .gte("created_at", sevenDaysAgo);

      // Fetch all activity to determine last active
      const { data: allGenerations } = await supabase
        .from("generations")
        .select("user_id, created_at")
        .in("user_id", profileIds)
        .order("created_at", { ascending: false });

      const { data: allPhotos } = await supabase
        .from("menu_photos")
        .select("user_id, created_at")
        .in("user_id", profileIds)
        .order("created_at", { ascending: false });

      // Build activity map
      const activityMap = new Map<string, {
        generations7d: number;
        uploads7d: number;
        lastActive: string | null;
      }>();

      // Initialize all profiles
      profileIds.forEach(id => {
        activityMap.set(id, { generations7d: 0, uploads7d: 0, lastActive: null });
      });

      // Count generations in last 7 days
      generations?.forEach(g => {
        const entry = activityMap.get(g.user_id);
        if (entry) entry.generations7d++;
      });

      // Count uploads in last 7 days
      menuPhotos?.forEach(p => {
        const entry = activityMap.get(p.user_id);
        if (entry) entry.uploads7d++;
      });

      // Determine last active date
      allGenerations?.forEach(g => {
        const entry = activityMap.get(g.user_id);
        if (entry && (!entry.lastActive || g.created_at > entry.lastActive)) {
          entry.lastActive = g.created_at;
        }
      });

      allPhotos?.forEach(p => {
        const entry = activityMap.get(p.user_id);
        if (entry && (!entry.lastActive || p.created_at > entry.lastActive)) {
          entry.lastActive = p.created_at;
        }
      });

      // Build result
      const result: ClientActivitySummary[] = profiles.map(profile => {
        const activity = activityMap.get(profile.id)!;
        return {
          clientId: profile.id,
          clientName: profile.display_name || profile.email || "Unknown",
          clientEmail: profile.email,
          organizationId: profile.organization_id,
          organizationName: profile.organization_id ? orgMap.get(profile.organization_id) ?? null : null,
          generationsLast7Days: activity.generations7d,
          uploadsLast7Days: activity.uploads7d,
          lastActive: activity.lastActive,
        };
      });

      // Sort by last active (most recent first), nulls last
      result.sort((a, b) => {
        if (!a.lastActive && !b.lastActive) return 0;
        if (!a.lastActive) return 1;
        if (!b.lastActive) return -1;
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      });

      return result;
    },
    staleTime: 30000, // Cache for 30 seconds
  });
}
