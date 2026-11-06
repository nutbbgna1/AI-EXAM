import React, { useState } from 'react';
import { CURRICULUM } from '../data/curriculum';
import { Exam, ExamQuestion } from '../types';
import { generateExam } from '../services/gemini';
import { Award, Sparkles, Loader2, Printer, CheckCircle2, XCircle, ArrowLeft, RotateCcw, Bookmark, BookmarkCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExamGeneratorProps {
  apiKey: string;
  selectedModel: string;
  onOpenSettings: () => void;
  onSaveExam: (exam: Exam) => void;
}

const GRADES = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];

export const ExamGenerator: React.FC<ExamGeneratorProps> = ({
  apiKey,
  selectedModel,
  onOpenSettings,
  onSaveExam,
}) => {
  const [grade, setGrade] = useState('ม.1');
  const [subject, setSubject] = useState('วิทยาศาสตร์และเทคโนโลยี');
  const [topic, setTopic] = useState('เซลล์และการลำเลียงสารผ่านเซลล์');
  const [examType, setExamType] = useState<'pre' | 'post' | 'midterm' | 'final'>('midterm');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timeMinutes, setTimeMinutes] = useState<number>(30);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedExam, setGeneratedExam] = useState<Exam | null>(null);

  // Interactive Quiz States
  const [mode, setMode] = useState<'interactive' | 'print'>('interactive');
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
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
    setUserAnswers({});
    setSubmitted(false);
    setSaved(false);

    try {
      const exam = await generateExam({
        grade,
        subject,
        topic,
        examType,
        questionCount,
        timeMinutes,
        model: selectedModel,
        apiKey,
      });
      setGeneratedExam(exam);
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการสร้างข้อสอบ');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (qIndex: number, optIndex: number) => {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const calculateScore = () => {
    if (!generatedExam) return 0;
    return generatedExam.questions.reduce((score, q, idx) => {
      return userAnswers[idx] === q.correctIndex ? score + 1 : score;
    }, 0);
  };

  const handleSubmitQuiz = () => {
    setSubmitted(true);
    const score = calculateScore();
    const total = generatedExam?.questions.length || 1;
    if (score / total >= 0.7) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleSave = () => {
    if (generatedExam) {
      onSaveExam(generatedExam);
      setSaved(true);
    }
  };

  if (generatedExam) {
    const score = calculateScore();
    const total = generatedExam.questions.length;
    const answeredCount = Object.keys(userAnswers).length;

    return (
      <div className="space-y-6">
        {/* Action Header (Hidden on print) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 no-print">
          <button
            onClick={() => setGeneratedExam(null)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ย้อนกลับไปตั้งค่า</span>
          </button>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setMode('interactive')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                mode === 'interactive' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              โหมดทำข้อสอบออนไลน์
            </button>
            <button
              onClick={() => setMode('print')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                mode === 'print' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              โหมดเอกสารพิมพ์ A4
            </button>
          </div>

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
              <span>พิมพ์ข้อสอบ (A4)</span>
            </button>
          </div>
        </div>

        {/* INTERACTIVE MODE */}
        {mode === 'interactive' && (
          <div className="max-w-3xl mx-auto space-y-6 no-print">
            {/* Exam Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/10">
              <span className="text-xs font-semibold px-2.5 py-1 bg-white/20 rounded-full uppercase tracking-wider">
                {generatedExam.subject} • {generatedExam.grade}
              </span>
              <h2 className="text-2xl font-bold font-heading mt-2">{generatedExam.title}</h2>
              <div className="flex items-center gap-4 text-xs text-blue-100 mt-2">
                <span>จำนวน {total} ข้อ</span>
                <span>เวลาสอบ {generatedExam.timeMinutes} นาที</span>
              </div>
            </div>

            {/* Score Result Card when submitted */}
            {submitted && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center animate-in fade-in slide-in-from-top-4">
                <div className="text-4xl font-extrabold font-heading text-blue-600 mb-1">
                  {score} / {total}
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  {score / total >= 0.8
                    ? '🎉 ยอดเยี่ยมมาก! คุณทำคะแนนได้ดีเยี่ยม'
                    : score / total >= 0.5
                    ? '👍 ดีมาก! คุณผ่านเกณฑ์การประเมิน'
                    : '📖 พยายามอีกนิด ทบทวนคำอธิบายเฉลยด้านล่างได้เลย'}
                </p>
                <button
                  onClick={() => {
                    setUserAnswers({});
                    setSubmitted(false);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ลองทำใหม่อีกครั้ง</span>
                </button>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {generatedExam.questions.map((q, idx) => {
                const selectedOpt = userAnswers[idx];
                const isCorrect = selectedOpt === q.correctIndex;
                const choiceLabels = ['ก.', 'ข.', 'ค.', 'ง.'];

                return (
                  <div
                    key={q.id || idx}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-base font-medium text-slate-900 leading-relaxed">{q.question}</p>
                        {q.indicator && (
                          <span className="text-[11px] text-slate-400 mt-0.5 inline-block">
                            ตัวชี้วัด: {q.indicator}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 gap-2.5 pl-10">
                      {q.options.map((opt, optIdx) => {
                        const isChosen = selectedOpt === optIdx;
                        let optionStyle =
                          'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50';

                        if (submitted) {
                          if (optIdx === q.correctIndex) {
                            optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-medium ring-1 ring-emerald-400';
                          } else if (isChosen) {
                            optionStyle = 'border-rose-400 bg-rose-50 text-rose-900 font-medium';
                          } else {
                            optionStyle = 'border-slate-100 opacity-60';
                          }
                        } else if (isChosen) {
                          optionStyle = 'border-blue-600 bg-blue-50 text-blue-900 font-medium ring-1 ring-blue-500';
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectAnswer(idx, optIdx)}
                            className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all ${optionStyle}`}
                          >
                            <span className="font-semibold text-xs sm:text-sm min-w-[20px] text-slate-500">
                              {choiceLabels[optIdx]}
                            </span>
                            <span className="text-sm flex-1">{opt}</span>
                            {submitted && optIdx === q.correctIndex && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            )}
                            {submitted && isChosen && !isCorrect && (
                              <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {submitted && (
                      <div className="pl-10 pt-2">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                          <span className="font-bold text-slate-900">เฉลยละเอียด: </span>
                          {q.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit Quiz Bar */}
            {!submitted && (
              <div className="sticky bottom-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  ตอบแล้ว {answeredCount} จาก {total} ข้อ
                </span>
                <button
                  onClick={handleSubmitQuiz}
                  disabled={answeredCount === 0}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-500/20 transition-all"
                >
                  ส่งคำตอบและตรวจคะแนน
                </button>
              </div>
            )}
          </div>
        )}

        {/* PRINT A4 MODE */}
        {(mode === 'print' || typeof window !== 'undefined') && (
          <div className={mode === 'interactive' ? 'print-only' : 'block'}>
            <div className="a4-page p-8 sm:p-12 border border-slate-200 rounded-sm">
              <div className="border-b-2 border-slate-800 pb-3 mb-6">
                <div className="text-center">
                  <h1 className="text-xl sm:text-2xl font-bold font-heading">{generatedExam.title}</h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    วิชา{generatedExam.subject} ชั้น{generatedExam.grade} • จำนวน {total} ข้อ เวลาสอบ {generatedExam.timeMinutes} นาที
                  </p>
                </div>
                <div className="grid grid-cols-12 gap-2 text-xs sm:text-sm pt-3 mt-3 border-t border-slate-200">
                  <div className="col-span-6">ชื่อ-นามสกุล: ................................................................</div>
                  <div className="col-span-3">ชั้น: ........... เลขที่: ......</div>
                  <div className="col-span-3">คะแนน: ...... / {total}</div>
                </div>
              </div>

              <div className="space-y-5 text-sm">
                {generatedExam.questions.map((q, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="font-medium">
                      <span>{idx + 1}. </span>
                      <span>{q.question}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-5 text-xs sm:text-sm">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx}>
                          <span className="font-semibold text-slate-700">
                            {['ก.', 'ข.', 'ค.', 'ง.'][optIdx]}{' '}
                          </span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Answer Key Page Break for print */}
              <div className="mt-12 pt-8 border-t-2 border-dashed border-slate-300 page-break-after">
                <h2 className="text-lg font-bold font-heading mb-4 text-center">เฉลยแบบทดสอบและคำอธิบาย</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {generatedExam.questions.map((q, idx) => (
                    <div key={idx} className="p-2 border border-slate-200 rounded">
                      <span className="font-bold text-blue-700">
                        ข้อ {idx + 1}: ตอบ {['ก.', 'ข.', 'ค.', 'ง.'][q.correctIndex]}
                      </span>
                      <p className="text-slate-600 mt-0.5">{q.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-slate-900">สร้างชุดข้อสอบมาตรฐาน (AI Exam)</h2>
            <p className="text-sm text-slate-500">
              สร้างข้อสอบแบบเลือกตอบ (ปรนัย 4 ตัวเลือก) ตรงตามตัวชี้วัด พร้อมเฉลยละเอียดและโหมดสอบออนไลน์
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">เรื่อง / หน่วยการเรียนรู้</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="เช่น การลำเลียงสารในสิ่งมีชีวิต, ระบบสุริยะ, คำเชื่อมและประโยคความรวม"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ประเภทแบบทดสอบ</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="pre">แบบทดสอบก่อนเรียน (Pre-test)</option>
                <option value="post">แบบทดสอบหลังเรียน (Post-test)</option>
                <option value="midterm">ข้อสอบวัดผลกลางภาค (Midterm)</option>
                <option value="final">ข้อสอบวัดผลปลายภาค (Final)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">จำนวนข้อ</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value={5}>5 ข้อ (ทดสอบย่อย)</option>
                <option value={10}>10 ข้อ (แนะนำ)</option>
                <option value={15}>15 ข้อ</option>
                <option value={20}>20 ข้อ (ฉบับเต็ม)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">เวลาในการสอบ (นาที)</label>
              <input
                type="number"
                min={5}
                max={180}
                value={timeMinutes}
                onChange={(e) => setTimeMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-heading font-medium text-base text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Gemini กำลังร่างข้อสอบและเฉลยละเอียด...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>สร้างชุดข้อสอบด้วย AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
