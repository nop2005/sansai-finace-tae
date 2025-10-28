import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Activity, CalendarIcon } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, getDaysInMonth, eachDayOfInterval } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
type ViewMode = "daily" | "monthly" | "yearly";
export default function Dashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [transactions, setTransactions] = useState<any[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);
  const fetchData = async () => {
    setLoading(true);

    // Fetch transactions
    const {
      data: transactionsData,
      error: transactionsError
    } = await supabase.from("transactions").select("*").gte("date", format(startDate, "yyyy-MM-dd")).lte("date", format(endDate, "yyyy-MM-dd"));

    // Fetch income categories
    const {
      data: incomeCategoriesData
    } = await supabase.from("income_categories").select("*");

    // Fetch expense categories
    const {
      data: expenseCategoriesData
    } = await supabase.from("expense_categories").select("*");
    if (!transactionsError && transactionsData) {
      setTransactions(transactionsData);
    }
    if (incomeCategoriesData) {
      setIncomeCategories(incomeCategoriesData);
    }
    if (expenseCategoriesData) {
      setExpenseCategories(expenseCategoriesData);
    }
    setLoading(false);
  };
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    const now = new Date();
    if (mode === "monthly") {
      setStartDate(startOfMonth(now));
      setEndDate(endOfMonth(now));
    } else if (mode === "yearly") {
      setStartDate(startOfYear(now));
      setEndDate(endOfYear(now));
    }
  };
  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
  const netBalance = totalIncome - totalExpense;
  const totalTransactions = transactions.length;
  const summaryData = [{
    title: "รายรับทั้งหมด",
    value: `${totalIncome.toLocaleString()}`,
    change: "+0%",
    icon: TrendingUp,
    color: "text-income"
  }, {
    title: "รายจ่ายทั้งหมด",
    value: `${totalExpense.toLocaleString()}`,
    change: "+0%",
    icon: TrendingDown,
    color: "text-expense"
  }, {
    title: "คงเหลือสุทธิ",
    value: `${netBalance.toLocaleString()}`,
    change: "+0%",
    icon: Wallet,
    color: "text-primary"
  }, {
    title: "รายการทั้งหมด",
    value: totalTransactions.toString(),
    change: "+0",
    icon: Activity,
    color: "text-foreground"
  }];

  // Group by category for pie charts
  const incomeByCategory = transactions.filter(t => t.type === "income").reduce((acc, t) => {
    const categoryId = t.category_id;
    const category = incomeCategories.find(c => c.id === categoryId);
    const categoryName = category ? category.name : "ไม่ระบุหมวดหมู่";
    acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
    return acc;
  }, {} as Record<string, number>);
  const expenseByCategory = transactions.filter(t => t.type === "expense").reduce((acc, t) => {
    const categoryId = t.category_id;
    const category = expenseCategories.find(c => c.id === categoryId);
    const categoryName = category ? category.name : "ไม่ระบุหมวดหมู่";
    acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
    return acc;
  }, {} as Record<string, number>);
  const colors = ["#4A90E2", "#7ED321", "#50E3C2", "#F5A623", "#D0021B", "#BD10E0", "#7B8794"];
  const categoryData = Object.entries(incomeByCategory).map(([name, value], index) => ({
    name: name,
    value,
    color: colors[index % colors.length]
  }));
  const expenseCategoryData = Object.entries(expenseByCategory).map(([name, value], index) => ({
    name: name,
    value,
    color: colors[index % colors.length]
  }));

  // Generate monthly data for current year
  const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const currentYear = new Date().getFullYear();
  const monthlyData = monthNames.map((monthName, index) => {
    const month = index + 1;
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === currentYear && transactionDate.getMonth() === index;
    });
    const income = monthTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = monthTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
    return {
      month: monthName,
      income,
      expense
    };
  });

  // Calculate cumulative data
  const cumulativeData = monthlyData.map((item, index) => {
    const cumulativeIncome = monthlyData.slice(0, index + 1).reduce((sum, m) => sum + m.income, 0);
    const cumulativeExpense = monthlyData.slice(0, index + 1).reduce((sum, m) => sum + m.expense, 0);
    return {
      month: item.month,
      income: cumulativeIncome,
      expense: cumulativeExpense
    };
  });

  // Generate daily data based on date range
  const dailyData = eachDayOfInterval({
    start: startDate,
    end: endDate
  }).map(date => {
    const dayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return format(transactionDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
    });
    const income = dayTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = dayTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
    return {
      day: format(date, "d"),
      fullDate: format(date, "yyyy-MM-dd"),
      income,
      expense
    };
  });
  return <div className="space-y-6">
      {/* Header with Date Range Picker */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">แดชบอร์ด</h1>
          <p className="text-muted-foreground mt-1">
            ภาพรวมรายรับรายจ่าย {format(startDate, "d MMMM yyyy", {
            locale: th
          })} - {format(endDate, "d MMMM yyyy", {
            locale: th
          })}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* View Mode Selector */}
          <Select value={viewMode} onValueChange={value => handleViewModeChange(value as ViewMode)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="เลือกช่วงเวลา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">รายวัน</SelectItem>
              <SelectItem value="monthly">รายเดือน</SelectItem>
              <SelectItem value="yearly">รายปี</SelectItem>
            </SelectContent>
          </Select>

          {/* Start Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "d MMM yyyy", {
                locale: th
              }) : <span>วันที่เริ่มต้น</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={date => date && setStartDate(date)} initialFocus />
            </PopoverContent>
          </Popover>

          {/* End Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "d MMM yyyy", {
                locale: th
              }) : <span>วันที่สิ้นสุด</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={endDate} onSelect={date => date && setEndDate(date)} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {summaryData.map(item => <Card key={item.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className={item.change.startsWith("+") ? "text-income" : "text-expense"}>
                  {item.change}
                </span>{" "}
                จากช่วงก่อนหน้า
              </p>
            </CardContent>
          </Card>)}
      </div>

      {/* Daily Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>แนวโน้มรายรับ-รายจ่ายรายวัน</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" className="text-xs" label={{
              value: 'วันที่',
              position: 'insideBottom',
              offset: -5
            }} />
              <YAxis className="text-xs" />
              <Tooltip contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px"
            }} labelFormatter={(value, payload) => {
              if (payload && payload.length > 0) {
                return `วันที่ ${payload[0].payload.fullDate}`;
              }
              return `วันที่ ${value}`;
            }} formatter={(value: number) => value.toLocaleString('th-TH', { maximumFractionDigits: 0 })} />
              <Legend />
              <Bar dataKey="income" name="รายรับ" fill="hsl(var(--income))" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" name="รายจ่าย" fill="hsl(var(--expense))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>แนวโน้มรายรับ-รายจ่ายรายเดือน</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }} formatter={(value: number) => value.toLocaleString('th-TH', { maximumFractionDigits: 0 })} />
                <Legend />
                <Bar dataKey="income" name="รายรับ" fill="hsl(var(--income))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" name="รายจ่าย" fill="hsl(var(--expense))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cumulative Trend */}
        <Card>
          <CardHeader>
            <CardTitle>กระแสเงินสดสะสม</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }} formatter={(value: number) => value.toLocaleString('th-TH', { maximumFractionDigits: 0 })} />
                <Legend />
                <Line type="monotone" dataKey="income" name="รายรับสะสม" stroke="hsl(var(--income))" strokeWidth={3} dot={{
                fill: "hsl(var(--income))",
                r: 5
              }} />
                <Line type="monotone" dataKey="expense" name="รายจ่ายสะสม" stroke="hsl(var(--expense))" strokeWidth={3} dot={{
                fill: "hsl(var(--expense))",
                r: 5
              }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Income Categories */}
        <Card>
          <CardHeader>
            <CardTitle>หมวดหมู่รายรับ</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} label={({
                name,
                percent
              }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }} formatter={(value: number) => value.toLocaleString('th-TH', { maximumFractionDigits: 0 })} />
                </PieChart>
              </ResponsiveContainer> : <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                ไม่มีข้อมูลรายรับ
              </div>}
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>หมวดหมู่รายจ่าย</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseCategoryData.length > 0 ? <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={expenseCategoryData} cx="50%" cy="50%" labelLine={false} label={({
                name,
                percent
              }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                    {expenseCategoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }} formatter={(value: number) => value.toLocaleString('th-TH', { maximumFractionDigits: 0 })} />
                </PieChart>
              </ResponsiveContainer> : <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                ไม่มีข้อมูลรายจ่าย
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
}