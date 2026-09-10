import React, { useState, useEffect } from 'react';
import { 
  auth,
  onAuthStateChanged, 
  User, 
  signInWithGoogle, 
  logout, 
  db 
} from './firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Wallet, 
  LogOut, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Calendar, 
  Search,
  DollarSign
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  Transaction, 
  TransactionType, 
  THAI_MONTHS, 
  DEFAULT_CATEGORIES 
} from './types';
import { CategoryIcon } from './components/CategoryIcon';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { AddTransactionModal } from './components/AddTransactionModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(false);

  // Date selection state (Defaults to current year and month)
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1); // 1-12

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalInitialType, setModalInitialType] = useState<TransactionType>('expense');

  // Listen to Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore Transactions for Current User
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    setDataLoading(true);
    // Realtime Firestore collection query
    const txRef = collection(db, 'transactions');
    const q = query(
      txRef,
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: Transaction[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Transaction, 'id'>)
      }));
      setTransactions(docs);
      setDataLoading(false);
    }, (error) => {
      console.error('Error fetching transactions:', error);
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Handler: Add new transaction
  const handleAddTransaction = async (newTx: Omit<Transaction, 'id' | 'userId'>) => {
    if (!user) return;
    await addDoc(collection(db, 'transactions'), {
      ...newTx,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });

    if (newTx.type === 'income') {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 }
      });
    }
  };

  // Handler: Delete transaction
  const handleDeleteTransaction = async (id?: string) => {
    if (!id || !user) return;
    if (!window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  // Navigation handlers for months
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
  };

  // Monthly summary stats
  const currentMonthTransactions = transactions.filter(t => {
    const [y, m] = t.date.split('-').map(Number);
    return y === selectedYear && m === selectedMonth;
  });

  const totalIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Filtered transactions for the list
  const filteredTransactions = currentMonthTransactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const cat = DEFAULT_CATEGORIES.find(c => c.id === t.category);
      const catName = cat?.name.toLowerCase() || '';
      const note = (t.note || '').toLowerCase();
      if (!catName.includes(q) && !note.includes(q)) return false;
    }
    return true;
  });

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium text-sm">กำลังเชื่อมต่อระบบ PassiveDB...</p>
      </div>
    );
  }

  // Not Logged In Screen (Gmail / Google Sign In)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 flex items-center justify-center p-4 sm:p-6">
        <div 
          id="login-card"
          className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-white"
        >
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 rounded-full p-1 bg-white shadow-md shadow-indigo-100 border border-slate-100 flex items-center justify-center mb-4 overflow-hidden">
              <img 
                src="/pvclogo.png" 
                alt="ตราสัญลักษณ์ วิทยาลัยอาชีวศึกษาแพร่"
                className="w-full h-full object-contain rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
              วิทยาลัยอาชีวศึกษาแพร่
            </span>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              PassiveDB Expense Tracker
            </h1>
            <p className="text-slate-500 text-sm mt-2 max-w-xs leading-relaxed">
              ระบบจัดการรายรับรายจ่าย พร้อมสรุปผลรายเดือนและกราฟวิเคราะห์ข้อมูล บันทึกข้อมูลคลาวด์บน Firebase
            </p>
          </div>

          {/* Features highlight */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <p className="font-semibold text-slate-800">สรุปผลแบบรายเดือน</p>
                <p className="text-slate-500">ติดตามยอดรับ-จ่าย และยอดเงินคงเหลืออัตโนมัติ</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <p className="font-semibold text-slate-800">กราฟวิเคราะห์ข้อมูล</p>
                <p className="text-slate-500">กราฟสัดส่วนหมวดหมู่, กราฟรายวัน และแนวโน้ม 6 เดือน</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <p className="font-semibold text-slate-800">ปลอดภัยด้วย Firebase PassiveDB</p>
                <p className="text-slate-500">แยกข้อมูลรายบุคคลอย่างปลอดภัยแบบ Real-time</p>
              </div>
            </div>
          </div>

          {/* Google Sign-in Button */}
          <button
            id="google-signin-btn"
            onClick={() => signInWithGoogle()}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98]"
          >
            {/* Google SVG Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>เข้าสู่ระบบด้วย Gmail (Google Account)</span>
          </button>

          <p className="text-center text-[11px] text-slate-400 mt-4">
            เชื่อมต่อกับฐานข้อมูล Firebase โครงการ PassiveDB
          </p>
        </div>
      </div>
    );
  }

  // Logged-in Dashboard
  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 pb-16 font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full p-0.5 bg-white shadow-xs border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden">
              <img 
                src="/pvclogo.png" 
                alt="ตราสัญลักษณ์ วิทยาลัยอาชีวศึกษาแพร่"
                className="w-full h-full object-contain rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-none">
                  วิทยาลัยอาชีวศึกษาแพร่
                </h1>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  PassiveDB
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
                ระบบจัดการรายรับ-รายจ่าย & กราฟวิเคราะห์ผล (Firebase Cloud)
              </p>
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-slate-100/80 py-1.5 px-3 rounded-full border border-slate-200/60">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 rounded-full ring-1 ring-white"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  {user.email?.[0].toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-xs font-semibold text-slate-700 max-w-[120px] sm:max-w-[200px] truncate">
                {user.displayName || user.email}
              </span>
            </div>

            <button
              id="logout-btn"
              onClick={() => logout()}
              title="ออกจากระบบ"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        
        {/* Month Selector Bar & Quick Action Button */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              id="prev-month-btn"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 px-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span className="text-lg font-bold text-slate-800">
                {THAI_MONTHS[selectedMonth - 1]} {selectedYear + 543}
              </span>
            </div>

            <button
              id="next-month-btn"
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {(selectedYear !== currentDate.getFullYear() || selectedMonth !== currentDate.getMonth() + 1) && (
              <button
                id="current-month-btn"
                onClick={handleCurrentMonth}
                className="text-xs text-indigo-600 font-semibold px-2 py-1 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                เดือนปัจจุบัน
              </button>
            )}
          </div>

          {/* Add Transaction Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="add-income-quick-btn"
              onClick={() => {
                setModalInitialType('income');
                setIsModalOpen(true);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/70 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              + รายรับ
            </button>

            <button
              id="add-expense-quick-btn"
              onClick={() => {
                setModalInitialType('expense');
                setIsModalOpen(true);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/70 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              - รายจ่าย
            </button>

            <button
              id="add-transaction-main-btn"
              onClick={() => {
                setModalInitialType('expense');
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกรายการ</span>
            </button>
          </div>
        </div>

        {/* Monthly Summary Cards (3 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Income Card */}
          <div 
            id="summary-income-card"
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                รายรับทั้งหมด (Income)
              </p>
              <p className="text-2xl font-black text-emerald-600 mt-0.5">
                ฿{totalIncome.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Expense Card */}
          <div 
            id="summary-expense-card"
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                รายจ่ายทั้งหมด (Expense)
              </p>
              <p className="text-2xl font-black text-rose-600 mt-0.5">
                ฿{totalExpense.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Net Balance Card */}
          <div 
            id="summary-balance-card"
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              balance >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <DollarSign className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                ยอดคงเหลือสุทธิ (Net Balance)
              </p>
              <p className={`text-2xl font-black mt-0.5 ${
                balance >= 0 ? 'text-indigo-600' : 'text-amber-600'
              }`}>
                {balance >= 0 ? '฿' : '-฿'}{Math.abs(balance).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Analytics & Graphs Section */}
        <AnalyticsCharts
          transactions={transactions}
          year={selectedYear}
          month={selectedMonth}
        />

        {/* Monthly Transactions List Section */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                รายการในเดือนนี้ ({filteredTransactions.length} รายการ)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                บันทึกและประวัติของเดือน {THAI_MONTHS[selectedMonth - 1]} {selectedYear + 543}
              </p>
            </div>

            {/* Filters and Search toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="transaction-search-input"
                  type="text"
                  placeholder="ค้นหาหมวดหมู่, บันทึก..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-44 sm:w-52"
                />
              </div>

              {/* Filter Type */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-medium text-slate-600">
                <button
                  id="filter-all-btn"
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-lg ${filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : ''}`}
                >
                  ทั้งหมด
                </button>
                <button
                  id="filter-income-btn"
                  onClick={() => setFilterType('income')}
                  className={`px-2.5 py-1 rounded-lg ${filterType === 'income' ? 'bg-white text-emerald-700 shadow-xs' : ''}`}
                >
                  รายรับ
                </button>
                <button
                  id="filter-expense-btn"
                  onClick={() => setFilterType('expense')}
                  className={`px-2.5 py-1 rounded-lg ${filterType === 'expense' ? 'bg-white text-rose-700 shadow-xs' : ''}`}
                >
                  รายจ่าย
                </button>
              </div>
            </div>
          </div>

          {/* Transactions List Table / Feed */}
          {dataLoading ? (
            <div className="py-12 flex justify-center items-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Wallet className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-sm font-semibold text-slate-600">ยังไม่มีรายการบันทึกในเดือนนี้</p>
              <p className="text-xs text-slate-400 mt-1">กดปุ่ม "บันทึกรายการ" เพื่อเริ่มต้นบันทึกรายรับหรือรายจ่าย</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTransactions.map(tx => {
                const catDef = DEFAULT_CATEGORIES.find(c => c.id === tx.category);
                const isExpense = tx.type === 'expense';

                return (
                  <div 
                    key={tx.id} 
                    className="py-3.5 flex items-center justify-between group hover:bg-slate-50/60 -mx-2 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Icon */}
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ 
                          backgroundColor: catDef ? catDef.bgLight : '#f1f5f9',
                          color: catDef ? catDef.color : '#64748b' 
                        }}
                      >
                        <CategoryIcon iconName={catDef ? catDef.icon : 'MoreHorizontal'} size={18} />
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-slate-800 truncate">
                            {catDef ? catDef.name : tx.category}
                          </p>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {tx.date}
                          </span>
                        </div>
                        {tx.note && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {tx.note}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Amount & Delete */}
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className={`text-base font-bold ${
                        isExpense ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {isExpense ? '-฿' : '+฿'}{tx.amount.toLocaleString()}
                      </span>

                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="ลบรายการ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddTransaction}
        initialType={modalInitialType}
      />
    </div>
  );
}
