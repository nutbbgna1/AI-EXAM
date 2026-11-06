import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { WorksheetGenerator } from './components/WorksheetGenerator';
import { ExamGenerator } from './components/ExamGenerator';
import { LessonPlanGenerator } from './components/LessonPlanGenerator';
import { SavedBank } from './components/SavedBank';
import { SettingsModal } from './components/SettingsModal';
import { WorksheetPreview } from './components/WorksheetPreview';
import { Worksheet, Exam, LessonPlan } from './types';
import { getStoredApiKey, setStoredApiKey } from './services/gemini';
import { Key, Sparkles, Printer, ArrowLeft } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'worksheet' | 'exam' | 'lessonplan' | 'saved'>('worksheet');
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Saved Items State
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);

  // Item previewed from SavedBank
  const [viewingWorksheet, setViewingWorksheet] = useState<Worksheet | null>(null);
  const [viewingExam, setViewingExam] = useState<Exam | null>(null);
  const [viewingPlan, setViewingPlan] = useState<LessonPlan | null>(null);

  // Load API Key & Saved Data from localStorage
  useEffect(() => {
    const key = getStoredApiKey();
    setApiKey(key);

    const savedModel = localStorage.getItem('gemini_selected_model');
    if (savedModel) setSelectedModel(savedModel);

    try {
      const storedWs = localStorage.getItem('ai_exam_worksheets');
      if (storedWs) setWorksheets(JSON.parse(storedWs));

      const storedEx = localStorage.getItem('ai_exam_exams');
      if (storedEx) setExams(JSON.parse(storedEx));

      const storedLp = localStorage.getItem('ai_exam_plans');
      if (storedLp) setLessonPlans(JSON.parse(storedLp));
    } catch (e) {
      console.error('Failed to parse stored items', e);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    setStoredApiKey(key);
  };

  const handleSelectModel = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('gemini_selected_model', model);
  };

  // Worksheet Handlers
  const handleSaveWorksheet = (ws: Worksheet) => {
    const updated = [ws, ...worksheets.filter((w) => w.id !== ws.id)];
    setWorksheets(updated);
    localStorage.setItem('ai_exam_worksheets', JSON.stringify(updated));
  };

  const handleDeleteWorksheet = (id: string) => {
    const updated = worksheets.filter((w) => w.id !== id);
    setWorksheets(updated);
    localStorage.setItem('ai_exam_worksheets', JSON.stringify(updated));
    if (viewingWorksheet?.id === id) setViewingWorksheet(null);
  };

  // Exam Handlers
  const handleSaveExam = (ex: Exam) => {
    const updated = [ex, ...exams.filter((e) => e.id !== ex.id)];
    setExams(updated);
    localStorage.setItem('ai_exam_exams', JSON.stringify(updated));
  };

  const handleDeleteExam = (id: string) => {
    const updated = exams.filter((e) => e.id !== id);
    setExams(updated);
    localStorage.setItem('ai_exam_exams', JSON.stringify(updated));
    if (viewingExam?.id === id) setViewingExam(null);
  };

  // Plan Handlers
  const handleSavePlan = (lp: LessonPlan) => {
    const updated = [lp, ...lessonPlans.filter((l) => l.id !== lp.id)];
    setLessonPlans(updated);
    localStorage.setItem('ai_exam_plans', JSON.stringify(updated));
  };

  const handleDeletePlan = (id: string) => {
    const updated = lessonPlans.filter((l) => l.id !== id);
    setLessonPlans(updated);
    localStorage.setItem('ai_exam_plans', JSON.stringify(updated));
    if (viewingPlan?.id === id) setViewingPlan(null);
  };

  const handleImportData = (data: { worksheets: Worksheet[]; exams: Exam[]; lessonPlans: LessonPlan[] }) => {
    setWorksheets(data.worksheets);
    setExams(data.exams);
    setLessonPlans(data.lessonPlans);
    localStorage.setItem('ai_exam_worksheets', JSON.stringify(data.worksheets));
    localStorage.setItem('ai_exam_exams', JSON.stringify(data.exams));
    localStorage.setItem('ai_exam_plans', JSON.stringify(data.lessonPlans));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(t) => {
          setViewingWorksheet(null);
          setViewingExam(null);
          setViewingPlan(null);
          setActiveTab(t);
        }}
        openSettings={() => setIsSettingsOpen(true)}
        hasApiKey={Boolean(apiKey)}
        selectedModel={selectedModel}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner if API Key is not set */}
        {!apiKey && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm no-print">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">ยังไม่ได้ตั้งค่า Google Gemini API Key</p>
                <p className="text-xs text-amber-700">
                  กรุณาใส่ API Key จาก Google AI Studio เพื่อเริ่มสร้างใบงานและข้อสอบอัตโนมัติ
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              ตั้งค่า API Key ทันที
            </button>
          </div>
        )}

        {/* Viewing single worksheet from Bank */}
        {viewingWorksheet ? (
          <WorksheetPreview
            worksheet={viewingWorksheet}
            onBack={() => setViewingWorksheet(null)}
            onSave={handleSaveWorksheet}
            isSaved={true}
          />
        ) : viewingExam ? (
          /* Viewing single Exam from Bank */
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between no-print">
              <button
                onClick={() => setViewingExam(null)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับไปคลัง</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ข้อสอบ (A4)</span>
              </button>
            </div>

            <div className="a4-page p-8 sm:p-12 border border-slate-200 rounded-sm">
              <div className="border-b-2 border-slate-800 pb-3 mb-6 text-center">
                <h1 className="text-2xl font-bold font-heading">{viewingExam.title}</h1>
                <p className="text-sm text-slate-600 mt-1">
                  วิชา{viewingExam.subject} ชั้น{viewingExam.grade} • {viewingExam.questions.length} ข้อ เวลา {viewingExam.timeMinutes} นาที
                </p>
              </div>
              <div className="space-y-5 text-sm">
                {viewingExam.questions.map((q, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="font-medium">
                      {idx + 1}. {q.question}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 pl-4 text-xs">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx}>
                          <span className="font-semibold">{['ก.', 'ข.', 'ค.', 'ง.'][oIdx]} </span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : viewingPlan ? (
          /* Viewing single Lesson Plan from Bank */
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between no-print">
              <button
                onClick={() => setViewingPlan(null)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับไปคลัง</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์แผนการสอน (A4)</span>
              </button>
            </div>

            <div className="a4-page p-8 sm:p-12 border border-slate-200 rounded-sm space-y-6">
              <div className="border-b-2 border-slate-800 pb-4 text-center">
                <h1 className="text-2xl font-bold font-heading">{viewingPlan.title}</h1>
                <p className="text-sm text-slate-600 mt-1">
                  วิชา{viewingPlan.subject} ชั้น{viewingPlan.grade} • เวลา {viewingPlan.durationHours} ชั่วโมง
                </p>
              </div>
              {viewingPlan.standards && (
                <div>
                  <h2 className="font-bold text-slate-900 mb-1">มาตรฐานการเรียนรู้และตัวชี้วัด</h2>
                  <p className="text-sm text-slate-700 pl-4">{viewingPlan.standards}</p>
                </div>
              )}
              {viewingPlan.essentialConcept && (
                <div>
                  <h2 className="font-bold text-slate-900 mb-1">สาระสำคัญ / ความคิดรวบยอด</h2>
                  <p className="text-sm text-slate-700 pl-4">{viewingPlan.essentialConcept}</p>
                </div>
              )}
              <div>
                <h2 className="font-bold text-slate-900 mb-1">จุดประสงค์การเรียนรู้ (K-P-A)</h2>
                <div className="pl-4 text-sm space-y-1">
                  {viewingPlan.objectives.k.map((k, i) => (
                    <div key={i}><b className="text-blue-700">K:</b> {k}</div>
                  ))}
                  {viewingPlan.objectives.p.map((p, i) => (
                    <div key={i}><b className="text-emerald-700">P:</b> {p}</div>
                  ))}
                  {viewingPlan.objectives.a.map((a, i) => (
                    <div key={i}><b className="text-purple-700">A:</b> {a}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Normal Tab Content */
          <>
            {activeTab === 'worksheet' && (
              <WorksheetGenerator
                apiKey={apiKey}
                selectedModel={selectedModel}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onSaveWorksheet={handleSaveWorksheet}
              />
            )}

            {activeTab === 'exam' && (
              <ExamGenerator
                apiKey={apiKey}
                selectedModel={selectedModel}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onSaveExam={handleSaveExam}
              />
            )}

            {activeTab === 'lessonplan' && (
              <LessonPlanGenerator
                apiKey={apiKey}
                selectedModel={selectedModel}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onSavePlan={handleSavePlan}
              />
            )}

            {activeTab === 'saved' && (
              <SavedBank
                worksheets={worksheets}
                exams={exams}
                lessonPlans={lessonPlans}
                onSelectWorksheet={(w) => setViewingWorksheet(w)}
                onSelectExam={(e) => setViewingExam(e)}
                onSelectPlan={(p) => setViewingPlan(p)}
                onDeleteWorksheet={handleDeleteWorksheet}
                onDeleteExam={handleDeleteExam}
                onDeletePlan={handleDeletePlan}
                onImportData={handleImportData}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400 no-print">
        <p>AI-EXAM: ระบบสร้างสื่อการเรียนการสอนและข้อสอบอัตโนมัติด้วย Google Gemini</p>
        <p className="mt-1">รองรับ Google AI Studio (Build Mode), Google Project IDX และการใช้งานบนเบราว์เซอร์</p>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
      />
    </div>
  );
};

