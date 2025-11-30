
export interface NoteSection {
  title: string;
  content: string[]; // Bullet points
  keywords: string[];
  table?: {
    headers: string[];
    rows: string[][];
  };
}

export interface StudyNote {
  topic: string;
  classLevel: string;
  subject: string;
  intro: string; // The "Bhai..." conversational hook
  sections: NoteSection[];
  mnemonics: { name: string; description: string }[]; // Memory Hacks
  practiceQuestions: { question: string; answer: string }[]; // IST (It's a Sawal Time)
  mcqs: { question: string; options: string[]; answer: string }[];
  summaryTable: { concept: string; description: string }[];
  videoSearchTerm: string;
}

export enum QuestionType {
  MCQ = 'MCQ',
  COMPETENCY = 'COMPETENCY',
  CASE_STUDY = 'CASE_STUDY',
  SHORT_ANSWER = 'SHORT_ANSWER',
  LONG_ANSWER = 'LONG_ANSWER'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface Question {
  id: number;
  type: QuestionType;
  questionText: string;
  options?: string[]; // For MCQs
  marks: number;
  difficulty: Difficulty;
  answerKey?: string;
  figureDescription?: string; // Description for PDF/Text-only view
  figureSVG?: string; // Raw SVG code for Web UI
}

export interface ExamPaper {
  title: string;
  totalMarks: number;
  questions: Question[];
}

export enum ExamType {
  PT1 = 'Periodic Test 1',
  PT2 = 'Periodic Test 2',
  HALF_YEARLY = 'Half Yearly Exam',
  PT3 = 'Periodic Test 3',
  ANNUAL = 'Annual/Final Exam'
}

export interface AnalyticsData {
  subject: string;
  masteryScore: number; // 0-100
  topicsStrong: string[];
  topicsWeak: string[];
  lastStudied: string;
}

export interface SyllabusItem {
  unit: string;
  weightage: number;
  completion: number;
}

export interface MathSolution {
  problemStatement: string;
  steps: { 
    stepTitle: string; 
    description: string; 
    equation?: string; 
  }[];
  finalAnswer: string;
  keyTips: string[];
  commonErrors: string[];
}

// User Persistence Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  classLevel: string; // "9", "10", "11", "12"
}

// Mimic Firebase User for local typing to avoid dependency on firebase/auth imports
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified?: boolean;
  isAnonymous?: boolean;
  providerData?: any[];
  metadata?: any;
  refreshToken?: string;
  tenantId?: string | null;
  delete?: () => Promise<void>;
  getIdToken?: () => Promise<string>;
  getIdTokenResult?: () => Promise<any>;
  reload?: () => Promise<void>;
  toJSON?: () => object;
  phoneNumber?: string | null;
  providerId?: string;
}

export interface SavedItem {
  id: string; // Firestore ID
  userId: string;
  type: 'note' | 'exam';
  title: string;
  subject: string;
  createdAt: number;
  data: StudyNote | ExamPaper;
}