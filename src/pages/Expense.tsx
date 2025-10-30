import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { TrendingDown, Upload, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Expense() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: "",
    item: "",
    amount: "",
    description: "",
    reference: "",
  });
  const [files, setFiles] = useState<File[]>([]);

  // Fetch expense categories and items
  const { data: categories = [] } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["expense-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_items")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Filter items based on selected category
  const filteredItems = useMemo(() => {
    if (!formData.category || formData.category === "all") return items; // Show all items if no category or "all" selected
    return items.filter((item: any) => item.category_id === formData.category);
  }, [items, formData.category]);

  // Prepare combobox options - add "All Categories" as first option
  const categoryOptions: ComboboxOption[] = [
    { value: "all", label: "ทุกหมวดหมู่" },
    ...categories.map((cat: any) => ({
      value: cat.id,
      label: cat.name,
    }))
  ];

  const itemOptions: ComboboxOption[] = filteredItems.map((item: any) => ({
    value: item.id,
    label: item.name,
  }));

  // Handler for category change
  const handleCategoryChange = (categoryId: string) => {
    setFormData({ ...formData, category: categoryId, item: "" });
  };

  // Handler for item change
  const handleItemChange = (itemId: string) => {
    const selectedItem = items.find((item: any) => item.id === itemId);
    if (selectedItem && selectedItem.category_id) {
      // Auto-update category based on selected item
      setFormData({ ...formData, item: itemId, category: selectedItem.category_id });
    } else {
      setFormData({ ...formData, item: itemId });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insert transaction
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert([
          {
            type: "expense",
            date: formData.date,
            category_id: formData.category || null,
            item_id: formData.item || null,
            amount: parseFloat(formData.amount),
            description: formData.description,
            reference: formData.reference,
            created_by: user?.id || null,
          },
        ])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Upload files if any
      if (files.length > 0 && transaction) {
        for (const file of files) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${transaction.id}-${Date.now()}.${fileExt}`;
          const filePath = `${transaction.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("transaction-attachments")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Save attachment record
          const { error: attachmentError } = await supabase
            .from("transaction_attachments")
            .insert([
              {
                transaction_id: transaction.id,
                file_name: file.name,
                file_path: filePath,
                file_type: file.type,
                file_size: file.size,
              },
            ]);

          if (attachmentError) throw attachmentError;
        }
      }
    },
    onSuccess: () => {
      toast.success("บันทึกรายจ่ายสำเร็จ", {
        description: `จำนวน ${parseFloat(formData.amount).toLocaleString()}`,
      });
      // Reset form but keep the date
      setFormData({
        date: formData.date, // Keep the selected date
        category: "",
        item: "",
        amount: "",
        description: "",
        reference: "",
      });
      setFiles([]);
    },
    onError: (error) => {
      console.error("Error saving expense:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-expense/10">
          <TrendingDown className="h-6 w-6 text-expense" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">บันทึกรายจ่าย</h1>
          <p className="text-muted-foreground">เพิ่มรายการรายจ่ายใหม่</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลรายจ่าย</CardTitle>
          <CardDescription>กรอกข้อมูลรายจ่ายให้ครบถ้วน</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">วันที่ *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">หมวดหมู่</Label>
                <Combobox
                  options={categoryOptions}
                  value={formData.category}
                  onValueChange={handleCategoryChange}
                  placeholder="เลือกหมวดหมู่"
                  searchPlaceholder="ค้นหาหมวดหมู่..."
                  emptyText="ไม่พบหมวดหมู่"
                />
              </div>

              {/* Item */}
              <div className="space-y-2">
                <Label htmlFor="item">รายการรายจ่าย</Label>
                <Combobox
                  options={itemOptions}
                  value={formData.item}
                  onValueChange={handleItemChange}
                  placeholder="เลือกรายการ"
                  searchPlaceholder="ค้นหารายการ..."
                  emptyText="ไม่พบรายการ"
                  onSearchStart={() => {
                    // Auto-set category to "all" when user starts searching items
                    if (formData.category !== "all") {
                      setFormData({ ...formData, category: "all" });
                    }
                  }}
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">จำนวนเงิน (บาท) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              {/* Reference */}
              <div className="space-y-2">
                <Label htmlFor="reference">เลขที่อ้างอิง</Label>
                <Input
                  id="reference"
                  type="text"
                  placeholder="เช่น EXP-001"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">รายละเอียด</Label>
              <Textarea
                id="description"
                placeholder="กรอกรายละเอียดเพิ่มเติม..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="files">แนบไฟล์เอกสาร/รูปภาพ</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    id="files"
                    type="file"
                    onChange={handleFileChange}
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("files")?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    เลือกไฟล์
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {files.length > 0 ? `เลือกแล้ว ${files.length} ไฟล์` : "ยังไม่ได้เลือกไฟล์"}
                  </span>
                </div>
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded-lg bg-accent/50"
                      >
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    category: "",
                    item: "",
                    amount: "",
                    description: "",
                    reference: "",
                  });
                  setFiles([]);
                }}
              >
                ล้างข้อมูล
              </Button>
              <Button type="submit" className="bg-expense hover:bg-expense/90" disabled={saveMutation.isPending}>
                <TrendingDown className="mr-2 h-4 w-4" />
                {saveMutation.isPending ? "กำลังบันทึก..." : "บันทึกรายจ่าย"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
