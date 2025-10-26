import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings as SettingsIcon, Plus, Trash2, Edit, ChevronDown, ChevronRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = {
  id: string;
  name: string;
  description: string | null;
};

type Item = {
  id: string;
  name: string;
  category_id: string | null;
  description: string | null;
};

export default function Settings() {
  const queryClient = useQueryClient();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: string }>({
    open: false,
    type: "",
    id: "",
  });

  // Helper function to extract leading number from string
  const extractLeadingNumber = (str: string): number => {
    const match = str.match(/^(\d+)/);
    return match ? parseInt(match[1]) : Infinity;
  };

  // Fetch data with custom sorting
  const { data: expenseCategories = [] } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*");
      if (error) throw error;
      return (data as Category[]).sort((a, b) => extractLeadingNumber(a.name) - extractLeadingNumber(b.name));
    },
  });

  const { data: incomeCategories = [] } = useQuery({
    queryKey: ["income-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income_categories")
        .select("*");
      if (error) throw error;
      return (data as Category[]).sort((a, b) => extractLeadingNumber(a.name) - extractLeadingNumber(b.name));
    },
  });

  const { data: expenseItems = [] } = useQuery({
    queryKey: ["expense-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_items")
        .select("*");
      if (error) throw error;
      return (data as Item[]).sort((a, b) => extractLeadingNumber(a.name) - extractLeadingNumber(b.name));
    },
  });

  const { data: incomeItems = [] } = useQuery({
    queryKey: ["income-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income_items")
        .select("*");
      if (error) throw error;
      return (data as Item[]).sort((a, b) => extractLeadingNumber(a.name) - extractLeadingNumber(b.name));
    },
  });

  // Delete mutations
  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      const table =
        type === "expense-category"
          ? "expense_categories"
          : type === "income-category"
          ? "income_categories"
          : type === "expense-item"
          ? "expense_items"
          : "income_items";

      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      const queryKey =
        variables.type === "expense-category"
          ? "expense-categories"
          : variables.type === "income-category"
          ? "income-categories"
          : variables.type === "expense-item"
          ? "expense-items"
          : "income-items";

      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("ลบข้อมูลสำเร็จ");
    },
    onError: () => {
      toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
    },
  });

  const handleDelete = (type: string, id: string) => {
    setDeleteDialog({ open: true, type, id });
  };

  const confirmDelete = () => {
    deleteMutation.mutate({ type: deleteDialog.type, id: deleteDialog.id });
    setDeleteDialog({ open: false, type: "", id: "" });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-primary/10">
          <SettingsIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">ตั้งค่า</h1>
          <p className="text-muted-foreground">จัดการหมวดหมู่และรายการ</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expense-categories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="expense-categories">หมวดหมู่รายจ่าย</TabsTrigger>
          <TabsTrigger value="income-categories">หมวดหมู่รายรับ</TabsTrigger>
          <TabsTrigger value="expense-items">รายการรายจ่าย</TabsTrigger>
          <TabsTrigger value="income-items">รายการรายรับ</TabsTrigger>
        </TabsList>

        {/* Expense Categories */}
        <TabsContent value="expense-categories">
          <div className="space-y-4">
            <CategoryForm type="expense" categories={expenseCategories} />
            <CategoryList
              categories={expenseCategories}
              onDelete={(id) => handleDelete("expense-category", id)}
            />
          </div>
        </TabsContent>

        {/* Income Categories */}
        <TabsContent value="income-categories">
          <div className="space-y-4">
            <CategoryForm type="income" categories={incomeCategories} />
            <CategoryList
              categories={incomeCategories}
              onDelete={(id) => handleDelete("income-category", id)}
            />
          </div>
        </TabsContent>

        {/* Expense Items */}
        <TabsContent value="expense-items">
          <div className="space-y-4">
            <ItemForm type="expense" categories={expenseCategories} items={expenseItems} />
            <ItemList
              items={expenseItems}
              categories={expenseCategories}
              onDelete={(id) => handleDelete("expense-item", id)}
            />
          </div>
        </TabsContent>

        {/* Income Items */}
        <TabsContent value="income-items">
          <div className="space-y-4">
            <ItemForm type="income" categories={incomeCategories} items={incomeItems} />
            <ItemList
              items={incomeItems}
              categories={incomeCategories}
              onDelete={(id) => handleDelete("income-item", id)}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Category Form Component
function CategoryForm({ type, categories }: { type: "expense" | "income"; categories: Category[] }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ name: "", description: "" });

  const addMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const table = type === "expense" ? "expense_categories" : "income_categories";
      const { error } = await supabase.from(table).insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${type}-categories`] });
      toast.success("เพิ่มหมวดหมู่สำเร็จ");
      setFormData({ name: "", description: "" });
    },
    onError: () => {
      toast.error("เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("กรุณากรอกชื่อหมวดหมู่");
      return;
    }
    addMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>เพิ่มหมวดหมู่ใหม่</CardTitle>
        <CardDescription>กรอกข้อมูลหมวดหมู่{type === "expense" ? "รายจ่าย" : "รายรับ"}ใหม่</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อหมวดหมู่ *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="ระบุชื่อหมวดหมู่"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">รายละเอียด</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
              rows={3}
            />
          </div>
          <Button type="submit" disabled={addMutation.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มหมวดหมู่
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Category List Component
function CategoryList({ categories, onDelete }: { categories: Category[]; onDelete: (id: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>รายการหมวดหมู่</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">ยังไม่มีข้อมูล</p>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{category.name}</p>
                  {category.description && (
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => onDelete(category.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Item Form Component
function ItemForm({
  type,
  categories,
  items,
}: {
  type: "expense" | "income";
  categories: Category[];
  items: Item[];
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ name: "", category_id: "", description: "" });

  const addMutation = useMutation({
    mutationFn: async (data: { name: string; category_id: string | null; description: string }) => {
      const table = type === "expense" ? "expense_items" : "income_items";
      const { error } = await supabase.from(table).insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${type}-items`] });
      toast.success("เพิ่มรายการสำเร็จ");
      setFormData({ name: "", category_id: "", description: "" });
    },
    onError: () => {
      toast.error("เกิดข้อผิดพลาดในการเพิ่มรายการ");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("กรุณากรอกชื่อรายการ");
      return;
    }
    addMutation.mutate({
      ...formData,
      category_id: formData.category_id || null,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>เพิ่มรายการใหม่</CardTitle>
        <CardDescription>กรอกข้อมูลรายการ{type === "expense" ? "รายจ่าย" : "รายรับ"}ใหม่</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">ชื่อรายการ *</Label>
            <Input
              id="item-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="ระบุชื่อรายการ"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">หมวดหมู่</Label>
            <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
              <SelectTrigger id="category">
                <SelectValue placeholder="เลือกหมวดหมู่ (ถ้ามี)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-description">รายละเอียด</Label>
            <Textarea
              id="item-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
              rows={3}
            />
          </div>
          <Button type="submit" disabled={addMutation.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มรายการ
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Item List Component
function ItemList({
  items,
  categories,
  onDelete,
}: {
  items: Item[];
  categories: Category[];
  onDelete: (id: string) => void;
}) {
  // Group items by category
  const groupedItems = categories.map((category) => ({
    category,
    items: items.filter((item) => item.category_id === category.id),
  }));

  // Items without category
  const uncategorizedItems = items.filter((item) => !item.category_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>รายการทั้งหมด</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">ยังไม่มีข้อมูล</p>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {groupedItems.map(({ category, items: categoryItems }) => {
              if (categoryItems.length === 0) return null;
              
              return (
                <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">{category.name}</span>
                      <span className="text-xs text-muted-foreground">({categoryItems.length} รายการ)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 pt-2 pb-2">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 pl-6 rounded-md hover:bg-accent/50 transition-colors group"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onDelete(item.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}

            {uncategorizedItems.length > 0 && (
              <AccordionItem value="uncategorized" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-muted-foreground">ไม่ระบุหมวดหมู่</span>
                    <span className="text-xs text-muted-foreground">({uncategorizedItems.length} รายการ)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pt-2 pb-2">
                    {uncategorizedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 pl-6 rounded-md hover:bg-accent/50 transition-colors group"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onDelete(item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
