import React, { useState } from 'react';
import { CURRICULUM } from '../data/curriculum';
import { LessonPlan } from '../types';
import { generateLessonPlan } from '../services/gemini';
import { BookOpen, Sparkles, Loader2, Printer, ArrowLeft, Bookmark, BookmarkCheck } from 'lucide-react';

interface LessonPlanGeneratorProps {
  apiKey: string;
  selectedModel: string;
  onOpenSettings: () => void;
  onSavePlan: (plan: LessonPlan) => void;
}

const GRADES = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];

export const LessonPlanGenerator: React.FC<LessonPlanGeneratorProps> = ({
  apiKey,
  selectedModel,
  onOpenSettings,
  onSavePlan,
}) => {
  const [grade, setGrade] = useState('ป.5');
  const [subject, setSubject] = useState('วิทยาศาสตร์และเทคโนโลยี');
  const [topic, setTopic] = useState('แรงเสียดทานและการเคลื่อนที่ของวัตถุ');
  const [durationHours, setDurationHours] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<LessonPlan | null>(null);
  const [saved, setSaved] = useState(false);

  const availableSubjects = Object.keys(CURRICULUM[grade] || {});

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      onOpenSettings();
      return;
    }

    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const plan = await generateLessonPlan({
        grade,
        subject,
        topic,
        durationHours,
        model: selectedModel,
        apiKey,
      });
      setGeneratedPlan(plan);
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการสร้างแผนการสอน');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (generatedPlan) {
      onSavePlan(generatedPlan);
      setSaved(true);
    }
  };

  if (generatedPlan) {
    return (
      <div className="space-y-6">
        {/* Action Header */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between no-print">
          <button
            onClick={() => setGeneratedPlan(null)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ย้อนกลับไปแก้ไข</span>
          </button>

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
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์แผนการสอน (A4)</span>
            </button>
          </div>
        </div>

        {/* A4 Sheet Container */}
        <div className="a4-page p-8 sm:p-12 border border-slate-200 rounded-sm space-y-6">
          <div className="border-b-2 border-slate-800 pb-4 text-center">
            <h1 className="text-xl sm:text-2xl font-bold font-heading">{generatedPlan.title}</h1>
            <p className="text-sm text-slate-600 mt-1">
              กลุ่มสาระการเรียนรู้{generatedPlan.subject} ชั้น{generatedPlan.grade} • เวลา {generatedPlan.durationHours} ชั่วโมง
            </p>
          </div>

          {/* Standards */}
          {generatedPlan.standards && (
            <div className="space-y-1.5">
              <h2 className="font-heading font-bold text-slate-900 text-base">๑. มาตรฐานการเรียนรู้และตัวชี้วัด</h2>
              <p className="text-sm text-slate-700 pl-4 leading-relaxed">{generatedPlan.standards}</p>
            </div>
          )}

          {/* Essential Concept */}
          {generatedPlan.essentialConcept && (
            <div className="space-y-1.5">
              <h2 className="font-heading font-bold text-slate-900 text-base">๒. สาระสำคัญ / ความคิดรวบยอด</h2>
              <p className="text-sm text-slate-700 pl-4 leading-relaxed">{generatedPlan.essentialConcept}</p>
            </div>
          )}

          {/* Objectives K P A */}
          <div className="space-y-2">
            <h2 className="font-heading font-bold text-slate-900 text-base">๓. จุดประสงค์การเรียนรู้ (K-P-A)</h2>
            <div className="pl-4 space-y-1 text-sm text-slate-700">
              {generatedPlan.objectives.k.map((k, idx) => (
                <div key={idx}><span className="font-medium text-blue-700">• ด้านความรู้ (K): </span>{k}</div>
              ))}
              {generatedPlan.objectives.p.map((p, idx) => (
                <div key={idx}><span className="font-medium text-emerald-700">• ด้านทักษะ/กระบวนการ (P): </span>{p}</div>
              ))}
              {generatedPlan.objectives.a.map((a, idx) => (
                <div key={idx}><span className="font-medium text-purple-700">• ด้านคุณลักษณะ (A): </span>{a}</div>
              ))}
            </div>
          </div>

          {/* Learning Activities */}
          <div className="space-y-2">
            <h2 className="font-heading font-bold text-slate-900 text-base">๔. กิจกรรมการเรียนรู้ (Active Learning)</h2>
            <div className="pl-4 space-y-3 text-sm text-slate-700">
              <div>
                <span className="font-semibold text-slate-900 block mb-1">๔.๑ ขั้นนำเข้าสู่บทเรียน:</span>
                <ul className="list-disc pl-5 space-y-1">
                  {generatedPlan.activities.intro.map((act, idx) => (
                    <li key={idx}>{act}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-semibold text-slate-900 block mb-1">๔.๒ ขั้นจัดกิจกรรมการเรียนรู้:</span>
                <ul className="list-disc pl-5 space-y-1">
                  {generatedPlan.activities.teaching.map((act, idx) => (
                    <li key={idx}>{act}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-semibold text-slate-900 block mb-1">๔.๓ ขั้นสรุป:</span>
                <ul className="list-disc pl-5 space-y-1">
                  {generatedPlan.activities.conclusion.map((act, idx) => (
                    <li key={idx}>{act}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Materials & Evaluation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <h2 className="font-heading font-bold text-slate-900 text-base">๕. สื่อและแหล่งการเรียนรู้</h2>
              <ul className="list-disc pl-6 text-sm text-slate-700 space-y-1">
                {generatedPlan.materials.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <h2 className="font-heading font-bold text-slate-900 text-base">๖. การวัดและประเมินผล</h2>
              <ul className="list-disc pl-6 text-sm text-slate-700 space-y-1">
                {generatedPlan.evaluation.map((ev, idx) => (
                  <li key={idx}>{ev}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-slate-900">สร้างแผนการจัดการเรียนรู้ (AI Lesson Plan)</h2>
            <p className="text-sm text-slate-500">
              สร้างแผนการสอนเชิงรุก (Active Learning) ตรงตามมาตรฐาน K-P-A และโครงสร้าง สพฐ.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ระดับชั้น</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
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
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">หัวข้อ / เรื่องที่สอน</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="เช่น การสังเคราะห์ด้วยแสง, สถิติเบื้องต้น, การแต่งบทร้อยกรอง"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ระยะเวลา (ชั่วโมง)</label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value={1}>1 คาบ (50-60 นาที)</option>
                <option value={2}>2 คาบ (บล็อก 2 ชม.)</option>
                <option value={3}>3 คาบ</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-heading font-medium text-base text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Gemini กำลังร่างแผนการจัดการเรียนรู้เชิงรุก...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>สร้างแผนการสอนด้วย AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
