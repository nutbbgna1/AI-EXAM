import React from 'react';
import { FileText, Award, BookOpen, Archive, Settings, Sparkles, Key } from 'lucide-react';

interface NavbarProps {
  activeTab: 'worksheet' | 'exam' | 'lessonplan' | 'saved';
  setActiveTab: (tab: 'worksheet' | 'exam' | 'lessonplan' | 'saved') => void;
  openSettings: () => void;
  hasApiKey: boolean;
  selectedModel: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openSettings,
  hasApiKey,
  selectedModel
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-xl text-slate-900 tracking-tight">AI-EXAM</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Gemini
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">ระบบสร้างใบงาน ข้อสอบ และแผนการสอนอัจฉริยะ</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('worksheet')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'worksheet'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>สร้างใบงาน</span>
            </button>

            <button
              onClick={() => setActiveTab('exam')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'exam'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>สร้างข้อสอบ</span>
            </button>

            <button
              onClick={() => setActiveTab('lessonplan')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'lessonplan'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>แผนการสอน</span>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'saved'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span className="hidden md:inline">คลังของฉัน</span>
            </button>
          </nav>

          {/* Right Action: Settings */}
          <div className="flex items-center gap-2">
            <button
              onClick={openSettings}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                hasApiKey
                  ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 animate-pulse'
              }`}
              title="ตั้งค่า API Key และโมเดล"
            >
              {hasApiKey ? <Settings className="w-4 h-4 text-slate-500" /> : <Key className="w-4 h-4 text-amber-600" />}
              <span className="hidden lg:inline">{hasApiKey ? selectedModel : 'ใส่ API Key'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
