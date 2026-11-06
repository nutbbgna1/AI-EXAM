import React, { useState } from 'react';
import { X, Key, CheckCircle, AlertCircle, ExternalLink, Cpu, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  selectedModel,
  onSelectModel,
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [currentModel, setCurrentModel] = useState(selectedModel);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!inputKey.trim()) {
      setTestResult({ ok: false, msg: 'กรุณากรอก API Key ก่อนทดสอบ' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: inputKey.trim() });
      const res = await ai.models.generateContent({
        model: currentModel,
        contents: 'ตอบสั้นๆ ว่า "เชื่อมต่อสำเร็จ"',
      });
      if (res.text) {
        setTestResult({ ok: true, msg: 'เชื่อมต่อกับ Google Gemini สำเร็จเรียบร้อย!' });
      } else {
        setTestResult({ ok: false, msg: 'ไม่ได้รับข้อความตอบกลับจากโมเดล' });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        msg: err?.message || 'การเชื่อมต่อล้มเหลว ตรวจสอบความถูกต้องของ API Key'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveApiKey(inputKey.trim());
    onSelectModel(currentModel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            <h3 className="font-heading font-semibold text-lg text-slate-900">ตั้งค่า AI & การเชื่อมต่อ</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* API Key section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-slate-400" />
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                รับ API Key ฟรี <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AQ... หรือ AIza..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              คีย์จะถูกบันทึกใน LocalStorage ของเบราว์เซอร์เครื่องนี้อย่างปลอดภัย และไม่ถูกส่งไปที่เซิร์ฟเวอร์อื่น
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              โมเดล Gemini เริ่มต้น
            </label>
            <select
              value={currentModel}
              onChange={(e) => setCurrentModel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm bg-white"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (แนะนำ: รวดเร็ว แม่นยำ และประหยัด)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (ฉลาดที่สุด สำหรับโจทย์ซับซ้อนและคิดวิเคราะห์)</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (เสถียร รองรับมาตรฐาน)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (โมเดล Pro รุ่นมาตรฐาน)</option>
            </select>
          </div>

          {/* Test connection status */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 ${
                testResult.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <span>{testResult.msg}</span>
            </div>
          )}

          {/* Test & Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !inputKey.trim()}
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>ทดสอบการเชื่อมต่อ</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
              >
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

