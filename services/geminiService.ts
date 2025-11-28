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
const MODEL_TEXT = 'gemini-2.5-flash';

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
    ? "**CRITICAL: GENERATE ALL CONTENT IN HINDI LANGUAGE (Devanagari Script).** You can use English technical terms in brackets like 'कोशिका (Cell)'. The Intro hook should be in natural conversational Hindi (e.g., 'भाई, यह टॉपिक...')." 
    : "Generate content in English.";

  const prompt = `
    Act as "EduGen", a Gen-Z friendly, expert CBSE teacher.
    Create "Teacher Science Full Notes" style content.
    ${langInstruction}
    
    Details:
    Class: ${classLevel}
    Subject: ${subject}
    Topic: ${topic}

    **Style Guide (Strictly Follow):**
    1. **Intro Hook**: Start with a conversational, friendly intro. Explain why it matters.
    2. **High Density Content**: Use bullet points.
    3. **Comparison Tables**: ALWAYS include at least one comparison table.
    4. **Memory Hacks**: Include a "Mnemonics/Tricks" section.
    5. **IST (It's a Sawal Time)**: A section with 3-4 short Q&A for practice.
    6. **MCQs**: 3-4 practice MCQs.
    7. **Visuals**: Keep descriptions vivid.

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
        systemInstruction: "You are EduGen, the coolest CBSE teacher. You explain complex topics simply with 'Bhai-style' intros and highly structured notes."
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
  imageBase64?: string
): Promise<MathSolution> => {
  validateKey();

  // Optimized Prompt for Step-by-Step Clarity (Textbook Style)
  const prompt = `
    Role: Expert Math Tutor.
    Task: Solve the PRIMARY problem in the image/text showing detailed work.
    Format: JSON.
    
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
        thinkingConfig: { thinkingBudget: 0 } // Keep 0 for latency, but prompt ensures quality
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