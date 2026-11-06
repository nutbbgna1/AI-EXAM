import React, { useState } from 'react';
import { Worksheet } from '../types';
import { Printer, BookmarkCheck, Bookmark, ArrowLeft, Eye, CheckCircle2 } from 'lucide-react';

interface WorksheetPreviewProps {
  worksheet: Worksheet;
  onBack: () => void;
  onSave: (ws: Worksheet) => void;
  isSaved?: boolean;
}

export const WorksheetPreview: React.FC<WorksheetPreviewProps> = ({
  worksheet,
  onBack,
  onSave,
  isSaved = false,
}) => {
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [saved, setSaved] = useState(isSaved);

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    onSave(worksheet);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      {/* Action Toolbar (Hidden during print) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ย้อนกลับไปแก้ไข</span>
        </button>

        {/* View Switcher: Student vs Teacher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setShowAnswerKey(false)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              !showAnswerKey ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ใบงานนักเรียน
          </button>
          <button
            onClick={() => setShowAnswerKey(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              showAnswerKey ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>ใบเฉลยสำหรับครู</span>
          </button>
        </div>

        {/* Print & Save Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saved}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
              saved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {saved ? <BookmarkCheck className="w-4 h-4 text-emerald-600" /> : <Bookmark className="w-4 h-4" />}
            <span>{saved ? 'บันทึกแล้ว' : 'บันทึกลงคลัง'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ / PDF (A4)</span>
          </button>
        </div>
      </div>

      {/* A4 Printable Sheet Container */}
      <div className="a4-page p-8 sm:p-12 border border-slate-200 rounded-sm">
        {/* Header Metadata */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                กลุ่มสาระการเรียนรู้{worksheet.subject} • ระดับชั้น{worksheet.grade}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 mt-1">
                {worksheet.title} {showAnswerKey && <span className="text-blue-600 text-lg font-normal">(ฉบับเฉลย)</span>}
              </h1>
            </div>
            {/* Score Box */}
            <div className="border border-slate-400 rounded px-3 py-1 text-center min-w-[70px]">
              <span className="text-[10px] text-slate-500 block">คะแนนที่ได้</span>
              <span className="text-sm font-bold">...... / {worksheet.items.length}</span>
            </div>
          </div>

          {/* Student Info Line */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs sm:text-sm text-slate-700 pt-2 border-t border-slate-200">
            <div className="sm:col-span-5">ชื่อ-นามสกุล: ..............................................................</div>
            <div className="sm:col-span-3">ชั้น: ..................... เลขที่: .........</div>
            <div className="sm:col-span-4">วันที่: .........................................</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-3 bg-slate-50 border-l-4 border-blue-600 rounded-r text-xs sm:text-sm text-slate-700">
          <span className="font-semibold text-slate-900">คำชี้แจง: </span>
          {worksheet.instruction}
          {worksheet.headerNote && (
            <span className="text-slate-500 ml-2 italic">({worksheet.headerNote})</span>
          )}
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {worksheet.items.map((item, index) => (
            <div key={item.id || index} className="space-y-2 text-sm sm:text-base leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900 min-w-[24px]">{index + 1}.</span>
                <span className="text-slate-800 flex-1">{item.question}</span>
              </div>

              {/* Choices (Multiple Choice) */}
              {item.options && item.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7 mt-2">
                  {item.options.map((opt, optIdx) => {
                    const choiceLabels = ['ก.', 'ข.', 'ค.', 'ง.', 'จ.'];
                    const label = choiceLabels[optIdx] || `${optIdx + 1}.`;
                    const isCorrectAnswer =
                      showAnswerKey &&
                      (item.answer?.includes(label) ||
                        item.answer?.trim() === opt.trim() ||
                        item.answer?.startsWith(label.replace('.', '')));

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-start gap-2 p-1.5 rounded transition-colors ${
                          isCorrectAnswer
                            ? 'bg-emerald-50 text-emerald-900 font-medium ring-1 ring-emerald-300'
                            : 'text-slate-700'
                        }`}
                      >
                        <span className="font-semibold text-slate-600 min-w-[20px]">{label}</span>
                        <span>{opt}</span>
                        {isCorrectAnswer && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Fill in the blank format */}
              {worksheet.sheetType === 'fill' && !item.options && (
                <div className="pl-7 mt-2 text-slate-600">
                  <span>ตอบ: </span>
                  {showAnswerKey ? (
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {item.answer}
                    </span>
                  ) : (
                    <span className="tracking-widest">....................................................................................</span>
                  )}
                </div>
              )}

              {/* True/False format */}
              {worksheet.sheetType === 'truefalse' && (
                <div className="pl-7 flex items-center gap-6 mt-1 text-xs sm:text-sm text-slate-600">
                  <label className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full border border-slate-400 inline-block"></span>
                    <span>ถูก</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full border border-slate-400 inline-block"></span>
                    <span>ผิด</span>
                  </label>
                  {showAnswerKey && (
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      เฉลย: {item.answer}
                    </span>
                  )}
                </div>
              )}

              {/* Q&A / Short Answer format */}
              {worksheet.sheetType === 'qa' && (
                <div className="pl-7 space-y-1.5 pt-1">
                  {showAnswerKey ? (
                    <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900">
                      <span className="font-bold">แนวคำตอบ: </span>
                      {item.answer}
                    </div>
                  ) : (
                    <div className="space-y-2 text-slate-400">
                      <div className="border-b border-dotted border-slate-400 h-5"></div>
                      <div className="border-b border-dotted border-slate-400 h-5"></div>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation in Teacher View */}
              {showAnswerKey && item.explanation && (
                <div className="ml-7 mt-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="font-semibold text-slate-700">💡 อธิบายเพิ่มเติม: </span>
                  {item.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-slate-200 flex justify-between text-xs text-slate-400">
          <span>สร้างด้วย AI-EXAM (Gemini) • หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน</span>
          <span>หน้า 1 / 1</span>
        </div>
      </div>
    </div>
  );
};

