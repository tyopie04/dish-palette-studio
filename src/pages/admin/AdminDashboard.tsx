import { Users, Sparkles, CalendarDays, Image } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatsCard } from "@/components/admin/StatsCard";
import { RecentActivityTable } from "@/components/admin/RecentActivityTable";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useRecentActivity } from "@/hooks/useRecentActivity";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of platform activity
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            value={stats?.totalClients ?? 0}
            label="Total Clients"
            icon={Users}
            loading={statsLoading}
          />
          <StatsCard
            value={stats?.totalGenerations ?? 0}
            label="Total Generations"
            icon={Sparkles}
            loading={statsLoading}
          />
          <StatsCard
            value={stats?.generationsThisMonth ?? 0}
            label="Generations This Month"
            icon={CalendarDays}
            loading={statsLoading}
          />
          <StatsCard
            value={stats?.totalMenuPhotos ?? 0}
            label="Total Menu Photos"
            icon={Image}
            loading={statsLoading}
          />
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
          <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
            <RecentActivityTable
              generations={recentActivity ?? []}
              loading={activityLoading}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
