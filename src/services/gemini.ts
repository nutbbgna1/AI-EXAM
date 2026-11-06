import { GoogleGenAI } from '@google/genai';
import { Worksheet, SheetType, DifficultyLevel, Exam, LessonPlan } from '../types';

export const getStoredApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('gemini_api_key');
    if (localKey && localKey.trim()) return localKey.trim();
  }
  if (typeof process !== 'undefined') {
    if (process.env?.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    if (process.env?.API_KEY) return process.env.API_KEY;
  }
  return '';
};

export const setStoredApiKey = (key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gemini_api_key', key.trim());
  }
};

const getClient = (overrideKey?: string) => {
  const apiKey = overrideKey || getStoredApiKey();
  if (!apiKey) {
    throw new Error('กรุณาระบุ Google Gemini API Key ในเมนูตั้งค่าก่อนใช้งาน');
  }
  return new GoogleGenAI({ apiKey });
};

// Hints according to Thai Basic Education Core Curriculum
const getLevelHint = (grade: string): string => {
  if (/^ป\.[1-3]$/.test(grade)) {
    return 'ผู้เรียนเป็นเด็กเล็ก (ป.1-3): ประโยคสั้นมาก คำง่าย เข้าใจง่าย ตัวเลขและตัวอย่างอยู่ใกล้ตัวเด็ก ภาพประกอบหรือสิ่งของที่คุ้นเคย';
  }
  if (/^ป\.[4-6]$/.test(grade)) {
    return 'ผู้เรียนเป็นเด็กประถมตอนปลาย (ป.4-6): ประโยคสั้นกระชับ คำศัพท์เหมาะกับวัย เริ่มมีโจทย์คิดวิเคราะห์ง่ายๆ เหตุและผล';
  }
  if (/^ม\.[1-3]$/.test(grade)) {
    return 'ผู้เรียนเป็นนักเรียนมัธยมต้น (ม.1-3): ใช้ศัพท์วิชาการระดับพื้นฐานได้ มีโจทย์ที่ต้องคิดวิเคราะห์และแก้ปัญหาประกอบ';
  }
  return 'ผู้เรียนเป็นนักเรียนมัธยมปลาย (ม.4-6): ใช้ศัพท์วิชาการได้ตามระดับ โจทย์เน้นความเข้าใจ การประยุกต์ และการสังเคราะห์ความรู้';
};

const getSubjectHint = (subject: string): string => {
  const hints: string[] = [];
  if (subject.includes('ภาษาอังกฤษ')) {
    hints.push('ข้อความโจทย์ คำตอบ และตัวเลือกให้เป็นภาษาอังกฤษที่ถูกต้อง ระดับคำศัพท์/ไวยากรณ์เหมาะกับชั้นและเทียบเคียงระดับ CEFR คำสั่งใบงานเป็นภาษาไทยได้ ห้ามมีคำตอบที่ถูกมากกว่าหนึ่งข้อ');
  }
  if (subject.includes('ภาษาไทย')) {
    hints.push('ใช้ภาษาไทยถูกต้องตามหลักภาษาและการสะกดคำตามราชบัณฑิตยสภา คำตอบต้องตัดสินได้ชัดเจน ไม่กำกวม');
  }
  if (/คณิต|ฟิสิกส์|เคมี|คำนวณ/.test(subject)) {
    hints.push('ตัวเลขและการคำนวณต้องถูกต้องแม่นยำ 100% ทุกข้อต้องมีคำตอบเดียวที่ถูกต้อง ค่าที่ให้ต้องครบพอสำหรับคำนวณ ใช้สูตรหรือสัญลักษณ์ทางคณิตศาสตร์ในรูปแบบ LaTeX ได้ เช่น $x^2 + 5x + 6 = 0$');
  }
  if (/วิทยาศาสตร์|ชีววิทยา|โลก/.test(subject)) {
    hints.push('ข้อเท็จจริงทางวิทยาศาสตร์ต้องถูกต้องตามหลักวิชาการและหนังสือเรียน สพฐ./สสวท.');
  }
  return hints.join(' | ');
};

const cleanJsonString = (raw: string): string => {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
};

export interface GenerateWorksheetParams {
  grade: string;
  subject: string;
  topic: string;
  sheetType: SheetType;
  difficulty: DifficultyLevel;
  itemCount: number;
  model?: string;
  apiKey?: string;
}

export const generateWorksheet = async (params: GenerateWorksheetParams): Promise<Worksheet> => {
  const ai = getClient(params.apiKey);
  const model = params.model || 'gemini-2.5-flash';

  const typeDesc: Record<SheetType, string> = {
    choice: 'ปรนัย 4 ตัวเลือก (ก, ข, ค, ง)',
    fill: 'เติมคำในช่องว่าง (มีช่องว่างให้เติมคำตอบที่ถูกต้อง)',
    matching: 'จับคู่ข้อความหรือความสัมพันธ์ (คอลัมน์ซ้ายและขวา)',
    truefalse: 'ถูกหรือผิด (พิจารณาข้อความว่าถูกหรือผิด พร้อมเหตุผลสั้นๆ)',
    qa: 'ตอบคำถามสั้น / อัตนัย (เขียนคำตอบอธิบายสั้นๆ ชัดเจน)'
  };

  const diffDesc: Record<DifficultyLevel, string> = {
    easy: 'ระดับง่าย (เน้นความรู้ความจำ พื้นฐานเบื้องต้น)',
    medium: 'ระดับปานกลาง (เน้นความเข้าใจและการนำไปใช้)',
    hard: 'ระดับท้าทาย (เน้นการวิเคราะห์และแก้โจทย์ซับซ้อน)',
    analytical: 'ระดับคิดวิเคราะห์ขั้นสูง (เน้นการประเมินค่าและการสังเคราะห์)'
  };

  const systemInstruction = `คุณเป็นครูผู้เชี่ยวชาญการศึกษาขั้นพื้นฐานของไทย (ตามหลักสูตรแกนกลางฯ 2551 ปรับปรุง 2560) 
ทำหน้าที่ออกแบบใบงานแบบฝึกหัดสำหรับนักเรียนชั้น ${params.grade} วิชา ${params.subject}
${getLevelHint(params.grade)}
${getSubjectHint(params.subject)}
โจทย์และคำตอบต้องถูกต้องตามหลักวิชาการ 100% ตัวเลือกต้องสมเหตุสมผลและมีคำตอบที่ถูกต้องเพียงข้อเดียว`;

  const prompt = `จงสร้างใบงานวิชา "${params.subject}" ระดับชั้น "${params.grade}" หัวข้อเรื่อง "${params.topic}"
รูปแบบใบงาน: ${typeDesc[params.sheetType]}
ระดับความยาก: ${diffDesc[params.difficulty]}
จำนวนข้อ: ${params.itemCount} ข้อ

ตอบกลับเป็น JSON ตามโครงสร้างนี้เท่านั้น (ห้ามใส่คำบรรยายนอก JSON):
{
  "title": "ชื่อใบงานที่น่าสนใจและตรงกับเนื้อหา",
  "instruction": "คำชี้แจงสำหรับนักเรียน (เช่น ให้นักเรียนเลือกคำตอบที่ถูกต้องที่สุดเพียงข้อเดียว)",
  "headerNote": "คำแนะนำหรือข้อคิดสั้นๆ ประจำใบงาน",
  "items": [
    {
      "id": 1,
      "question": "ข้อความโจทย์",
      "options": ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"], // สำหรับแบบ choice หรือ matching
      "answer": "คำตอบที่ถูกต้อง (เช่น ก. คำตอบ หรือข้อความที่ถูกต้อง)",
      "explanation": "คำอธิบายเฉลยอย่างละเอียด เข้าใจง่าย"
    }
  ],
  "illustrationPrompt": "คำอธิบายภาพประกอบลายเส้นขาวดำสไตล์การศึกษาไทยที่เหมาะกับใบงานนี้ (ภาษาอังกฤษ สำหรับ AI สร้างภาพ)"
}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.7,
    }
  });

  const text = response.text || '';
  const parsed = JSON.parse(cleanJsonString(text));

  return {
    id: 'ws-' + Date.now(),
    title: parsed.title || `ใบงาน ${params.topic}`,
    subject: params.subject,
    grade: params.grade,
    topic: params.topic,
    sheetType: params.sheetType,
    difficulty: params.difficulty,
    instruction: parsed.instruction || 'ให้นักเรียนตอบคำถามให้ถูกต้อง',
    headerNote: parsed.headerNote,
    items: parsed.items || [],
    illustrationPrompt: parsed.illustrationPrompt,
    createdAt: new Date().toISOString()
  };
};

export interface GenerateExamParams {
  grade: string;
  subject: string;
  topic: string;
  examType: 'pre' | 'post' | 'midterm' | 'final';
  questionCount: number;
  timeMinutes: number;
  model?: string;
  apiKey?: string;
}

export const generateExam = async (params: GenerateExamParams): Promise<Exam> => {
  const ai = getClient(params.apiKey);
  const model = params.model || 'gemini-2.5-flash';

  const examTypeLabels = {
    pre: 'แบบทดสอบก่อนเรียน (Pre-test)',
    post: 'แบบทดสอบหลังเรียน (Post-test)',
    midterm: 'แบบทดสอบวัดผลกลางภาคเรียน (Mid-term Exam)',
    final: 'แบบทดสอบวัดผลปลายภาคเรียน (Final Exam)'
  };

  const systemInstruction = `คุณเป็นผู้เชี่ยวชาญการวัดและประเมินผลทางการศึกษาของไทย
สร้างแบบทดสอบมาตรฐานวิชา ${params.subject} ชั้น ${params.grade}
${getLevelHint(params.grade)}
${getSubjectHint(params.subject)}
เกณฑ์ข้อสอบ:
1. ตัวเลือก 4 ตัวเลือก (index 0, 1, 2, 3) มีคำตอบถูกเพียงข้อเดียวที่แน่ชัด
2. ข้อสอบตรงตามมาตรฐานตัวชี้วัด
3. มีคำอธิบายเฉลยอย่างละเอียดและเข้าใจง่าย`;

  const prompt = `จงสร้าง ${examTypeLabels[params.examType]} วิชา "${params.subject}" ชั้น "${params.grade}" เรื่อง "${params.topic}"
จำนวน: ${params.questionCount} ข้อ เวลาสอบ: ${params.timeMinutes} นาที

ตอบกลับเป็น JSON ตามโครงสร้างนี้เท่านั้น:
{
  "title": "ชื่อชุดข้อสอบ เช่น แบบทดสอบปลายภาคเรียน เรื่อง...",
  "questions": [
    {
      "id": 1,
      "question": "ข้อความโจทย์ข้อสอบ",
      "options": ["ตัวเลือก ก", "ตัวเลือก ข", "ตัวเลือก ค", "ตัวเลือก ง"],
      "correctIndex": 0, // 0, 1, 2 หรือ 3
      "explanation": "คำอธิบายเหตุผลว่าทำไมตัวเลือกนี้จึงถูกต้อง และตัวเลือกอื่นผิดอย่างไร",
      "indicator": "รหัสหรือคำอธิบายตัวชี้วัด (ถ้ามี เช่น ว 1.2 ป.4/1)"
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.5,
    }
  });

  const parsed = JSON.parse(cleanJsonString(response.text || ''));

  return {
    id: 'ex-' + Date.now(),
    title: parsed.title || `แบบทดสอบ ${params.topic}`,
    subject: params.subject,
    grade: params.grade,
    examType: params.examType,
    timeMinutes: params.timeMinutes,
    questions: parsed.questions || [],
    createdAt: new Date().toISOString()
  };
};

export interface GenerateLessonPlanParams {
  grade: string;
  subject: string;
  topic: string;
  durationHours: number;
  model?: string;
  apiKey?: string;
}

export const generateLessonPlan = async (params: GenerateLessonPlanParams): Promise<LessonPlan> => {
  const ai = getClient(params.apiKey);
  const model = params.model || 'gemini-2.5-flash';

  const systemInstruction = `คุณเป็นศึกษานิเทศก์และผู้เชี่ยวชาญการเขียนแผนการจัดการเรียนรู้เชิงรุก (Active Learning) 
วิชา ${params.subject} ชั้น ${params.grade} ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พ.ศ. 2551 (ปรับปรุง 2560)`;

  const prompt = `จงเขียนแผนการจัดการเรียนรู้ วิชา "${params.subject}" ชั้น "${params.grade}" เรื่อง "${params.topic}" เวลา ${params.durationHours} ชั่วโมง

ตอบกลับเป็น JSON ตามโครงสร้างนี้เท่านั้น:
{
  "title": "แผนการจัดการเรียนรู้ที่ ... เรื่อง ...",
  "standards": "มาตรฐานการเรียนรู้และตัวชี้วัดที่เกี่ยวข้อง",
  "essentialConcept": "สาระสำคัญ / ความคิดรวบยอด",
  "objectives": {
    "k": ["ด้านความรู้ (Knowledge) นักเรียนสามารถอธิบาย..."],
    "p": ["ด้านทักษะกระบวนการ (Practice/Process) นักเรียนสามารถปฏิบัติ/คำนวณ..."],
    "a": ["ด้านคุณลักษณะอันพึงประสงค์ (Attitude/Values) นักเรียนมีความกระตือรือร้นและมุ่งมั่น..."]
  },
  "activities": {
    "intro": ["ขั้นนำเข้าสู่บทเรียน (กระตุ้นความสนใจ เชื่อมโยงประสบการณ์เดิม)..."],
    "teaching": ["ขั้นจัดกิจกรรมการเรียนรู้ (Active Learning, การทดลอง/กลุ่มย่อย/ลงมือทำ)..."],
    "conclusion": ["ขั้นสรุป (ร่วมกันอภิปรายและสรุปองค์ความรู้)..."]
  },
  "materials": ["สื่อและแหล่งการเรียนรู้ เช่น ใบงาน, สื่อ PowerPoint, ของจริง"],
  "evaluation": ["การวัดและประเมินผล เช่น ตรวจใบงาน, สังเกตพฤติกรรม, แบบทดสอบ"]
}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.6,
    }
  });

  const parsed = JSON.parse(cleanJsonString(response.text || ''));

  return {
    id: 'lp-' + Date.now(),
    title: parsed.title || `แผนการจัดการเรียนรู้ ${params.topic}`,
    subject: params.subject,
    grade: params.grade,
    durationHours: params.durationHours,
    standards: parsed.standards || '',
    essentialConcept: parsed.essentialConcept || '',
    objectives: parsed.objectives || { k: [], p: [], a: [] },
    activities: parsed.activities || { intro: [], teaching: [], conclusion: [] },
    materials: parsed.materials || [],
    evaluation: parsed.evaluation || [],
    createdAt: new Date().toISOString()
  };
};
