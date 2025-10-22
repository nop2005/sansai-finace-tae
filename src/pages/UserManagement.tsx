import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AppRole = "ผู้ใช้ทั่วไป" | "บัญชี" | "ผู้บริหาร" | "แอดมิน";

interface UserWithRole {
  id: string;
  username: string;
  full_name: string | null;
  roles: AppRole[];
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, full_name");

      if (profilesError) throw profilesError;

      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles.map((profile) => ({
        ...profile,
        roles: userRoles
          .filter((ur) => ur.user_id === profile.id)
          .map((ur) => ur.role as AppRole),
      }));

      setUsers(usersWithRoles);
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

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      // Delete existing roles
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      toast({
        title: "อัพเดทสำเร็จ",
        description: "เปลี่ยนสิทธิ์ผู้ใช้เรียบร้อยแล้ว",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
        <h1 className="text-3xl font-bold">จัดการผู้ใช้งาน</h1>
        <p className="text-muted-foreground">จัดการสิทธิ์การเข้าถึงของผู้ใช้งานในระบบ</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายชื่อผู้ใช้งาน</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อผู้ใช้</TableHead>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>สิทธิ์การใช้งาน</TableHead>
                <TableHead>จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.full_name || "-"}</TableCell>
                  <TableCell>
                    {user.roles.length > 0 ? user.roles.join(", ") : "ไม่มีสิทธิ์"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.roles[0] || "ผู้ใช้ทั่วไป"}
                      onValueChange={(value) => handleRoleChange(user.id, value as AppRole)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ผู้ใช้ทั่วไป">ผู้ใช้ทั่วไป</SelectItem>
                        <SelectItem value="บัญชี">บัญชี</SelectItem>
                        <SelectItem value="ผู้บริหาร">ผู้บริหาร</SelectItem>
                        <SelectItem value="แอดมิน">แอดมิน</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
