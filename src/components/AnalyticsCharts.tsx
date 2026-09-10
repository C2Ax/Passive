import React, { useState } from 'react';
import { 
  PieChart as PieChartIcon, 
  BarChart3, 
  TrendingDown, 
  TrendingUp, 
  Info,
  Calendar
} from 'lucide-react';
import { Transaction, DEFAULT_CATEGORIES, THAI_MONTHS } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface AnalyticsChartsProps {
  transactions: Transaction[];
  year: number;
  month: number; // 1-12
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ transactions, year, month }) => {
  const [activeTab, setActiveTab] = useState<'category' | 'daily' | 'comparison'>('category');
  const [activeCategoryType, setActiveCategoryType] = useState<'expense' | 'income'>('expense');

  // Filter transactions for current selected year and month
  const currentMonthTransactions = transactions.filter(t => {
    const [tYear, tMonth] = t.date.split('-').map(Number);
    return tYear === year && tMonth === month;
  });

  // Calculate totals
  const totalIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;
  const savingsRatio = totalIncome > 0 ? Math.max(0, Math.round((netBalance / totalIncome) * 100)) : 0;

  // Category grouping
  const categoryTotals: { [key: string]: number } = {};
  currentMonthTransactions
    .filter(t => t.type === activeCategoryType)
    .forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  const categoryData = Object.keys(categoryTotals).map(catId => {
    const catDef = DEFAULT_CATEGORIES.find(c => c.id === catId);
    const amount = categoryTotals[catId];
    const total = activeCategoryType === 'expense' ? totalExpense : totalIncome;
    const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;
    return {
      id: catId,
      name: catDef ? catDef.name : catId,
      amount,
      percentage,
      color: catDef ? catDef.color : '#94a3b8',
      icon: catDef ? catDef.icon : 'MoreHorizontal',
    };
  }).sort((a, b) => b.amount - a.amount);

  // Daily Breakdown (1st to last day of month)
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const datePattern = `${year}-${month < 10 ? `0${month}` : month}-${dayStr}`;

    const dayTxns = currentMonthTransactions.filter(t => t.date === datePattern);
    const dayIncome = dayTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const dayExpense = dayTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    return {
      day,
      date: datePattern,
      income: dayIncome,
      expense: dayExpense,
    };
  });

  const maxDailyValue = Math.max(...dailyData.map(d => Math.max(d.income, d.expense)), 1000);

  // 6-Month Trend analysis
  const monthTrend = Array.from({ length: 6 }, (_, i) => {
    // 5 months back to current month
    const d = new Date(year, month - 1 - (5 - i), 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const monthName = THAI_MONTHS[m - 1].substring(0, 3);

    const mTxns = transactions.filter(t => {
      const [tYear, tMonth] = t.date.split('-').map(Number);
      return tYear === y && tMonth === m;
    });

    const inc = mTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = mTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    return {
      label: `${monthName} ${y + 543}`,
      income: inc,
      expense: exp,
      net: inc - exp
    };
  });

  const maxTrendValue = Math.max(...monthTrend.map(m => Math.max(m.income, m.expense)), 2000);

  // SVG Pie Chart Generator
  const generatePieSlices = () => {
    if (categoryData.length === 0) return null;
    let accumulatedAngle = 0;
    const radius = 80;
    const cx = 100;
    const cy = 100;

    return categoryData.map((item, idx) => {
      const sliceAngle = (item.percentage / 100) * 360;
      // Handle single 100% item circle
      if (categoryData.length === 1 || item.percentage >= 99.9) {
        return (
          <circle
            key={item.id}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={item.color}
            strokeWidth="34"
            className="transition-all duration-300 hover:opacity-85"
          />
        );
      }

      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + sliceAngle;
      accumulatedAngle = endAngle;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      return (
        <path
          key={item.id}
          d={pathData}
          fill={item.color}
          className="transition-all duration-300 hover:scale-105 origin-center cursor-pointer hover:opacity-90"
        >
          <title>{`${item.name}: ฿${item.amount.toLocaleString()} (${item.percentage}%)`}</title>
        </path>
      );
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6" id="analytics-container">
      {/* Header with Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            กราฟวิเคราะห์ข้อมูลการเงิน
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            ประจำเดือน {THAI_MONTHS[month - 1]} {year + 543}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            id="tab-category-btn"
            onClick={() => setActiveTab('category')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'category'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            สัดส่วนหมวดหมู่
          </button>
          <button
            id="tab-daily-btn"
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'daily'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            รายวัน
          </button>
          <button
            id="tab-trend-btn"
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'comparison'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            แนวโน้ม 6 เดือน
          </button>
        </div>
      </div>

      {/* TAB 1: Category Breakdown */}
      {activeTab === 'category' && (
        <div className="flex flex-col gap-6">
          {/* Sub Switch: Expense vs Income */}
          <div className="flex justify-center">
            <div className="inline-flex bg-slate-100 p-1 rounded-xl">
              <button
                id="filter-cat-expense-btn"
                onClick={() => setActiveCategoryType('expense')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeCategoryType === 'expense'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                วิเคราะห์รายจ่าย (฿{totalExpense.toLocaleString()})
              </button>
              <button
                id="filter-cat-income-btn"
                onClick={() => setActiveCategoryType('income')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeCategoryType === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                วิเคราะห์รายรับ (฿{totalIncome.toLocaleString()})
              </button>
            </div>
          </div>

          {categoryData.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <Info className="w-10 h-10 mb-2 opacity-50 stroke-[1.5]" />
              <p className="text-sm font-medium">ยังไม่มีข้อมูล{activeCategoryType === 'expense' ? 'รายจ่าย' : 'รายรับ'}ในเดือนนี้</p>
              <p className="text-xs text-slate-400 mt-1">เพิ่มรายการเพื่อแสดงกราฟวิเคราะห์สัดส่วน</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Pie Chart visual */}
              <div className="md:col-span-5 flex flex-col items-center justify-center">
                <div className="relative w-52 h-52">
                  <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90 drop-shadow-xs">
                    {generatePieSlices()}
                    {/* Inner hole for Donut Chart style */}
                    <circle cx="100" cy="100" r="54" fill="#ffffff" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-xs font-medium text-slate-400">รวม{activeCategoryType === 'expense' ? 'จ่าย' : 'รับ'}</span>
                    <span className="text-base font-bold text-slate-800">
                      ฿{(activeCategoryType === 'expense' ? totalExpense : totalIncome).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Category Breakdown Progress Bars */}
              <div className="md:col-span-7 flex flex-col gap-3">
                {categoryData.map(cat => (
                  <div key={cat.id} className="group">
                    <div className="flex items-center justify-between text-xs font-medium mb-1">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: cat.color }} 
                        />
                        <span className="text-slate-700 font-semibold">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-800">฿{cat.amount.toLocaleString()}</span>
                        <span className="text-slate-400 ml-1.5">({cat.percentage}%)</span>
                      </div>
                    </div>
                    {/* Progress Track */}
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{ 
                          width: `${Math.max(cat.percentage, 2)}%`, 
                          backgroundColor: cat.color 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Daily Expenses and Incomes */}
      {activeTab === 'daily' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>ความเคลื่อนไหวรายวัน (วันที่ 1 - {daysInMonth})</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span> รายรับ
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500"></span> รายจ่าย
              </span>
            </div>
          </div>

          {/* Bar chart container */}
          <div className="h-64 flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 px-1 border-b border-slate-200 overflow-x-auto">
            {dailyData.map(item => {
              const incomeHeight = maxDailyValue > 0 ? (item.income / maxDailyValue) * 100 : 0;
              const expenseHeight = maxDailyValue > 0 ? (item.expense / maxDailyValue) * 100 : 0;
              const hasActivity = item.income > 0 || item.expense > 0;

              return (
                <div 
                  key={item.day} 
                  className="flex-1 min-w-[20px] max-w-[32px] h-full flex flex-col justify-end items-center group relative cursor-pointer"
                >
                  {/* Tooltip */}
                  {hasActivity && (
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-800 text-white text-[11px] p-2 rounded-lg shadow-lg z-20 whitespace-nowrap pointer-events-none">
                      <div className="font-semibold border-b border-slate-700 pb-1 mb-1">
                        วันที่ {item.day} {THAI_MONTHS[month - 1]}
                      </div>
                      {item.income > 0 && (
                        <div className="text-emerald-400">รับ: +฿{item.income.toLocaleString()}</div>
                      )}
                      {item.expense > 0 && (
                        <div className="text-rose-400">จ่าย: -฿{item.expense.toLocaleString()}</div>
                      )}
                    </div>
                  )}

                  {/* Dual Bars */}
                  <div className="w-full flex items-end justify-center gap-0.5 h-full">
                    {/* Income Bar */}
                    <div 
                      className="w-1/2 bg-emerald-500/80 hover:bg-emerald-500 rounded-t-xs transition-all duration-300"
                      style={{ height: `${Math.max(incomeHeight, item.income > 0 ? 4 : 0)}%` }}
                    />
                    {/* Expense Bar */}
                    <div 
                      className="w-1/2 bg-rose-500/80 hover:bg-rose-500 rounded-t-xs transition-all duration-300"
                      style={{ height: `${Math.max(expenseHeight, item.expense > 0 ? 4 : 0)}%` }}
                    />
                  </div>

                  {/* Day Label */}
                  <span className={`text-[10px] mt-2 font-medium ${item.day % 5 === 0 || item.day === 1 ? 'text-slate-700 font-bold' : 'text-slate-400'}`}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: 6-Month Comparison Trend */}
      {activeTab === 'comparison' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>เปรียบเทียบรายรับและรายจ่ายย้อนหลัง 6 เดือน</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-emerald-500"></span> รายรับ
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-rose-500"></span> รายจ่าย
              </span>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 pt-6 pb-2 px-2 border-b border-slate-200">
            {monthTrend.map((m, idx) => {
              const incomeHeight = maxTrendValue > 0 ? (m.income / maxTrendValue) * 100 : 0;
              const expenseHeight = maxTrendValue > 0 ? (m.expense / maxTrendValue) * 100 : 0;

              return (
                <div key={idx} className="flex-1 flex flex-col justify-end items-center h-full group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-800 text-white text-xs p-2 rounded-lg shadow-lg z-20 whitespace-nowrap pointer-events-none">
                    <span className="font-bold border-b border-slate-700 pb-1 mb-1">{m.label}</span>
                    <span className="text-emerald-400">รายรับ: ฿{m.income.toLocaleString()}</span>
                    <span className="text-rose-400">รายจ่าย: ฿{m.expense.toLocaleString()}</span>
                    <span className={`pt-1 border-t border-slate-700 ${m.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      คงเหลือ: ฿{m.net.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full flex items-end justify-center gap-2 h-full">
                    {/* Income Bar */}
                    <div 
                      className="w-1/3 max-w-[28px] bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all duration-300"
                      style={{ height: `${Math.max(incomeHeight, m.income > 0 ? 6 : 0)}%` }}
                    />
                    {/* Expense Bar */}
                    <div 
                      className="w-1/3 max-w-[28px] bg-rose-500 hover:bg-rose-600 rounded-t-md transition-all duration-300"
                      style={{ height: `${Math.max(expenseHeight, m.expense > 0 ? 6 : 0)}%` }}
                    />
                  </div>

                  <span className="text-xs text-slate-600 font-semibold mt-2 text-center truncate max-w-full">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col">
              <span className="text-[11px] font-medium text-slate-500">อัตราการออมเดือนนี้</span>
              <span className="text-lg font-bold text-indigo-600 mt-0.5">{savingsRatio}%</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col">
              <span className="text-[11px] font-medium text-slate-500">รายจ่ายเฉลี่ยต่อวัน (เดือนนี้)</span>
              <span className="text-lg font-bold text-rose-600 mt-0.5">
                ฿{daysInMonth > 0 ? Math.round(totalExpense / daysInMonth).toLocaleString() : 0}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col">
              <span className="text-[11px] font-medium text-slate-500">สถานะคงเหลือ</span>
              <span className={`text-lg font-bold mt-0.5 ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {netBalance >= 0 ? '+฿' : '-฿'}{Math.abs(netBalance).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
