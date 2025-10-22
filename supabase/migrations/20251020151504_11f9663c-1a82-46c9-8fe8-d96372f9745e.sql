-- Create expense categories table
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create income categories table
CREATE TABLE public.income_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense items table
CREATE TABLE public.expense_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create income items table
CREATE TABLE public.income_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.income_categories(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date DATE NOT NULL,
  category_id UUID,
  item_id UUID,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for transaction attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('transaction-attachments', 'transaction-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Create transaction attachments table
CREATE TABLE public.transaction_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is internal hospital system)
CREATE POLICY "Allow all operations on expense_categories"
ON public.expense_categories FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on income_categories"
ON public.income_categories FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on expense_items"
ON public.expense_items FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on income_items"
ON public.income_items FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on transactions"
ON public.transactions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on transaction_attachments"
ON public.transaction_attachments FOR ALL USING (true) WITH CHECK (true);

-- Storage policies for transaction attachments
CREATE POLICY "Allow all operations on transaction attachments storage"
ON storage.objects FOR ALL
USING (bucket_id = 'transaction-attachments')
WITH CHECK (bucket_id = 'transaction-attachments');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_expense_categories_updated_at
BEFORE UPDATE ON public.expense_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_income_categories_updated_at
BEFORE UPDATE ON public.income_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expense_items_updated_at
BEFORE UPDATE ON public.expense_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_income_items_updated_at
BEFORE UPDATE ON public.income_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default expense categories
INSERT INTO public.expense_categories (name, description) VALUES
('เงินเดือน', 'ค่าใช้จ่ายเงินเดือนพนักงาน'),
('อุปกรณ์ทางการแพทย์', 'อุปกรณ์และเครื่องมือทางการแพทย์'),
('ยาและเวชภัณฑ์', 'ยาและเวชภัณฑ์ทางการแพทย์'),
('ค่าสาธารณูปโภค', 'ค่าไฟฟ้า น้ำประปา โทรศัพท์'),
('ค่าบำรุงรักษา', 'ค่าซ่อมแซมและบำรุงรักษา'),
('วัสดุสิ้นเปลือง', 'วัสดุสิ้นเปลืองทั่วไป'),
('อื่นๆ', 'ค่าใช้จ่ายอื่นๆ');

-- Insert default income categories
INSERT INTO public.income_categories (name, description) VALUES
('ค่ารักษาพยาบาล', 'รายได้จากการรักษาพยาบาล'),
('ค่ายา', 'รายได้จากการจ่ายยา'),
('ค่าห้อง', 'รายได้ค่าห้องพักผู้ป่วย'),
('ค่าตรวจ', 'รายได้จากการตรวจวินิจฉัย'),
('ค่าห้องปฏิบัติการ', 'รายได้จากห้องปฏิบัติการ'),
('อื่นๆ', 'รายได้อื่นๆ');