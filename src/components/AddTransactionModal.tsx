import React, { useState } from 'react';
import { Plus, X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { TransactionType, DEFAULT_CATEGORIES, Transaction } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  initialType?: TransactionType;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialType = 'expense',
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('food');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredCategories = DEFAULT_CATEGORIES.filter(c => c.type === type);

  // If active category not in filtered list, reset to first
  if (!filteredCategories.some(c => c.id === category) && filteredCategories.length > 0) {
    setCategory(filteredCategories[0].id);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('กรุณาระบุจำนวนเงินที่มากกว่า 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave({
        type,
        amount: numAmount,
        category,
        note: note.trim(),
        date,
      });
      // Reset form
      setAmount('');
      setNote('');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        id="transaction-modal-card"
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg">
            {type === 'expense' ? 'บันทึกรายจ่าย' : 'บันทึกรายรับ'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Type Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              id="type-expense-toggle"
              onClick={() => {
                setType('expense');
                setCategory('food');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${
                type === 'expense'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              รายจ่าย (Expense)
            </button>
            <button
              type="button"
              id="type-income-toggle"
              onClick={() => {
                setType('income');
                setCategory('salary');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${
                type === 'income'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              รายรับ (Income)
            </button>
          </div>

          {/* Amount Input with Currency Symbol */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              จำนวนเงิน (บาท)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                ฿
              </span>
              <input
                id="transaction-amount-input"
                type="number"
                step="0.01"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Category Grid Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              เลือกหมวดหมู่
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredCategories.map(cat => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-100 bg-slate-50/70 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-transform"
                      style={{ 
                        backgroundColor: isSelected ? cat.color : cat.bgLight, 
                        color: isSelected ? '#ffffff' : cat.color 
                      }}
                    >
                      <CategoryIcon iconName={cat.icon} size={18} />
                    </div>
                    <span className="truncate w-full text-center">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Note Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                วันที่ทำรายการ
              </label>
              <input
                id="transaction-date-input"
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                บันทึกช่วยจำ (ไม่บังคับ)
              </label>
              <input
                id="transaction-note-input"
                type="text"
                placeholder="เช่น ข้าวกลางวัน, ค่ารถ"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-500 font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-100">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              id="submit-transaction-btn"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>กำลังบันทึก...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>บันทึกข้อมูล</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
