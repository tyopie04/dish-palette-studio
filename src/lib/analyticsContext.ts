import { supabase } from "@/integrations/supabase/client";

export interface AnalyticsContext {
  totalPhotos: number;
  totalGenerations: number;
  recentGenerations: { prompt: string; created_at: string }[];
  photosByCategory: Record<string, number>;
  generationsThisWeek: number;
  generationsLastWeek: number;
}

export async function fetchAnalyticsContext(): Promise<AnalyticsContext> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Fetch menu photos count and categories
  const { data: photos } = await supabase
    .from("menu_photos")
    .select("id, category");

  // Fetch generations
  const { data: generations } = await supabase
    .from("generations")
    .select("id, prompt, created_at")
    .order("created_at", { ascending: false });

  // Calculate photo categories
  const photosByCategory: Record<string, number> = {};
  (photos || []).forEach((p) => {
    photosByCategory[p.category] = (photosByCategory[p.category] || 0) + 1;
  });

  // Calculate generations this week vs last week
  const generationsThisWeek = (generations || []).filter(
    (g) => new Date(g.created_at) >= oneWeekAgo
  ).length;

  const generationsLastWeek = (generations || []).filter(
    (g) => new Date(g.created_at) >= twoWeeksAgo && new Date(g.created_at) < oneWeekAgo
  ).length;

  // Get recent generations (last 5)
  const recentGenerations = (generations || []).slice(0, 5).map((g) => ({
    prompt: g.prompt || "No prompt",
    created_at: g.created_at,
  }));

  return {
    totalPhotos: photos?.length || 0,
    totalGenerations: generations?.length || 0,
    recentGenerations,
    photosByCategory,
    generationsThisWeek,
    generationsLastWeek,
  };
}

export function formatAnalyticsForAI(analytics: AnalyticsContext): string {
  const weekChange = analytics.generationsLastWeek > 0
    ? ((analytics.generationsThisWeek - analytics.generationsLastWeek) / analytics.generationsLastWeek * 100).toFixed(0)
    : "N/A";

  const categoryList = Object.entries(analytics.photosByCategory)
    .map(([cat, count]) => `${cat}: ${count}`)
    .join(", ");

  const recentList = analytics.recentGenerations
    .map((g) => `- "${g.prompt}" (${new Date(g.created_at).toLocaleDateString()})`)
    .join("\n");

  return `
CURRENT ANALYTICS (Live Data):
- Total menu photos: ${analytics.totalPhotos}
- Total AI generations: ${analytics.totalGenerations}
- Generations this week: ${analytics.generationsThisWeek}
- Generations last week: ${analytics.generationsLastWeek}
- Week-over-week change: ${weekChange}%
- Photos by category: ${categoryList || "None"}

Recent AI generations:
${recentList || "No recent generations"}
`.trim();
}
