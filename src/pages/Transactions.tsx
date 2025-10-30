import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, Filter, CalendarIcon, FileText, CalendarDays, FolderTree, ChevronDown, ChevronRight, Edit, Eye, AlertCircle, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatThaiShortDate, formatThaiLongDate, formatThaiDateTime } from "@/utils/dateFormat";

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "category">("date");
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [transactions, setTransactions] = useState<any[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [incomeItems, setIncomeItems] = useState<any[]>([]);
  const [expenseItems, setExpenseItems] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [editForm, setEditForm] = useState({
    category_id: "",
    item_id: "",
    amount: "",
    date: new Date(),
    edit_reason: ""
  });
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData();
    fetchUserRoles();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch transactions
    const { data: transactionsData } = await supabase
      .from("transactions")
      .select("*")
      .gte("date", format(startDate, "yyyy-MM-dd"))
      .lte("date", format(endDate, "yyyy-MM-dd"))
      .order("date", { ascending: false });

    // Fetch categories
    const { data: incomeCategoriesData } = await supabase
      .from("income_categories")
      .select("*");

    const { data: expenseCategoriesData } = await supabase
      .from("expense_categories")
      .select("*");

    // Fetch items
    const { data: incomeItemsData } = await supabase
      .from("income_items")
      .select("*");

    const { data: expenseItemsData } = await supabase
      .from("expense_items")
      .select("*");

    // Fetch attachments
    const { data: attachmentsData } = await supabase
      .from("transaction_attachments")
      .select("*");

    // Fetch profiles for editor information
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*");

    if (transactionsData) setTransactions(transactionsData);
    if (incomeCategoriesData) setIncomeCategories(incomeCategoriesData);
    if (expenseCategoriesData) setExpenseCategories(expenseCategoriesData);
    if (incomeItemsData) setIncomeItems(incomeItemsData);
    if (expenseItemsData) setExpenseItems(expenseItemsData);
    if (attachmentsData) setAttachments(attachmentsData);
    if (profilesData) setProfiles(profilesData);

    setLoading(false);
  };

  const fetchUserRoles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesData) {
      setUserRoles(rolesData.map(r => r.role));
    }
  };

  const getCategoryName = (categoryId: string, type: string) => {
    if (type === "income") {
      const category = incomeCategories.find((c) => c.id === categoryId);
      return category ? category.name : "ไม่ระบุหมวดหมู่";
    } else {
      const category = expenseCategories.find((c) => c.id === categoryId);
      return category ? category.name : "ไม่ระบุหมวดหมู่";
    }
  };

  const getItemName = (itemId: string, type: string) => {
    if (type === "income") {
      const item = incomeItems.find((i) => i.id === itemId);
      return item ? item.name : "";
    } else {
      const item = expenseItems.find((i) => i.id === itemId);
      return item ? item.name : "";
    }
  };

  const getAttachmentCount = (transactionId: string) => {
    return attachments.filter((a) => a.transaction_id === transactionId).length;
  };

  const getEditorName = (userId: string) => {
    if (!userId) {
      console.log("No userId provided");
      return "ไม่ทราบชื่อ";
    }
    
    console.log("Looking for user:", userId);
    console.log("Available profiles:", profiles);
    
    const profile = profiles.find((p) => p.id === userId);
    console.log("Found profile:", profile);
    
    return profile ? (profile.full_name || profile.username) : "ไม่ทราบชื่อ";
  };

  const canDelete = !userRoles.includes("ผู้บริหาร");

  const handleEdit = (transaction: any) => {
    setSelectedTransaction(transaction);
    setEditForm({
      category_id: transaction.category_id || "",
      item_id: transaction.item_id || "",
      amount: transaction.amount.toString(),
      date: new Date(transaction.date),
      edit_reason: ""
    });
    setEditDialogOpen(true);
  };

  const handleViewDetails = (transaction: any) => {
    setSelectedTransaction(transaction);
    setDetailDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTransaction) return;

    if (!editForm.edit_reason.trim()) {
      toast.error("กรุณากรอกเหตุผลที่แก้ไข");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("ไม่พบข้อมูลผู้ใช้");
      return;
    }

    const { error } = await supabase
      .from("transactions")
      .update({
        category_id: editForm.category_id,
        item_id: editForm.item_id,
        amount: parseFloat(editForm.amount),
        date: format(editForm.date, "yyyy-MM-dd"),
        edited: true,
        edit_reason: editForm.edit_reason,
        edited_by: user.id,
        edited_at: new Date().toISOString()
      })
      .eq("id", selectedTransaction.id);

    if (error) {
      toast.error("เกิดข้อผิดพลาดในการแก้ไข");
      console.error(error);
      return;
    }

    toast.success("แก้ไขรายการสำเร็จ");
    setEditDialogOpen(false);
    fetchData();
  };

  const handleDelete = (transaction: any) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTransaction) return;

    // First, delete all attachments associated with this transaction
    const transactionAttachments = attachments.filter(a => a.transaction_id === selectedTransaction.id);
    
    // Delete files from storage
    for (const attachment of transactionAttachments) {
      const { error: storageError } = await supabase.storage
        .from("transaction-attachments")
        .remove([attachment.file_path]);
      
      if (storageError) {
        console.error("Error deleting file from storage:", storageError);
      }
    }

    // Delete attachment records from database
    const { error: attachmentError } = await supabase
      .from("transaction_attachments")
      .delete()
      .eq("transaction_id", selectedTransaction.id);

    if (attachmentError) {
      toast.error("เกิดข้อผิดพลาดในการลบไฟล์แนบ");
      console.error(attachmentError);
      return;
    }

    // Delete the transaction
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", selectedTransaction.id);

    if (error) {
      toast.error("เกิดข้อผิดพลาดในการลบรายการ");
      console.error(error);
      return;
    }

    toast.success("ลบรายการสำเร็จ");
    setDeleteDialogOpen(false);
    setSelectedTransaction(null);
    fetchData();
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const categoryName = getCategoryName(transaction.category_id, transaction.type);
    const itemName = getItemName(transaction.item_id, transaction.type);
    
    const matchesSearch = 
      (transaction.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (transaction.reference?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      filterType === "all" || transaction.type === filterType;

    const matchesCategory = 
      categoryFilter === "all" || transaction.category_id === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else {
      // Sort by category
      const categoryA = getCategoryName(a.category_id, a.type);
      const categoryB = getCategoryName(b.category_id, b.type);
      const comparison = categoryA.localeCompare(categoryB, 'th');
      if (comparison !== 0) return comparison;
      // If same category, sort by date
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  // Group by category when sorting by category
  interface CategoryGroup {
    categoryName: string;
    type: string;
    transactions: any[];
    total: number;
  }

  const groupedByCategory = sortBy === "category" 
    ? sortedTransactions.reduce((groups, transaction) => {
        const categoryName = getCategoryName(transaction.category_id, transaction.type);
        const key = `${transaction.type}-${categoryName}`;
        
        if (!groups[key]) {
          groups[key] = {
            categoryName,
            type: transaction.type,
            transactions: [],
            total: 0
          };
        }
        
        groups[key].transactions.push(transaction);
        groups[key].total += Number(transaction.amount);
        
        return groups;
      }, {} as Record<string, CategoryGroup>)
    : null;

  // Get categories based on selected type
  const availableCategories = filterType === "income" 
    ? incomeCategories 
    : filterType === "expense" 
    ? expenseCategories 
    : [...incomeCategories, ...expenseCategories];

  const totalIncome = sortedTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = sortedTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // คำนวณผลรวมของรายการที่กรองแล้ว
  const filteredTotal = sortedTransactions.reduce((sum, t) => {
    return t.type === "income" 
      ? sum + Number(t.amount) 
      : sum - Number(t.amount);
  }, 0);

  // Pagination logic
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, categoryFilter, sortBy, startDate, endDate]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Group transactions by date for the regular list view
  interface DateGroup {
    date: string;
    transactions: any[];
  }

  const groupedByDate = paginatedTransactions.reduce((groups, transaction) => {
    const dateKey = format(new Date(transaction.date), "yyyy-MM-dd");
    
    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateKey,
        transactions: []
      };
    }
    
    groups[dateKey].transactions.push(transaction);
    
    return groups;
  }, {} as Record<string, DateGroup>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">รายการทั้งหมด</h1>
        <p className="text-muted-foreground mt-1">
          ประวัติรายรับรายจ่าย {formatThaiShortDate(startDate)} - {formatThaiShortDate(endDate)}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Date Range */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[200px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? formatThaiShortDate(startDate) : <span>วันที่เริ่มต้น</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[200px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? formatThaiShortDate(endDate) : <span>วันที่สิ้นสุด</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Type Filter Buttons and Category Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex gap-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  onClick={() => {
                    setFilterType("all");
                    setCategoryFilter("all");
                  }}
                  className="flex-1 sm:flex-initial"
                >
                  ทั้งหมด
                </Button>
                <Button
                  variant={filterType === "income" ? "default" : "outline"}
                  onClick={() => {
                    setFilterType("income");
                    setCategoryFilter("all");
                  }}
                  className="flex-1 sm:flex-initial"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  รายรับ
                </Button>
                <Button
                  variant={filterType === "expense" ? "default" : "outline"}
                  onClick={() => {
                    setFilterType("expense");
                    setCategoryFilter("all");
                  }}
                  className="flex-1 sm:flex-initial"
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  รายจ่าย
                </Button>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-3 w-full sm:w-auto ml-0 sm:ml-4">
                <span className="text-sm font-medium whitespace-nowrap">หมวดหมู่</span>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {filterType === "all" ? (
                      <>
                        {incomeCategories.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-sm font-semibold text-income">
                              รายรับ
                            </div>
                            {incomeCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {expenseCategories.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-sm font-semibold text-expense mt-2">
                              รายจ่าย
                            </div>
                            {expenseCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </>
                    ) : (
                      availableCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหารายการ, เลขที่อ้างอิง, หมวดหมู่..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">รายรับรวม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-income">
              {totalIncome.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">รายจ่ายรวม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-expense">
              {totalExpense.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">สุทธิ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {(totalIncome - totalExpense).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <CardTitle>รายการทั้งหมด ({sortedTransactions.length} รายการ)</CardTitle>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={sortBy === "date" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("date")}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                เรียงตามวันที่
              </Button>
              <Button
                variant={sortBy === "category" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("category")}
              >
                <FolderTree className="h-4 w-4 mr-2" />
                เรียงตามหมวด
              </Button>
            </div>

            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">ผลรวม</p>
              <p className={`text-2xl font-bold ${
                filteredTotal >= 0 ? "text-income" : "text-expense"
              }`}>
                {filteredTotal >= 0 ? "+" : ""}{Math.abs(filteredTotal).toLocaleString()}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortBy === "category" && groupedByCategory ? (
                // Grouped by category view
                (Object.values(groupedByCategory) as CategoryGroup[]).map((group) => (
                  <div key={`${group.type}-${group.categoryName}`} className="space-y-2">
                    {/* Category Header */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${
                          group.type === "income" ? "bg-income/10" : "bg-expense/10"
                        }`}>
                          <FolderTree className={`h-4 w-4 ${
                            group.type === "income" ? "text-income" : "text-expense"
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold">{group.categoryName}</p>
                          <p className="text-sm text-muted-foreground">
                            {group.transactions.length} รายการ
                          </p>
                        </div>
                      </div>
                      <p className={`text-lg font-bold ${
                        group.type === "income" ? "text-income" : "text-expense"
                      }`}>
                        {group.type === "income" ? "+" : "-"}{group.total.toLocaleString()}
                      </p>
                    </div>

                    {/* Transactions in category */}
                    <div className="ml-6 space-y-2">
                      {group.transactions.map((transaction) => {
                        const itemName = getItemName(transaction.item_id, transaction.type);
                        const attachmentCount = getAttachmentCount(transaction.id);

                        return (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              {/* Icon */}
                              <div
                                className={`p-2 rounded-lg ${
                                  transaction.type === "income"
                                    ? "bg-income/10"
                                    : "bg-expense/10"
                                }`}
                              >
                                {transaction.type === "income" ? (
                                  <TrendingUp className="h-5 w-5 text-income" />
                                ) : (
                                  <TrendingDown className="h-5 w-5 text-expense" />
                                )}
                              </div>

                              {/* Details */}
                               <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 mb-1 flex-wrap">
                                   <p className="font-medium">{itemName || transaction.description || "ไม่ระบุ"}</p>
                                   {transaction.edited && (
                                     <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
                                       <AlertCircle className="h-3 w-3 mr-1" />
                                       แก้ไขแล้ว
                                     </Badge>
                                   )}
                                   {attachmentCount > 0 && (
                                     <Badge variant="secondary" className="text-xs">
                                       <FileText className="h-3 w-3 mr-1" />
                                       {attachmentCount} ไฟล์
                                     </Badge>
                                   )}
                                 </div>
                                 <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                                   <span>{formatThaiShortDate(new Date(transaction.date))}</span>
                                  {transaction.reference && (
                                    <>
                                      <span>•</span>
                                      <span>{transaction.reference}</span>
                                    </>
                                  )}
                                  {transaction.description && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-[200px]">{transaction.description}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                             {/* Amount and Actions */}
                             <div className="flex items-center gap-2 ml-4">
                               <div className="text-right">
                                 <p
                                   className={`text-lg font-bold ${
                                     transaction.type === "income"
                                       ? "text-income"
                                       : "text-expense"
                                   }`}
                                 >
                                   {transaction.type === "income" ? "+" : "-"}
                                    {Number(transaction.amount).toLocaleString()}
                                 </p>
                               </div>
                                 <div className="flex gap-1">
                                   <Button
                                     size="sm"
                                     variant="ghost"
                                     onClick={() => handleViewDetails(transaction)}
                                   >
                                     <Eye className="h-4 w-4" />
                                   </Button>
                                   <Button
                                     size="sm"
                                     variant="ghost"
                                     onClick={() => handleEdit(transaction)}
                                   >
                                     <Edit className="h-4 w-4" />
                                   </Button>
                                   {canDelete && (
                                     <Button
                                       size="sm"
                                       variant="ghost"
                                       onClick={() => handleDelete(transaction)}
                                     >
                                       <Trash2 className="h-4 w-4 text-destructive" />
                                     </Button>
                                   )}
                                 </div>
                             </div>
                           </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                // Regular list view (sorted by date) grouped by date
                (Object.values(groupedByDate) as DateGroup[]).map((dateGroup) => (
                  <div key={dateGroup.date} className="rounded-lg border border-border overflow-hidden">
                    {/* Date Header */}
                    <div className="bg-muted/30 px-4 py-2 border-b border-border">
                      <div className="text-sm text-muted-foreground font-medium">
                        {formatThaiShortDate(new Date(dateGroup.date))}
                      </div>
                    </div>

                    {/* Transactions for this date */}
                    <div className="divide-y divide-border">
                      {dateGroup.transactions.map((transaction) => {
                        const categoryName = getCategoryName(transaction.category_id, transaction.type);
                        const itemName = getItemName(transaction.item_id, transaction.type);
                        const attachmentCount = getAttachmentCount(transaction.id);

                        return (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              {/* Icon */}
                              <div
                                className={`p-2 rounded-lg ${
                                  transaction.type === "income"
                                    ? "bg-income/10"
                                    : "bg-expense/10"
                                }`}
                              >
                                {transaction.type === "income" ? (
                                  <TrendingUp className="h-5 w-5 text-income" />
                                ) : (
                                  <TrendingDown className="h-5 w-5 text-expense" />
                                )}
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <p className="font-medium">{itemName || transaction.description || "ไม่ระบุ"}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {categoryName}
                                  </Badge>
                                  {transaction.edited && (
                                    <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      แก้ไขแล้ว
                                    </Badge>
                                  )}
                                  {attachmentCount > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      <FileText className="h-3 w-3 mr-1" />
                                      {attachmentCount} ไฟล์
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                                  {transaction.reference && (
                                    <span>{transaction.reference}</span>
                                  )}
                                  {transaction.description && (
                                    <>
                                      {transaction.reference && <span>•</span>}
                                      <span className="truncate max-w-[200px]">{transaction.description}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Amount and Actions */}
                            <div className="flex items-center gap-2 ml-4">
                              <div className="text-right">
                                <p
                                  className={`text-lg font-bold ${
                                    transaction.type === "income"
                                      ? "text-income"
                                      : "text-expense"
                                  }`}
                                >
                                  {transaction.type === "income" ? "+" : "-"}
                                  {Number(transaction.amount).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewDetails(transaction)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(transaction)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {canDelete && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete(transaction)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {!loading && sortedTransactions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>ไม่พบรายการที่ตรงกับการค้นหา</p>
            </div>
          )}

          {/* Pagination */}
          {!loading && sortedTransactions.length > 0 && totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {getPageNumbers().map((page, index) => (
                    page === 'ellipsis' ? (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page as number)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขรายการ</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลรายการและระบุเหตุผล
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>หมวด</Label>
              <Select 
                value={editForm.category_id} 
                onValueChange={(value) => setEditForm({...editForm, category_id: value, item_id: ""})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {selectedTransaction?.type === "income" 
                    ? incomeCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    : expenseCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>รายการ</Label>
              <Select 
                value={editForm.item_id} 
                onValueChange={(value) => setEditForm({...editForm, item_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกรายการ" />
                </SelectTrigger>
                <SelectContent>
                  {selectedTransaction?.type === "income" 
                    ? incomeItems
                        .filter(item => !editForm.category_id || item.category_id === editForm.category_id)
                        .map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))
                    : expenseItems
                        .filter(item => !editForm.category_id || item.category_id === editForm.category_id)
                        .map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>จำนวนเงิน</Label>
              <Input
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>วันที่</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatThaiShortDate(editForm.date)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editForm.date}
                    onSelect={(date) => date && setEditForm({...editForm, date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>เหตุผลที่แก้ไข *</Label>
              <Textarea
                value={editForm.edit_reason}
                onChange={(e) => setEditForm({...editForm, edit_reason: e.target.value})}
                placeholder="ระบุเหตุผลที่แก้ไขรายการนี้..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveEdit}>
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>รายละเอียดรายการ</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ประเภท</p>
                  <p className="font-medium">
                    {selectedTransaction.type === "income" ? "รายรับ" : "รายจ่าย"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">จำนวนเงิน</p>
                  <p className={`font-bold ${
                    selectedTransaction.type === "income" ? "text-income" : "text-expense"
                  }`}>
                    ฿{Number(selectedTransaction.amount).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">รายการ</p>
                <p className="font-medium">
                  {getItemName(selectedTransaction.item_id, selectedTransaction.type)}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">หมวดหมู่</p>
                <p className="font-medium">
                  {getCategoryName(selectedTransaction.category_id, selectedTransaction.type)}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">วันที่</p>
                <p className="font-medium">
                  {formatThaiLongDate(new Date(selectedTransaction.date))}
                </p>
              </div>

              {selectedTransaction.description && (
                <div>
                  <p className="text-sm text-muted-foreground">คำอธิบาย</p>
                  <p className="font-medium">{selectedTransaction.description}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="font-semibold mb-3">ข้อมูลการบันทึก</p>
                <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">ผู้บันทึก</p>
                    <p className="font-medium">
                      {selectedTransaction.created_by 
                        ? getEditorName(selectedTransaction.created_by)
                        : "ไม่ทราบชื่อ"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">วันที่บันทึก</p>
                    <p className="font-medium">
                      {formatThaiDateTime(new Date(selectedTransaction.created_at))}
                    </p>
                  </div>
                </div>
              </div>

              {selectedTransaction.edited && (
                <>
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <p className="font-semibold text-orange-500">ประวัติการแก้ไข</p>
                    </div>
                    
                    <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">ผู้แก้ไข</p>
                        <p className="font-medium">
                          {selectedTransaction.edited_by 
                            ? getEditorName(selectedTransaction.edited_by)
                            : "ไม่ทราบชื่อ"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">วันที่แก้ไข</p>
                        <p className="font-medium">
                          {formatThaiDateTime(new Date(selectedTransaction.edited_at))}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">เหตุผล</p>
                        <p className="font-medium">{selectedTransaction.edit_reason}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDetailDialogOpen(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบรายการ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้ และไฟล์แนบทั้งหมดจะถูกลบด้วย
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedTransaction && (
            <div className="my-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">
                {getItemName(selectedTransaction.item_id, selectedTransaction.type) || selectedTransaction.description || "ไม่ระบุ"}
              </p>
              <p className={`text-lg font-bold ${
                selectedTransaction.type === "income" ? "text-income" : "text-expense"
              }`}>
                {selectedTransaction.type === "income" ? "+" : "-"}฿{Number(selectedTransaction.amount).toLocaleString()}
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              ลบรายการ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
