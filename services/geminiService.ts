
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StudyNote, ExamPaper, AnalyticsData, QuestionType, Difficulty, ExamType, MathSolution } from "../types";

// Initialize Gemini Client safely for both Vite (Vercel) and other environments
const getApiKey = (): string => {
  try {
    // 1. Vite Environment (Standard for this project)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
    
    // 2. Next.js / Generic Node Environment
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.API_KEY) return process.env.API_KEY;
      if (process.env.NEXT_PUBLIC_API_KEY) return process.env.NEXT_PUBLIC_API_KEY;
    }
  } catch (e) {
    console.warn("Error accessing environment variables", e);
  }
  
  // Return empty string to prevent constructor crash, check in function calls
  return '';
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy_key_to_init' });

// Constants for Models
// Switching to Flash Lite as requested for speed/efficiency
const MODEL_TEXT = 'gemini-2.0-flash-lite-preview-02-05';

// Helper to validate key before calling
const validateKey = () => {
  if (!apiKey || apiKey === 'dummy_key_to_init') {
    throw new Error("API Key is missing. Please set VITE_API_KEY in your Vercel Environment Variables.");
  }
};

export const generateStudyNotes = async (
  topic: string,
  classLevel: string,
  subject: string,
  language: string = 'English'
): Promise<StudyNote> => {
  validateKey();
  
  // Force Hindi language if the subject itself is Hindi
  const effectiveLanguage = subject.toLowerCase() === 'hindi' ? 'Hindi' : language;

  const langInstruction = effectiveLanguage === 'Hindi' 
    ? "**CRITICAL: GENERATE ALL CONTENT IN HINDI LANGUAGE (Devanagari Script).** Use standard NCERT Hindi terminology. You can use English technical terms in brackets like 'कोशिका (Cell)'. The Intro hook should be in natural conversational Hindi." 
    : "Generate content in English.";

  // UPDATED PROMPT: Strict NCERT Alignment & Comprehensive Coverage
  const prompt = `
    Act as a Senior CBSE Board Examiner and Expert Subject Tutor.
    Create **COMPREHENSIVE, NCERT-MASTERY STUDY NOTES** for:
    
    **Context:**
    - Class: ${classLevel} (CBSE/NCERT Curriculum)
    - Subject: ${subject}
    - Chapter/Topic: ${topic}
    ${langInstruction}

    **CORE INSTRUCTION:**
    Your goal is to generate a **complete replacement for the textbook** for revision. 
    You must cover **100% of the NCERT syllabus** for this chapter. 
    **DO NOT SKIP** any sub-topic, definition, diagram description, derivation, or important example mentioned in the NCERT book.

    **DETAILED STRUCTURE REQUIREMENTS:**
    1.  **Intro Hook**: A short, engaging real-world application to spark interest (Gen-Z friendly but professional).
    2.  **Deep-Dive Sections**: 
        - Break the chapter down into **ALL** its logical NCERT sub-headings.
        - For each section, provide **detailed explanations**, not just summaries. 
        - Include **Laws, Principles, Theorems, and Chemical Equations** explicitly where applicable.
        - For Math/Physics: Include step-by-step **Derivations** and **Formula Lists**.
        - For History/Social: Include Dates, Events, Causes, and Consequences.
    3.  **Comparison Tables**: Mandatorily include tables for confusing terms (e.g., Mitosis vs Meiosis, Concave vs Convex) if applicable.
    4.  **Mnemonics**: Smart memory hacks to remember lists or sequences.
    5.  **Exam Corner**:
        - **IST (It's a Sawal Time)**: 3-4 High-yield Competency/Short Answer questions.
        - **MCQs**: 3-4 Tricky Board-style MCQs.
    6.  **Summary Table**: A quick "Cheat Sheet" revision table.

    **QUALITY CHECKS:**
    - Is the content sufficient for a student to score 100%? Yes.
    - Are technical terms accurate? Yes.
    - Is the tone encouraging? Yes.

    **Output**: Return valid JSON only based on the schema.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      classLevel: { type: Type.STRING },
      subject: { type: Type.STRING },
      intro: { type: Type.STRING, description: "Conversational intro hook." },
      sections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }
            },
            keywords: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }
            },
            table: {
              type: Type.OBJECT,
              properties: {
                headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                rows: { 
                  type: Type.ARRAY, 
                  items: { type: Type.ARRAY, items: { type: Type.STRING } } 
                }
              },
              nullable: true
            }
          },
          required: ["title", "content", "keywords"]
        }
      },
      mnemonics: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      },
      practiceQuestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING }
          }
        },
        description: "IST - It's a Sawal Time"
      },
      mcqs: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.STRING }
          }
        }
      },
      summaryTable: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            concept: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      },
      videoSearchTerm: { type: Type.STRING }
    },
    required: ["topic", "classLevel", "subject", "intro", "sections", "mnemonics", "practiceQuestions", "mcqs", "summaryTable", "videoSearchTerm"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are EduGen, a Senior CBSE Expert. Your goal is to provide comprehensive, NCERT-aligned study material that ensures students can answer ANY board exam question. You explain concepts with depth and clarity."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as StudyNote;
  } catch (error) {
    console.error("Error generating notes:", error);
    throw error;
  }
};

export const generateExamPaper = async (
  syllabus: string,
  classLevel: string,
  subject: string,
  examType: ExamType,
  language: string = 'English'
): Promise<ExamPaper> => {
  validateKey();
  
  const isMajorExam = examType === ExamType.HALF_YEARLY || examType === ExamType.ANNUAL;
  const syllabusText = examType === ExamType.ANNUAL ? "Full Syllabus" : syllabus;
  
  // Force Hindi language if the subject itself is Hindi
  const effectiveLanguage = subject.toLowerCase() === 'hindi' ? 'Hindi' : language;

  const langInstruction = effectiveLanguage === 'Hindi'
    ? "**CRITICAL: GENERATE THE ENTIRE EXAM PAPER IN HINDI (Devanagari Script).** All questions, options, and instructions must be in Hindi. Use standard CBSE Hindi terminology."
    : "Generate the exam paper in English.";

  let structureInstruction = "";

  if (subject.toLowerCase() === 'hindi') {
    structureInstruction = `
      Paper Pattern (80 Marks) for Hindi:
      - Sec A: Reading Skills (Unseen Passages) - MCQs.
      - Sec B: Grammar (Vyakaran) - MCQs/VSA.
      - Sec C: Literature (Textbook) - Q&A (SA/LA).
      - Sec D: Creative Writing (Lekhan) - Long Answer (Essay/Letter).
      Ensure strict adherence to CBSE Hindi pattern.
    `;
  } else if (isMajorExam) {
    if (subject.toLowerCase() === 'mathematics') {
      structureInstruction = `
        Paper Pattern (80 Marks):
        - Sec A: 18 MCQs + 2 Assert-Reason (1 Mark each).
        - Sec B: 5 VSA (2 Marks).
        - Sec C: 6 SA (3 Marks).
        - Sec D: 4 LA (5 Marks).
        - Sec E: 3 Case Study (4 Marks).
        Total 38 Qs.
      `;
    } else if (['science', 'physics', 'chemistry', 'biology'].includes(subject.toLowerCase())) {
      structureInstruction = `
        Paper Pattern (80 Marks):
        - Sec A: 20 MCQs (1 Mark).
        - Sec B: 6 VSA (2 Marks).
        - Sec C: 7 SA (3 Marks).
        - Sec D: 3 LA (5 Marks).
        - Sec E: 3 Case Study (4 Marks).
      `;
    } else {
      structureInstruction = `Follow CBSE 2025 Pattern. Total 80 Marks. Mix of MCQ, SA, LA, Case Study.`;
    }
  } else {
    structureInstruction = `
      PT Pattern (20 Marks):
      - 6 MCQs (1M)
      - 3 VSA (2M)
      - 1 SA (3M)
      - 1 LA (5M)
    `;
  }

  const prompt = `
    Generate a CBSE 2025-26 Exam Paper.
    Class: ${classLevel}, Subject: ${subject}, Type: ${examType}
    Syllabus: ${syllabusText}
    ${langInstruction}
    
    ${structureInstruction}

    **SPEED & OPTIMIZATION RULES**:
    1. **Be Concise**: Question text should be clear but not unnecessarily long.
    2. **Figures**: Provide 'figureSVG' (valid simple SVG string inside <svg> tag) ONLY for Geometry/Graph/Circuit questions where essential. 
    3. **Schema**: Adhere strictly to the JSON structure.
    
    Return JSON.
  `;

  // Schema for Exam Paper
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      totalMarks: { type: Type.INTEGER },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            section: { type: Type.STRING },
            type: { type: Type.STRING, enum: Object.values(QuestionType) },
            questionText: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            marks: { type: Type.INTEGER },
            difficulty: { type: Type.STRING, enum: Object.values(Difficulty) },
            answerKey: { type: Type.STRING },
            figureDescription: { type: Type.STRING },
            figureSVG: { type: Type.STRING }
          },
          required: ["id", "section", "type", "questionText", "marks", "difficulty", "answerKey"]
        }
      }
    },
    required: ["title", "totalMarks", "questions"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as ExamPaper;
  } catch (error) {
    console.error("Error generating exam:", error);
    throw error;
  }
};

export const solveMathProblem = async (
  problemText: string,
  classLevel: string,
  imageBase64?: string
): Promise<MathSolution> => {
  validateKey();

  // Optimized Prompt for Step-by-Step Clarity (Textbook Style)
  const prompt = `
    Role: Expert Math Tutor for Class ${classLevel} (CBSE/NCERT).
    Task: Solve the PRIMARY problem in the image/text showing detailed work.
    Format: JSON.
    
    **CRITICAL CURRICULUM CONSTRAINTS**:
    - **YOU MUST USE METHODS APPROPRIATE FOR CLASS ${classLevel} ONLY.**
    - **Class 9**: Use Euclidian Geometry, Surface Areas, Linear Eq in 2 Vars. **ABSOLUTELY NO TRIGONOMETRY OR CALCULUS.**
    - **Class 10**: Basic Trigonometry allowed. No Calculus.
    - **Class 11/12**: Calculus, Vectors, etc. allowed.
    - If the problem looks advanced but is asked for a lower class, find the specific trick or geometric property intended for that level.
    
    **GUIDELINES FOR OUTPUT**:
    1. **Detailed Derivation**: Break the solution into small, logical steps. Avoid combining multiple logical jumps.
    2. **Equation Centric**: Every step involving a calculation MUST have the 'equation' field populated.
    3. **Math Formatting**: Use clear plain text math notation (e.g., "x^2 + 2x + 1 = 0", "Area = π * r^2"). 
    4. **Explanation**: The 'description' should briefly explain the logic (e.g., "Substitute r = 5 into the area formula").
    5. **Goal**: The output should look like a clean, well-written exam solution.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      problemStatement: { type: Type.STRING, description: "Restate the problem clearly" },
      steps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            stepTitle: { type: Type.STRING },
            description: { type: Type.STRING },
            equation: { type: Type.STRING, description: "The mathematical expression or formula for this step" }
          },
          required: ["stepTitle", "description"]
        }
      },
      finalAnswer: { type: Type.STRING },
      keyTips: { type: Type.ARRAY, items: { type: Type.STRING } },
      commonErrors: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["problemStatement", "steps", "finalAnswer", "keyTips", "commonErrors"]
  };

  const parts: any[] = [{ text: problemText || "Solve the problem in this image." }];
  
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/png', 
        data: imageBase64
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: { parts },
      config: {
        systemInstruction: prompt,
        responseMimeType: "application/json",
        responseSchema: schema,
        // Removed thinkingConfig as Flash Lite does not support it
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as MathSolution;
  } catch (error) {
    console.error("Error solving math problem:", error);
    throw error;
  }
};

export const analyzeStudentPerformance = async (
  studentInput: string
): Promise<AnalyticsData[]> => {
  validateKey();
  const prompt = `
    Analyze student reflection/quiz: "${studentInput}"
    Generate Knowledge Heatmap (Subjects, Mastery 0-100, Strong/Weak topics).
  `;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        subject: { type: Type.STRING },
        masteryScore: { type: Type.INTEGER },
        topicsStrong: { type: Type.ARRAY, items: { type: Type.STRING } },
        topicsWeak: { type: Type.ARRAY, items: { type: Type.STRING } },
        lastStudied: { type: Type.STRING }
      },
      required: ["subject", "masteryScore", "topicsStrong", "topicsWeak", "lastStudied"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AnalyticsData[];
  } catch (error) {
    console.error("Error analyzing performance:", error);
    throw error;
  }
};
