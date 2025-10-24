import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { th } from "date-fns/locale";

export default function MonthlyDetail() {
  const navigate = useNavigate();
  const { year, month } = useParams<{ year: string; month: string }>();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [incomeItems, setIncomeItems] = useState<any[]>([]);
  const [expenseItems, setExpenseItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", 
                      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const fetchData = async () => {
    if (!year || !month) return;

    setLoading(true);
    const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const startDate = startOfMonth(monthDate);
    const endDate = endOfMonth(monthDate);

    // Fetch transactions
    const { data: transactionsData } = await supabase
      .from("transactions")
      .select("*")
      .gte("date", format(startDate, "yyyy-MM-dd"))
      .lte("date", format(endDate, "yyyy-MM-dd"));

    // Fetch categories
    const { data: incomeCategoriesData } = await supabase.from("income_categories").select("*");
    const { data: expenseCategoriesData } = await supabase.from("expense_categories").select("*");
    const { data: incomeItemsData } = await supabase.from("income_items").select("*");
    const { data: expenseItemsData } = await supabase.from("expense_items").select("*");

    if (transactionsData) setTransactions(transactionsData);
    if (incomeCategoriesData) setIncomeCategories(incomeCategoriesData);
    if (expenseCategoriesData) setExpenseCategories(expenseCategoriesData);
    if (incomeItemsData) setIncomeItems(incomeItemsData);
    if (expenseItemsData) setExpenseItems(expenseItemsData);

    setLoading(false);
  };

  // Group income by category and item
  const incomeByCategory = incomeCategories.map(category => {
    const categoryTransactions = transactions.filter(
      t => t.type === "income" && t.category_id === category.id
    );
    
    const items = incomeItems
      .filter(item => item.category_id === category.id)
      .map(item => {
        const itemTransactions = categoryTransactions.filter(t => t.item_id === item.id);
        const total = itemTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        return { ...item, total };
      })
      .filter(item => item.total > 0); // Only show items with transactions

    // Handle transactions without item_id
    const noItemTransactions = categoryTransactions.filter(t => !t.item_id);
    const noItemTotal = noItemTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    if (noItemTotal > 0) {
      items.push({
        id: `no-item-${category.id}`,
        name: "ไม่ระบุรายการ",
        category_id: category.id,
        total: noItemTotal
      });
    }

    const categoryTotal = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    return {
      category,
      items,
      total: categoryTotal
    };
  }).filter(cat => cat.total > 0);

  // Group expenses by category and item
  const expenseByCategory = expenseCategories.map(category => {
    const categoryTransactions = transactions.filter(
      t => t.type === "expense" && t.category_id === category.id
    );
    
    const items = expenseItems
      .filter(item => item.category_id === category.id)
      .map(item => {
        const itemTransactions = categoryTransactions.filter(t => t.item_id === item.id);
        const total = itemTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        return { ...item, total };
      })
      .filter(item => item.total > 0); // Only show items with transactions

    // Handle transactions without item_id
    const noItemTransactions = categoryTransactions.filter(t => !t.item_id);
    const noItemTotal = noItemTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    if (noItemTotal > 0) {
      items.push({
        id: `no-item-${category.id}`,
        name: "ไม่ระบุรายการ",
        category_id: category.id,
        total: noItemTotal
      });
    }

    const categoryTotal = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    return {
      category,
      items,
      total: categoryTotal
    };
  }).filter(cat => cat.total > 0);

  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  const monthIndex = month ? parseInt(month) - 1 : 0;
  const monthName = monthNames[monthIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/reports")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              สรุปบัญชีประจำเดือน {monthName} {year}
            </h1>
            <p className="text-muted-foreground mt-1">รายละเอียดรายรับ-รายจ่ายแยกตามหมวดและรายการ</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">รายรับ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-income">฿{totalIncome.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">รายจ่าย</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-expense">฿{totalExpense.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">เงินคงเหลือ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
              ฿{balance.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-income">รายงานการรับเงิน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">หมวดรายรับ</th>
                  <th className="text-left py-3 px-4 font-medium">รายการรายรับ</th>
                  <th className="text-right py-3 px-4 font-medium">เดือน {monthName} {year}</th>
                </tr>
              </thead>
              <tbody>
                {incomeByCategory.map((categoryData, catIndex) => (
                  <>
                    {/* Category Header */}
                    <tr key={`cat-${catIndex}`} className="bg-accent/30 font-semibold">
                      <td className="py-3 px-4" colSpan={2}>
                        {catIndex + 1}. {categoryData.category.name}
                      </td>
                      <td className="text-right py-3 px-4"></td>
                    </tr>
                    {/* Items */}
                    {categoryData.items.map((item, itemIndex) => (
                      <tr key={`item-${item.id}`} className="border-b border-border hover:bg-accent/20">
                        <td className="py-2 px-4"></td>
                        <td className="py-2 px-4 pl-8">
                          {catIndex + 1}.{itemIndex + 1} {item.name}
                        </td>
                        <td className="text-right py-2 px-4 text-income font-medium">
                          {item.total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
                {/* Total Row */}
                <tr className="border-t-2 border-border bg-income/10 font-bold">
                  <td className="py-3 px-4" colSpan={2}>รวมรายรับทั้งหมด</td>
                  <td className="text-right py-3 px-4 text-income">
                    {totalIncome.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Expense Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-expense">รายงานการจ่ายเงิน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">หมวดรายจ่าย</th>
                  <th className="text-left py-3 px-4 font-medium">รายการรายจ่าย</th>
                  <th className="text-right py-3 px-4 font-medium">เดือน {monthName} {year}</th>
                </tr>
              </thead>
              <tbody>
                {expenseByCategory.map((categoryData, catIndex) => (
                  <>
                    {/* Category Header */}
                    <tr key={`cat-${catIndex}`} className="bg-accent/30 font-semibold">
                      <td className="py-3 px-4" colSpan={2}>
                        {catIndex + 1}. {categoryData.category.name}
                      </td>
                      <td className="text-right py-3 px-4"></td>
                    </tr>
                    {/* Items */}
                    {categoryData.items.map((item, itemIndex) => (
                      <tr key={`item-${item.id}`} className="border-b border-border hover:bg-accent/20">
                        <td className="py-2 px-4"></td>
                        <td className="py-2 px-4 pl-8">
                          {catIndex + 1}.{itemIndex + 1} {item.name}
                        </td>
                        <td className="text-right py-2 px-4 text-expense font-medium">
                          {item.total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
                {/* Total Row */}
                <tr className="border-t-2 border-border bg-expense/10 font-bold">
                  <td className="py-3 px-4" colSpan={2}>รวมรายจ่ายทั้งหมด</td>
                  <td className="text-right py-3 px-4 text-expense">
                    {totalExpense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>สรุป</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between py-2">
              <span className="font-medium">รายรับรวม:</span>
              <span className="text-income font-bold">฿{totalIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium">รายจ่ายรวม:</span>
              <span className="text-expense font-bold">฿{totalExpense.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-border">
              <span className="font-bold text-lg">เงินคงเหลือ:</span>
              <span className={`font-bold text-lg ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                ฿{balance.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
