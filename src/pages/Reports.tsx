import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Download, FileText, CalendarIcon, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subMonths, eachDayOfInterval, getDaysInMonth, getYear, getMonth, setMonth, setYear } from "date-fns";
import { th } from "date-fns/locale";
import { formatThaiShortDate } from "@/utils/dateFormat";
import { cn } from "@/lib/utils";

type PeriodType = "custom" | "monthly" | "quarterly" | "yearly";

export default function Reports() {
  const navigate = useNavigate();
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [transactions, setTransactions] = useState<any[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New state for dropdowns
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.floor(getMonth(new Date()) / 3) + 1);
  const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()) + 543); // Buddhist year
  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);
  const fetchData = async () => {
    setLoading(true);

    // Fetch transactions for current period
    const {
      data: transactionsData
    } = await supabase.from("transactions").select("*").gte("date", format(startDate, "yyyy-MM-dd")).lte("date", format(endDate, "yyyy-MM-dd"));

    // Fetch transactions for previous 3 months (for comparison chart)
    const prev3MonthsStart = subMonths(startOfMonth(startDate), 3);
    const {
      data: prev3MonthsTransactions
    } = await supabase.from("transactions").select("*").gte("date", format(prev3MonthsStart, "yyyy-MM-dd")).lt("date", format(startDate, "yyyy-MM-dd"));

    // Combine all transactions for calculation
    const allTransactions = [...(transactionsData || []), ...(prev3MonthsTransactions || [])];

    // Fetch categories
    const {
      data: incomeCategoriesData
    } = await supabase.from("income_categories").select("*");
    const {
      data: expenseCategoriesData
    } = await supabase.from("expense_categories").select("*");
    if (allTransactions) setTransactions(allTransactions);
    if (incomeCategoriesData) setIncomeCategories(incomeCategoriesData);
    if (expenseCategoriesData) setExpenseCategories(expenseCategoriesData);
    setLoading(false);
  };
  const handlePeriodChange = (value: PeriodType) => {
    setPeriodType(value);
    const now = new Date();
    switch (value) {
      case "monthly":
        setSelectedMonth(getMonth(now));
        setSelectedYear(getYear(now) + 543);
        updateMonthlyDates(getMonth(now), getYear(now) + 543);
        break;
      case "quarterly":
        setSelectedQuarter(Math.floor(getMonth(now) / 3) + 1);
        setSelectedYear(getYear(now) + 543);
        updateQuarterlyDates(Math.floor(getMonth(now) / 3) + 1, getYear(now) + 543);
        break;
      case "yearly":
        setSelectedYear(getYear(now) + 543);
        updateYearlyDates(getYear(now) + 543);
        break;
      case "custom":
        // Keep current dates
        break;
    }
  };

  const updateMonthlyDates = (month: number, buddhistYear: number) => {
    const christianYear = buddhistYear - 543;
    const date = setYear(setMonth(new Date(), month), christianYear);
    setStartDate(startOfMonth(date));
    setEndDate(endOfMonth(date));
  };

  const updateQuarterlyDates = (quarter: number, buddhistYear: number) => {
    const christianYear = buddhistYear - 543;
    const firstMonthOfQuarter = (quarter - 1) * 3;
    const date = setYear(setMonth(new Date(), firstMonthOfQuarter), christianYear);
    setStartDate(startOfQuarter(date));
    setEndDate(endOfQuarter(date));
  };

  const updateYearlyDates = (buddhistYear: number) => {
    const christianYear = buddhistYear - 543;
    const date = setYear(new Date(), christianYear);
    setStartDate(startOfYear(date));
    setEndDate(endOfYear(date));
  };

  const handleMonthChange = (month: string) => {
    const monthNum = parseInt(month);
    setSelectedMonth(monthNum);
    updateMonthlyDates(monthNum, selectedYear);
  };

  const handleQuarterChange = (quarter: string) => {
    const quarterNum = parseInt(quarter);
    setSelectedQuarter(quarterNum);
    updateQuarterlyDates(quarterNum, selectedYear);
  };

  const handleYearChange = (year: string) => {
    const yearNum = parseInt(year);
    setSelectedYear(yearNum);
    
    if (periodType === "monthly") {
      updateMonthlyDates(selectedMonth, yearNum);
    } else if (periodType === "quarterly") {
      updateQuarterlyDates(selectedQuarter, yearNum);
    } else if (periodType === "yearly") {
      updateYearlyDates(yearNum);
    }
  };

  // Generate year options (current year + 5 years back in Buddhist calendar)
  const currentBuddhistYear = getYear(new Date()) + 543;
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentBuddhistYear - i);

  // Month names in Thai
  const thaiMonths = [
    { value: 0, label: "มกราคม" },
    { value: 1, label: "กุมภาพันธ์" },
    { value: 2, label: "มีนาคม" },
    { value: 3, label: "เมษายน" },
    { value: 4, label: "พฤษภาคม" },
    { value: 5, label: "มิถุนายน" },
    { value: 6, label: "กรกฎาคม" },
    { value: 7, label: "สิงหาคม" },
    { value: 8, label: "กันยายน" },
    { value: 9, label: "ตุลาคม" },
    { value: 10, label: "พฤศจิกายน" },
    { value: 11, label: "ธันวาคม" },
  ];

  const quarters = [
    { value: 1, label: "ไตรมาส 1" },
    { value: 2, label: "ไตรมาส 2" },
    { value: 3, label: "ไตรมาส 3" },
    { value: 4, label: "ไตรมาส 4" },
  ];
  const handleDownload = (format: string) => {
    toast.success(`กำลังดาวน์โหลดรายงานในรูปแบบ ${format.toUpperCase()}`);
  };

  // Calculate summary statistics
  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? netProfit / totalIncome * 100 : 0;

  // Generate monthly data for all 12 months of current year
  const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const currentYear = new Date().getFullYear();
  const monthlyComparison = monthNames.map((monthName, index) => {
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === currentYear && transactionDate.getMonth() === index;
    });
    const income = monthTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = monthTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
    const net = income - expense;
    return {
      month: monthName,
      income,
      expense,
      net
    };
  });

  // Calculate totals for the table
  const totalsRow = monthlyComparison.reduce((acc, row) => ({
    income: acc.income + row.income,
    expense: acc.expense + row.expense,
    net: acc.net + row.net
  }), {
    income: 0,
    expense: 0,
    net: 0
  });

  // Group by category for comparison
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

  // Combine for chart (showing top categories)
  const categoryComparison = [...Object.entries(incomeByCategory).map(([category, amount]) => ({
    category,
    income: amount,
    expense: 0
  })), ...Object.entries(expenseByCategory).map(([category, amount]) => ({
    category,
    income: 0,
    expense: amount
  }))].slice(0, 8);

  // Calculate cumulative daily expenses for current month
  const daysInCurrentMonth = getDaysInMonth(startDate);
  const currentMonthStart = startOfMonth(startDate);
  const currentMonthEnd = endOfMonth(startDate);
  const dailyCumulativeExpense = Array.from({
    length: daysInCurrentMonth
  }, (_, dayIndex) => {
    const day = dayIndex + 1;
    const dayDate = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth(), day);

    // Calculate cumulative expense up to this day in current month
    const cumulativeExpense = transactions.filter(t => {
      const tDate = new Date(t.date);
      return t.type === "expense" && tDate >= currentMonthStart && tDate <= dayDate;
    }).reduce((sum, t) => sum + Number(t.amount), 0);
    return {
      day,
      currentMonth: cumulativeExpense,
      average3Months: 0 // Will calculate next
    };
  });

  // Calculate average cumulative expense from previous 3 months
  const prev3MonthsData = Array.from({
    length: 3
  }, (_, monthOffset) => {
    const monthDate = subMonths(currentMonthStart, monthOffset + 1);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    return {
      monthStart,
      monthEnd
    };
  });

  // For each day, calculate average from previous 3 months
  dailyCumulativeExpense.forEach((dayData, dayIndex) => {
    const day = dayIndex + 1;
    const monthAverages = prev3MonthsData.map(({
      monthStart,
      monthEnd
    }) => {
      // Use the last day of the month if the current day doesn't exist in that month
      const daysInPrevMonth = getDaysInMonth(monthStart);
      const actualDay = Math.min(day, daysInPrevMonth);
      const dayDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), actualDay);

      // Calculate cumulative expense up to this day in that previous month
      const cumulativeExpense = transactions.filter(t => {
        const tDate = new Date(t.date);
        return t.type === "expense" && tDate >= monthStart && tDate <= dayDate;
      }).reduce((sum, t) => sum + Number(t.amount), 0);
      return cumulativeExpense;
    });

    // Calculate average from all 3 months
    const total = monthAverages.reduce((sum, val) => sum + val, 0);
    dayData.average3Months = total / 3;
  });

  // Calculate totals for current month
  const totalExpenseCurrentMonth = dailyCumulativeExpense[dailyCumulativeExpense.length - 1]?.currentMonth || 0;
  const totalAverage3Months = dailyCumulativeExpense[dailyCumulativeExpense.length - 1]?.average3Months || 0;
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">รายงาน</h1>
          <p className="text-muted-foreground mt-1">
            รายงานสรุปและวิเคราะห์ทางการเงิน {formatThaiShortDate(startDate)} - {formatThaiShortDate(endDate)}
          </p>
        </div>

        {/* Download Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleDownload("pdf")}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => handleDownload("excel")}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Period Type */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={periodType} onValueChange={value => handlePeriodChange(value as PeriodType)}>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <FileText className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">รายเดือน</SelectItem>
                  <SelectItem value="quarterly">รายไตรมาส</SelectItem>
                  <SelectItem value="yearly">รายปี</SelectItem>
                  <SelectItem value="custom">กำหนดเอง</SelectItem>
                </SelectContent>
              </Select>

              {/* Month Selection */}
              {periodType === "monthly" && (
                <>
                  <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="เลือกเดือน" />
                    </SelectTrigger>
                    <SelectContent>
                      {thaiMonths.map(month => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="เลือกปี" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}

              {/* Quarter Selection */}
              {periodType === "quarterly" && (
                <>
                  <Select value={selectedQuarter.toString()} onValueChange={handleQuarterChange}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="เลือกไตรมาส" />
                    </SelectTrigger>
                    <SelectContent>
                      {quarters.map(quarter => (
                        <SelectItem key={quarter.value} value={quarter.value.toString()}>
                          {quarter.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="เลือกปี" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}

              {/* Year Selection */}
              {periodType === "yearly" && (
                <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="เลือกปี" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Custom Date Range */}
            {periodType === "custom" && <div className="flex flex-col sm:flex-row gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full sm:w-[200px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? formatThaiShortDate(startDate) : <span>วันที่เริ่มต้น</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={date => date && setStartDate(date)} initialFocus />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full sm:w-[200px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? formatThaiShortDate(endDate) : <span>วันที่สิ้นสุด</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={date => date && setEndDate(date)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">รายรับสะสม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-income">{totalIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">ช่วงเวลาที่เลือก</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">รายจ่ายสะสม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-expense">{totalExpense.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">ช่วงเวลาที่เลือก</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">กำไรสุทธิ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{netProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">ช่วงเวลาที่เลือก</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">อัตรากำไร</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">ช่วงเวลาที่เลือก</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>แนวโน้มรายเดือน (ปีปัจจุบัน)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }} formatter={(value: number) => value.toLocaleString('th-TH', {
                maximumFractionDigits: 0
              })} />
                <Legend />
                <Line type="monotone" dataKey="income" name="รายรับ" stroke="hsl(var(--income))" strokeWidth={3} dot={{
                fill: "hsl(var(--income))",
                r: 4
              }} />
                <Line type="monotone" dataKey="expense" name="รายจ่าย" stroke="hsl(var(--expense))" strokeWidth={3} dot={{
                fill: "hsl(var(--expense))",
                r: 4
              }} />
                <Line type="monotone" dataKey="net" name="สุทธิ" stroke="hsl(var(--primary))" strokeWidth={3} dot={{
                fill: "hsl(var(--primary))",
                r: 4
              }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>เปรียบเทียบตามหมวดหมู่</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={categoryComparison}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="category" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }} formatter={(value: number) => value.toLocaleString('th-TH', {
                maximumFractionDigits: 0
              })} />
                <Legend />
                <Bar dataKey="income" name="รายรับ" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="รายจ่าย" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cumulative Daily Expense Chart */}
      <Card>
        <CardHeader>
          <CardTitle>เปรียบเทียบรายจ่ายย้อนหลัง 3 เดือน</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div>
              <p className="text-sm text-muted-foreground">การใช้จ่ายสะสมเดือนนี้</p>
              <p className="text-2xl font-bold text-expense">{totalExpenseCurrentMonth.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">รายจ่ายเฉลี่ยย้อนหลัง 3 เดือน</p>
              <p className="text-2xl font-bold text-gray-500">{totalAverage3Months.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={dailyCumulativeExpense}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" className="text-xs" label={{
              value: `${format(currentMonthStart, 'MM/yyyy', {
                locale: th
              })}`,
              position: 'insideBottom',
              offset: -5
            }} />
              <YAxis className="text-xs" />
              <Tooltip contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px"
            }} formatter={(value: number) => value.toLocaleString('th-TH', {
              maximumFractionDigits: 0
            })} labelFormatter={day => `${day}/${format(currentMonthStart, 'MM/yyyy', {
              locale: th
            })}`} />
              <Legend />
              <Line type="monotone" dataKey="currentMonth" name="เดือนนี้" stroke="hsl(var(--expense))" strokeWidth={3} dot={{
              fill: "hsl(var(--expense))",
              r: 4
            }} />
              <Line type="monotone" dataKey="average3Months" name="ค่าเฉลี่ย 3 เดือนก่อนหน้า" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" dot={{
              fill: "hsl(var(--muted-foreground))",
              r: 3
            }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>สรุปรายละเอียดรายเดือน (ปีปัจจุบัน)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">เดือน</th>
                  <th className="text-right py-3 px-4 font-medium">รายรับ</th>
                  <th className="text-right py-3 px-4 font-medium">รายจ่าย</th>
                  <th className="text-right py-3 px-4 font-medium">สุทธิ</th>
                  <th className="text-right py-3 px-4 font-medium">อัตรากำไร</th>
                  <th className="text-center py-3 px-4 font-medium">รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {monthlyComparison.map((row, index) => <tr key={row.month} className="border-b border-border hover:bg-accent/50">
                    <td className="py-3 px-4">{row.month}</td>
                    <td className="text-right py-3 px-4 text-income font-medium">
                      {row.income.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 text-expense font-medium">
                      {row.expense.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 font-bold">
                      {row.net.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4">
                      {row.income > 0 ? (row.net / row.income * 100).toFixed(1) : "0.0"}%
                    </td>
                    <td className="text-center py-3 px-4">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/monthly-detail/${currentYear}/${index + 1}`)} className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>)}
                {/* Total Row */}
                <tr className="border-t-2 border-border bg-accent/30 font-bold">
                  <td className="py-3 px-4">รวมทั้งหมด</td>
                  <td className="text-right py-3 px-4 text-income">
                    {totalsRow.income.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4 text-expense">
                    {totalsRow.expense.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4 text-primary">
                    {totalsRow.net.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4">
                    {totalsRow.income > 0 ? (totalsRow.net / totalsRow.income * 100).toFixed(1) : "0.0"}%
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>;
}