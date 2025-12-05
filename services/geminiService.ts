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
// Upgraded to 2.5 Flash for better JSON consistency and context handling
const MODEL_TEXT = 'gemini-2.5-flash';

// Helper to validate key before calling
const validateKey = () => {
  if (!apiKey || apiKey === 'dummy_key_to_init') {
    throw new Error("API Key is missing. Please set VITE_API_KEY in your Vercel Environment Variables.");
  }
};

// Helper to clean JSON string from Markdown code blocks
const cleanJSON = (text: string): string => {
  if (!text) return "{}";
  // Remove ```json ... ``` or ``` ... ```
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  // Trim whitespace
  cleaned = cleaned.trim();
  return cleaned;
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
    ? "**CRITICAL: GENERATE ALL CONTENT IN HINDI (Devanagari Script).** Use standard NCERT Hindi terminology." 
    : "Generate content in English.";

  const prompt = `
    Act as a Senior CBSE Board Examiner.
    Create **COMPREHENSIVE NCERT STUDY NOTES** for:
    Class: ${classLevel}, Subject: ${subject}, Topic: ${topic}
    ${langInstruction}

    **STRUCTURE:**
    1. **Intro**: Engaging hook.
    2. **Sections**: Break down the topic. Include definitions, laws, formulas.
    3. **Mnemonics**: 2-3 Memory hacks.
    4. **Practice**: 3 Important Questions (IST).
    5. **MCQs**: 3 Board-style MCQs.
    6. **Summary**: Quick revision table.

    **IMPORTANT:** Return ONLY valid JSON.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      classLevel: { type: Type.STRING },
      subject: { type: Type.STRING },
      intro: { type: Type.STRING },
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
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    try {
      return JSON.parse(cleanJSON(text)) as StudyNote;
    } catch (parseError) {
      console.error("JSON Parse Error. Raw text:", text);
      throw new Error("Failed to parse AI response. Please try again with a specific sub-topic.");
    }
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
  
  // Force Hindi language if the subject itself is Hindi
  const effectiveLanguage = subject.toLowerCase() === 'hindi' ? 'Hindi' : language;
  const langInstruction = effectiveLanguage === 'Hindi'
    ? "GENERATE IN HINDI (Devanagari)."
    : "Generate in English.";

  const prompt = `
    Generate a CBSE Exam Paper.
    Class: ${classLevel}, Subject: ${subject}, Type: ${examType}
    Syllabus: ${syllabus}
    ${langInstruction}
    
    Ensure questions are high quality and strictly follow CBSE patterns.
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
    
    try {
      return JSON.parse(cleanJSON(text)) as ExamPaper;
    } catch (parseError) {
       console.error("JSON Parse Error:", parseError);
       throw new Error("Failed to generate valid exam JSON.");
    }
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

  const prompt = `
    Expert Math Tutor for Class ${classLevel}.
    Solve the problem. Return detailed steps in JSON.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      problemStatement: { type: Type.STRING },
      steps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            stepTitle: { type: Type.STRING },
            description: { type: Type.STRING },
            equation: { type: Type.STRING }
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

  const parts: any[] = [{ text: problemText || "Solve this." }];
  
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
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    try {
        return JSON.parse(cleanJSON(text)) as MathSolution;
    } catch (e) {
        throw new Error("Failed to parse math solution.");
    }
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
    Analyze student reflection: "${studentInput}"
    Generate Knowledge Heatmap JSON.
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
    try {
        return JSON.parse(cleanJSON(text)) as AnalyticsData[];
    } catch (e) {
        throw new Error("Analytics parse error.");
    }
  } catch (error) {
    console.error("Error analyzing performance:", error);
    throw error;
  }
};