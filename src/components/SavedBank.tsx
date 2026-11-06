import React, { useState } from 'react';
import { Worksheet, Exam, LessonPlan } from '../types';
import { Archive, FileText, Award, BookOpen, Trash2, Eye, Download, Upload, Search } from 'lucide-react';

interface SavedBankProps {
  worksheets: Worksheet[];
  exams: Exam[];
  lessonPlans: LessonPlan[];
  onSelectWorksheet: (ws: Worksheet) => void;
  onSelectExam: (exam: Exam) => void;
  onSelectPlan: (plan: LessonPlan) => void;
  onDeleteWorksheet: (id: string) => void;
  onDeleteExam: (id: string) => void;
  onDeletePlan: (id: string) => void;
  onImportData: (data: { worksheets: Worksheet[]; exams: Exam[]; lessonPlans: LessonPlan[] }) => void;
}

export const SavedBank: React.FC<SavedBankProps> = ({
  worksheets,
  exams,
  lessonPlans,
  onSelectWorksheet,
  onSelectExam,
  onSelectPlan,
  onDeleteWorksheet,
  onDeleteExam,
  onDeletePlan,
  onImportData,
}) => {
  const [filter, setFilter] = useState<'all' | 'worksheet' | 'exam' | 'lessonplan'>('all');
  const [search, setSearch] = useState('');

  const exportJson = () => {
    const data = { worksheets, exams, lessonPlans, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-exam-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportData({
          worksheets: parsed.worksheets || [],
          exams: parsed.exams || [],
          lessonPlans: parsed.lessonPlans || [],
        });
        alert('นำเข้าข้อมูลสำเร็จ!');
      } catch {
        alert('ไฟล์ JSON ไม่ถูกต้อง');
      }
    };
    reader.readAsText(file);
  };

  const allItems = [
    ...worksheets.map((w) => ({ ...w, itemType: 'worksheet' as const, date: w.createdAt })),
    ...exams.map((e) => ({ ...e, itemType: 'exam' as const, date: e.createdAt })),
    ...lessonPlans.map((l) => ({ ...l, itemType: 'lessonplan' as const, date: l.createdAt })),
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const filteredItems = allItems.filter((item) => {
    if (filter !== 'all' && item.itemType !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.title?.toLowerCase().includes(q) ||
        item.subject?.toLowerCase().includes(q) ||
        item.grade?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-slate-900">คลังของฉัน (Saved Archive)</h2>
            <p className="text-sm text-slate-500">
              รวม {worksheets.length} ใบงาน • {exams.length} ชุดข้อสอบ • {lessonPlans.length} แผนการสอน
            </p>
          </div>
        </div>

        {/* Export / Import buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 hover:bg-slate-50 text-slate-700"
            title="สำรองข้อมูลทั้งหมดเป็น JSON"
          >
            <Download className="w-4 h-4" />
            <span>สำรองข้อมูล (Export)</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>นำเข้า (Import)</span>
            <input type="file" accept=".json" onChange={importJson} className="hidden" />
          </label>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Type tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            ทั้งหมด ({allItems.length})
          </button>
          <button
            onClick={() => setFilter('worksheet')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              filter === 'worksheet' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            ใบงาน ({worksheets.length})
          </button>
          <button
            onClick={() => setFilter('exam')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              filter === 'exam' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            ข้อสอบ ({exams.length})
          </button>
          <button
            onClick={() => setFilter('lessonplan')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              filter === 'lessonplan' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            แผนการสอน ({lessonPlans.length})
          </button>
        </div>

        {/* Search box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อเรื่องหรือวิชา..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Archive className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="font-medium text-slate-700">ยังไม่มีรายการที่บันทึกไว้</p>
          <p className="text-xs text-slate-400 mt-1">
            เมื่อสร้างใบงาน ข้อสอบ หรือแผนการสอนแล้ว กดปุ่ม "บันทึกลงคลัง" เพื่อเก็บไว้ที่นี่
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isWs = item.itemType === 'worksheet';
            const isEx = item.itemType === 'exam';
            const iconColor = isWs
              ? 'bg-blue-50 text-blue-600'
              : isEx
              ? 'bg-indigo-50 text-indigo-600'
              : 'bg-purple-50 text-purple-600';
            const label = isWs ? 'ใบงาน' : isEx ? 'ข้อสอบ' : 'แผนการสอน';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${iconColor}`}>
                      {label}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.date).toLocaleDateString('th-TH', { dateStyle: 'short' })}
                    </span>
                  </div>

                  <h3 className="font-heading font-semibold text-slate-900 text-base line-clamp-2 mb-1">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500">
                    วิชา{item.subject} • ชั้น{item.grade}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      if (isWs) onSelectWorksheet(item as any);
                      else if (isEx) onSelectExam(item as any);
                      else onSelectPlan(item as any);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>เปิดดู / พิมพ์</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`ต้องการลบ "${item.title}" หรือไม่?`)) {
                        if (isWs) onDeleteWorksheet(item.id);
                        else if (isEx) onDeleteExam(item.id);
                        else onDeletePlan(item.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="ลบ"
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
  );
};

