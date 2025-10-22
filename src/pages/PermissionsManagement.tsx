import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AppRole = "ผู้ใช้ทั่วไป" | "บัญชี" | "ผู้บริหาร" | "แอดมิน";

const ALL_ROLES: AppRole[] = ["ผู้ใช้ทั่วไป", "บัญชี", "ผู้บริหาร", "แอดมิน"];

interface MenuPermission {
  id: string;
  menu_name: string;
  menu_path: string;
  role: AppRole;
  can_access: boolean;
}

interface MenuRow {
  menu_name: string;
  menu_path: string;
  permissions: Record<AppRole, { id: string; can_access: boolean }>;
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

  // Transform permissions into menu rows with role columns
  const menuRows: MenuRow[] = Object.entries(
    permissions.reduce((acc, perm) => {
      if (!acc[perm.menu_path]) {
        acc[perm.menu_path] = {
          menu_name: perm.menu_name,
          menu_path: perm.menu_path,
          permissions: {} as Record<AppRole, { id: string; can_access: boolean }>,
        };
      }
      acc[perm.menu_path].permissions[perm.role] = {
        id: perm.id,
        can_access: perm.can_access,
      };
      return acc;
    }, {} as Record<string, MenuRow>)
  ).map(([_, row]) => row);

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

      <Card>
        <CardHeader>
          <CardTitle>สิทธิ์การเข้าถึงเมนู</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">เมนู</TableHead>
                {ALL_ROLES.map((role) => (
                  <TableHead key={role} className="text-center">
                    {role}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuRows.map((row) => (
                <TableRow key={row.menu_path}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{row.menu_name}</div>
                      <div className="text-sm text-muted-foreground">{row.menu_path}</div>
                    </div>
                  </TableCell>
                  {ALL_ROLES.map((role) => (
                    <TableCell key={role} className="text-center">
                      {row.permissions[role] ? (
                        <div className="flex justify-center">
                          <Switch
                            checked={row.permissions[role].can_access}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(row.permissions[role].id, checked)
                            }
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
