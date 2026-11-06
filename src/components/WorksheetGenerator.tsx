import React, { useState } from 'react';
import { CURRICULUM } from '../data/curriculum';
import { SheetType, DifficultyLevel, Worksheet } from '../types';
import { generateWorksheet } from '../services/gemini';
import { WorksheetPreview } from './WorksheetPreview';
import { Sparkles, Loader2, BookOpen, AlertCircle } from 'lucide-react';

interface WorksheetGeneratorProps {
  apiKey: string;
  selectedModel: string;
  onOpenSettings: () => void;
  onSaveWorksheet: (ws: Worksheet) => void;
}

const GRADES = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];

export const WorksheetGenerator: React.FC<WorksheetGeneratorProps> = ({
  apiKey,
  selectedModel,
  onOpenSettings,
  onSaveWorksheet,
}) => {
  const [grade, setGrade] = useState<string>('ป.4');
  const [subject, setSubject] = useState<string>('วิทยาศาสตร์และเทคโนโลยี');
  const [topic, setTopic] = useState<string>('หน้าที่และส่วนประกอบของพืชดอก');
  const [sheetType, setSheetType] = useState<SheetType>('choice');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [itemCount, setItemCount] = useState<number>(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedWorksheet, setGeneratedWorksheet] = useState<Worksheet | null>(null);

  // Available subjects for the current grade from curriculum
  const availableSubjects = Object.keys(CURRICULUM[grade] || {});

  // Available topics for current grade and subject
  const currentTopics = CURRICULUM[grade]?.[subject] || [];

  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    const subjects = Object.keys(CURRICULUM[newGrade] || {});
    if (subjects.length > 0) {
      const nextSubject = subjects.includes(subject) ? subject : subjects[0];
      setSubject(nextSubject);
      const topics = CURRICULUM[newGrade]?.[nextSubject] || [];
      if (topics.length > 0) {
        setTopic(topics[0][1]);
      }
    }
  };

  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject);
    const topics = CURRICULUM[grade]?.[newSubject] || [];
    if (topics.length > 0) {
      setTopic(topics[0][1]);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      onOpenSettings();
      return;
    }
    if (!topic.trim()) {
      setError('กรุณาระบุหัวข้อเรื่องที่ต้องการสร้าง');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateWorksheet({
        grade,
        subject,
        topic,
        sheetType,
        difficulty,
        itemCount,
        model: selectedModel,
        apiKey,
      });
      setGeneratedWorksheet(result);
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการสร้างใบงาน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  if (generatedWorksheet) {
    return (
      <WorksheetPreview
        worksheet={generatedWorksheet}
        onBack={() => setGeneratedWorksheet(null)}
        onSave={onSaveWorksheet}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-slate-900">สร้างใบงานแบบฝึกหัด (AI Worksheet)</h2>
            <p className="text-sm text-slate-500">
              สร้างใบงานมาตรฐานตามหลักสูตรแกนกลางฯ พร้อมเฉลยละเอียดและแบบพิมพ์ A4
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">ไม่สามารถสร้างใบงานได้</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Grade & Subject Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ระดับชั้น</label>
              <select
                value={grade}
                onChange={(e) => handleGradeChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm bg-white"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    ชั้น {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">กลุ่มสาระ / วิชา</label>
              <select
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm bg-white"
              >
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic & Suggestions */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">หัวข้อ / เรื่องที่ต้องการสอน</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="เช่น การสังเคราะห์ด้วยแสง, คำสมาสสนธิ, สมการเชิงเส้นตัวแปรเดียว"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
              required
            />

            {/* Quick Chips from Curriculum */}
            {currentTopics.length > 0 && (
              <div className="mt-2.5">
                <span className="text-xs text-slate-500 flex items-center gap-1 mb-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> หัวข้อตัวอย่างตามหลักสูตร {grade}:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {currentTopics.slice(0, 10).map((t, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setTopic(t[1])}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        topic === t[1]
                          ? 'bg-blue-50 text-blue-700 border-blue-300 font-medium'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t[1]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sheet Type & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">รูปแบบข้อสอบ</label>
              <select
                value={sheetType}
                onChange={(e) => setSheetType(e.target.value as SheetType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm bg-white"
              >
                <option value="choice">ปรนัย (4 ตัวเลือก)</option>
                <option value="fill">เติมคำในช่องว่าง</option>
                <option value="truefalse">ถูก หรือ ผิด</option>
                <option value="qa">ตอบคำถามสั้น / อัตนัย</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ระดับความยาก</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm bg-white"
              >
                <option value="easy">ง่าย (ความจำ/พื้นฐาน)</option>
                <option value="medium">ปานกลาง (ความเข้าใจ/ประยุกต์)</option>
                <option value="hard">ท้าทาย (แก้โจทย์ซับซ้อน)</option>
                <option value="analytical">คิดวิเคราะห์ขั้นสูง</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">จำนวนข้อ</label>
              <select
                value={itemCount}
                onChange={(e) => setItemCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm bg-white"
              >
                <option value={3}>3 ข้อ (กระชับ/ทดสอบย่อย)</option>
                <option value={5}>5 ข้อ (แนะนำ 1 หน้า A4)</option>
                <option value={8}>8 ข้อ</option>
                <option value={10}>10 ข้อ</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-heading font-medium text-base text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Gemini กำลังร่างใบงานและเฉลย...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>สร้างใบงานด้วย AI (Gemini)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
