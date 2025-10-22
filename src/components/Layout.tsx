import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  BarChart3,
  Settings,
  Menu,
  X,
  Users,
  Shield,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const allNavigation = [
  { name: "แดชบอร์ด", href: "/", icon: LayoutDashboard },
  { name: "บันทึกรายรับ", href: "/income", icon: TrendingUp },
  { name: "บันทึกรายจ่าย", href: "/expense", icon: TrendingDown },
  { name: "รายการทั้งหมด", href: "/transactions", icon: FileText },
  { name: "รายงาน", href: "/reports", icon: BarChart3 },
  { name: "ตั้งค่า", href: "/settings", icon: Settings },
  { name: "จัดการผู้ใช้งาน", href: "/user-management", icon: Users },
  { name: "จัดการสิทธิ์เมนู", href: "/permissions", icon: Shield },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [allowedMenus, setAllowedMenus] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication and fetch permissions
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      
      // Check if user has any role
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (!userRoles || userRoles.length === 0) {
        // User has no role - redirect to pending approval
        navigate("/pending-approval");
        return;
      }

      await fetchUserPermissions(session.user.id);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        
        // Check if user has any role
        setTimeout(async () => {
          const { data: userRoles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);

          if (!userRoles || userRoles.length === 0) {
            navigate("/pending-approval");
            return;
          }
          
          await fetchUserPermissions(session.user.id);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserPermissions = async (userId: string) => {
    try {
      // Get user roles
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (!userRoles || userRoles.length === 0) {
        setAllowedMenus([]);
        return;
      }

      const roles = userRoles.map((ur) => ur.role);

      // Get menu permissions for user's roles
      const { data: permissions } = await supabase
        .from("menu_permissions")
        .select("menu_path")
        .in("role", roles)
        .eq("can_access", true);

      const paths = permissions?.map((p) => p.menu_path) || [];
      setAllowedMenus(paths);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const navigation = allNavigation.filter((item) => 
    allowedMenus.includes(item.href)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-card border border-border shadow-sm"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-7 h-7 text-primary-foreground" fill="none" viewBox="0 0 48 48">
                <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">โรงพยาบาลสันทราย</h1>
              <p className="text-sm text-muted-foreground">San Sai Hospital</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="pt-4 border-t border-sidebar-border space-y-2">
            <p className="text-xs text-muted-foreground px-2">
              {user?.email}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
