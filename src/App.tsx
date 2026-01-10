import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminClients from "./pages/admin/AdminClients";
import AdminTrash from "./pages/admin/AdminTrash";
import AdminStyles from "./pages/admin/AdminStyles";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminIntegrations from "./pages/admin/AdminIntegrations";
import Analytics from "./pages/Analytics";
import Chat from "./pages/Chat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/clients" element={
                <AdminProtectedRoute>
                  <AdminClients />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/trash" element={
                <AdminProtectedRoute>
                  <AdminTrash />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/styles" element={
                <AdminProtectedRoute>
                  <AdminStyles />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/integrations" element={
                <AdminProtectedRoute>
                  <AdminIntegrations />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <AdminProtectedRoute>
                  <AdminSettings />
                </AdminProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
