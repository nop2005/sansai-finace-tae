import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown } from "lucide-react";
import IncomeForm from "@/components/forms/IncomeForm";
import ExpenseForm from "@/components/forms/ExpenseForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { formatThaiShortDate } from "@/utils/dateFormat";

export default function RecordTransaction() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTab, setCurrentTab] = useState("income");

  const { data: transactions = [], refetch } = useQuery({
    queryKey: ["today-transactions", format(selectedDate, "yyyy-MM-dd"), currentTab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          income_categories(name),
          expense_categories(name),
          income_items(name),
          expense_items(name),
          profiles!transactions_created_by_fkey(full_name)
        `)
        .eq("date", format(selectedDate, "yyyy-MM-dd"))
        .eq("type", currentTab)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getCategoryName = (transaction: any) => {
    if (transaction.type === "income") {
      return transaction.income_categories?.name || "-";
    }
    return transaction.expense_categories?.name || "-";
  };

  const getItemName = (transaction: any) => {
    if (transaction.type === "income") {
      return transaction.income_items?.name || "-";
    }
    return transaction.expense_items?.name || "-";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Tabs defaultValue="income" className="w-full" onValueChange={(value) => setCurrentTab(value)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="income" className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-income/10">
              <TrendingUp className="h-4 w-4 text-income" />
            </div>
            บันทึกรายรับ
          </TabsTrigger>
          <TabsTrigger value="expense" className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-expense/10">
              <TrendingDown className="h-4 w-4 text-expense" />
            </div>
            บันทึกรายจ่าย
          </TabsTrigger>
        </TabsList>
        <TabsContent value="income" className="space-y-6">
          <IncomeForm onDateChange={setSelectedDate} onSuccess={refetch} />
        </TabsContent>
        <TabsContent value="expense" className="space-y-6">
          <ExpenseForm onDateChange={setSelectedDate} onSuccess={refetch} />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>รายการที่บันทึกแล้ว - {formatThaiShortDate(selectedDate)}</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">ยังไม่มีรายการในวันนี้</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่บันทึก</TableHead>
                  <TableHead>รายการ</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead className="text-right">จำนวนเงิน</TableHead>
                  <TableHead>ผู้บันทึก</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction: any) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatThaiShortDate(new Date(transaction.created_at))}</TableCell>
                    <TableCell>{getItemName(transaction)}</TableCell>
                    <TableCell>{getCategoryName(transaction)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {parseFloat(transaction.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{transaction.profiles?.full_name || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
