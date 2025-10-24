import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import Expense from "./pages/Expense";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import MonthlyDetail from "./pages/MonthlyDetail";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import UserManagement from "./pages/UserManagement";
import PermissionsManagement from "./pages/PermissionsManagement";
import PendingApproval from "./pages/PendingApproval";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/income" element={<Layout><Income /></Layout>} />
          <Route path="/expense" element={<Layout><Expense /></Layout>} />
          <Route path="/transactions" element={<Layout><Transactions /></Layout>} />
          <Route path="/reports" element={<Layout><Reports /></Layout>} />
          <Route path="/monthly-detail/:year/:month" element={<Layout><MonthlyDetail /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="/user-management" element={<Layout><UserManagement /></Layout>} />
          <Route path="/permissions" element={<Layout><PermissionsManagement /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
