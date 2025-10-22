import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AppRole = "ผู้ใช้ทั่วไป" | "บัญชี" | "ผู้บริหาร" | "แอดมิน";

interface MenuPermission {
  id: string;
  menu_name: string;
  menu_path: string;
  role: AppRole;
  can_access: boolean;
}

export default function PermissionsManagement() {
  const [permissions, setPermissions] = useState<MenuPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_permissions")
        .select("*")
        .order("menu_path", { ascending: true })
        .order("role", { ascending: true });

      if (error) throw error;
      setPermissions(data || []);
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (id: string, canAccess: boolean) => {
    try {
      const { error } = await supabase
        .from("menu_permissions")
        .update({ can_access: canAccess })
        .eq("id", id);

      if (error) throw error;

      setPermissions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, can_access: canAccess } : p))
      );

      toast({
        title: "อัพเดทสำเร็จ",
        description: "เปลี่ยนสิทธิ์การเข้าถึงเรียบร้อยแล้ว",
      });
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.menu_path]) {
      acc[perm.menu_path] = {
        menu_name: perm.menu_name,
        permissions: [],
      };
    }
    acc[perm.menu_path].permissions.push(perm);
    return acc;
  }, {} as Record<string, { menu_name: string; permissions: MenuPermission[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">จัดการสิทธิ์เมนู</h1>
        <p className="text-muted-foreground">กำหนดสิทธิ์การเข้าถึงเมนูต่างๆ สำหรับแต่ละ Role</p>
      </div>

      {Object.entries(groupedPermissions).map(([path, data]) => (
        <Card key={path}>
          <CardHeader>
            <CardTitle>{data.menu_name}</CardTitle>
            <p className="text-sm text-muted-foreground">{path}</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>สิทธิ์การใช้งาน (Role)</TableHead>
                  <TableHead className="text-right">สามารถเข้าถึง</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.permissions.map((perm) => (
                  <TableRow key={perm.id}>
                    <TableCell className="font-medium">{perm.role}</TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={perm.can_access}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(perm.id, checked)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
