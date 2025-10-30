-- Update menu permissions to replace /income and /expense with /record
-- Delete old permissions for /income and /expense
DELETE FROM menu_permissions WHERE menu_path IN ('/income', '/expense');

-- Add new permission for /record (combined income-expense page)
INSERT INTO menu_permissions (role, menu_path, menu_name, can_access)
VALUES 
  ('แอดมิน', '/record', 'บันทึกรายรับ-รายจ่าย', true),
  ('บัญชี', '/record', 'บันทึกรายรับ-รายจ่าย', true),
  ('ผู้บริหาร', '/record', 'บันทึกรายรับ-รายจ่าย', true),
  ('ผู้ใช้ทั่วไป', '/record', 'บันทึกรายรับ-รายจ่าย', false)
ON CONFLICT (role, menu_path) DO UPDATE SET can_access = EXCLUDED.can_access, menu_name = EXCLUDED.menu_name;