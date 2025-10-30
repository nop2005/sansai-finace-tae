import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown } from "lucide-react";
import IncomeForm from "@/components/forms/IncomeForm";
import ExpenseForm from "@/components/forms/ExpenseForm";

export default function RecordTransaction() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Tabs defaultValue="income" className="w-full">
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
        <TabsContent value="income">
          <IncomeForm />
        </TabsContent>
        <TabsContent value="expense">
          <ExpenseForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
