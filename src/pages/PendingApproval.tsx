import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PendingApproval() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user now has a role (admin approved)
    const checkRoleAssigned = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (userRoles && userRoles.length > 0) {
        // User now has a role, redirect to dashboard
        navigate("/");
      }
    };

    checkRoleAssigned();

    // Check every 5 seconds if role was assigned
    const interval = setInterval(checkRoleAssigned, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "ออกจากระบบแล้ว",
    });
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
              <Clock className="w-10 h-10 text-warning" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">รอการอนุมัติ</CardTitle>
          <CardDescription className="text-center">
            บัญชีของคุณรอการอนุมัติจากผู้ดูแลระบบ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              บัญชีของคุณได้ถูกสร้างเรียบร้อยแล้ว แต่ยังไม่สามารถเข้าใช้งานได้
              จนกว่าผู้ดูแลระบบจะอนุมัติและกำหนดสิทธิ์การใช้งานให้
            </p>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>กรุณาติดต่อผู้ดูแลระบบเพื่อขออนุมัติการใช้งาน</p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            ออกจากระบบ
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
