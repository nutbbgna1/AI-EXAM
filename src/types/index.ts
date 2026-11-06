export type SheetType = 'choice' | 'fill' | 'matching' | 'truefalse' | 'qa';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'analytical';

export interface WorksheetItem {
  id: number;
  question: string;
  options?: string[];
  matchPairs?: { left: string; right: string }[];
  answer: string;
  explanation?: string;
}

export interface Worksheet {
  id: string;
  title: string;
  subject: string;
  grade: string;
  topic: string;
  sheetType: SheetType;
  difficulty: DifficultyLevel;
  instruction: string;
  headerNote?: string;
  items: WorksheetItem[];
  illustrationPrompt?: string;
  createdAt: string;
}

export interface ExamQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  indicator?: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  grade: string;
  examType: 'pre' | 'post' | 'midterm' | 'final';
  timeMinutes: number;
  questions: ExamQuestion[];
  createdAt: string;
}

export interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  grade: string;
  durationHours: number;
  standards: string;
  essentialConcept: string;
  objectives: {
    k: string[]; // Knowledge
    p: string[]; // Practice / Process
    a: string[]; // Attitude / Values
  };
  activities: {
    intro: string[];
    teaching: string[];
    conclusion: string[];
  };
  materials: string[];
  evaluation: string[];
  createdAt: string;
}

export interface AppSettings {
  apiKey: string;
  model: string;
  reviewModel: string;
  temperature: number;
}
