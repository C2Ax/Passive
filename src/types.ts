export type TransactionType = 'income' | 'expense';

export interface CategoryInfo {
  id: string;
  name: string;
  icon: string; // Lucide icon name or emoji
  color: string;
  bgLight: string;
  type: TransactionType;
}

export interface Transaction {
  id?: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt?: any;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: number;
  categoryBreakdown: { [category: string]: number };
  dailyBreakdown: { [day: number]: { income: number; expense: number } };
}

export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  // Expense categories
  { id: 'food', name: 'อาหารและเครื่องดื่ม', icon: 'Utensils', color: '#f97316', bgLight: '#ffedd5', type: 'expense' },
  { id: 'transport', name: 'การเดินทาง / ค่าน้ำมัน', icon: 'Car', color: '#3b82f6', bgLight: '#dbeafe', type: 'expense' },
  { id: 'shopping', name: 'ช้อปปิ้ง & ของใช้', icon: 'ShoppingBag', color: '#ec4899', bgLight: '#fce7f3', type: 'expense' },
  { id: 'housing', name: 'ที่อยู่อาศัย / ค่าน้ำ-ไฟ', icon: 'Home', color: '#8b5cf6', bgLight: '#ede9fe', type: 'expense' },
  { id: 'bills', name: 'ค่าบริการ / อินเทอร์เน็ต', icon: 'Receipt', color: '#06b6d4', bgLight: '#cffafe', type: 'expense' },
  { id: 'entertainment', name: 'ความบันเทิง / ท่องเที่ยว', icon: 'Film', color: '#eab308', bgLight: '#fef9c3', type: 'expense' },
  { id: 'health', name: 'สุขภาพ / ยารักษาโรค', icon: 'HeartPulse', color: '#ef4444', bgLight: '#fee2e2', type: 'expense' },
  { id: 'education', name: 'การศึกษา / พัฒนาตนเอง', icon: 'BookOpen', color: '#10b981', bgLight: '#d1fae5', type: 'expense' },
  { id: 'other_expense', name: 'รายจ่ายอื่นๆ', icon: 'MoreHorizontal', color: '#64748b', bgLight: '#f1f5f9', type: 'expense' },

  // Income categories
  { id: 'salary', name: 'เงินเดือน / ค่าจ้าง', icon: 'Briefcase', color: '#10b981', bgLight: '#d1fae5', type: 'income' },
  { id: 'business', name: 'ธุรกิจส่วนตัว / ค้าขาย', icon: 'Store', color: '#059669', bgLight: '#ecfdf5', type: 'income' },
  { id: 'investment', name: 'ปันผล / กำไรลงทุน', icon: 'TrendingUp', color: '#0ea5e9', bgLight: '#e0f2fe', type: 'income' },
  { id: 'bonus', name: 'โบนัส / ค่าล่วงเวลา', icon: 'Award', color: '#8b5cf6', bgLight: '#f5f3ff', type: 'income' },
  { id: 'other_income', name: 'รายรับอื่นๆ', icon: 'PlusCircle', color: '#14b8a6', bgLight: '#ccfbf1', type: 'income' }
];

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];
