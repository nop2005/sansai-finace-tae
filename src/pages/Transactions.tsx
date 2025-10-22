import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, Filter, CalendarIcon, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [transactions, setTransactions] = useState<any[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [incomeItems, setIncomeItems] = useState<any[]>([]);
  const [expenseItems, setExpenseItems] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
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

    if (transactionsData) setTransactions(transactionsData);
    if (incomeCategoriesData) setIncomeCategories(incomeCategoriesData);
    if (expenseCategoriesData) setExpenseCategories(expenseCategoriesData);
    if (incomeItemsData) setIncomeItems(incomeItemsData);
    if (expenseItemsData) setExpenseItems(expenseItemsData);
    if (attachmentsData) setAttachments(attachmentsData);

    setLoading(false);
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

  // Get categories based on selected type
  const availableCategories = filterType === "income" 
    ? incomeCategories 
    : filterType === "expense" 
    ? expenseCategories 
    : [...incomeCategories, ...expenseCategories];

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">รายการทั้งหมด</h1>
        <p className="text-muted-foreground mt-1">
          ประวัติรายรับรายจ่าย {format(startDate, "d MMM yyyy", { locale: th })} - {format(endDate, "d MMM yyyy", { locale: th })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">รายรับรวม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-income">
              ฿{totalIncome.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">รายจ่ายรวม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-expense">
              ฿{totalExpense.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">สุทธิ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ฿{(totalIncome - totalExpense).toLocaleString()}
            </div>
          </CardContent>
        </Card>
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
                    {startDate ? format(startDate, "d MMM yyyy", { locale: th }) : <span>วันที่เริ่มต้น</span>}
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
                    {endDate ? format(endDate, "d MMM yyyy", { locale: th }) : <span>วันที่สิ้นสุด</span>}
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

            {/* Type Filter Buttons */}
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

            {/* Search and Category Filter */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหารายการ, เลขที่อ้างอิง, หมวดหมู่..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
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
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>รายการทั้งหมด ({filteredTransactions.length} รายการ)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => {
                const categoryName = getCategoryName(transaction.category_id, transaction.type);
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
                          <Badge variant="outline" className="text-xs">
                            {categoryName}
                          </Badge>
                          {attachmentCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              {attachmentCount} ไฟล์
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                          <span>{format(new Date(transaction.date), "d MMM yyyy", { locale: th })}</span>
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

                    {/* Amount */}
                    <div className="text-right ml-4">
                      <p
                        className={`text-lg font-bold ${
                          transaction.type === "income"
                            ? "text-income"
                            : "text-expense"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}฿
                        {Number(transaction.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && filteredTransactions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>ไม่พบรายการที่ตรงกับการค้นหา</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
