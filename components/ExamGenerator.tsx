import React, { useState } from 'react';
import { generateExamPaper } from '../services/geminiService';
import { ExamPaper, QuestionType, Difficulty, ExamType } from '../types';
import { Button, Card, Input, Select, LoadingSpinner, Badge } from './UIComponents';
import { FileQuestion, CheckCircle, Brain, AlertTriangle, Book, Calendar, Download, ImageIcon } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';

interface ExamGeneratorProps {
  classLevel: string;
}

const ExamGenerator: React.FC<ExamGeneratorProps> = ({ classLevel }) => {
  const [subject, setSubject] = useState('Mathematics');
  const [examType, setExamType] = useState<ExamType>(ExamType.PT1);
  const [syllabus, setSyllabus] = useState('');
  const [exam, setExam] = useState<ExamPaper | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  const handleCreate = async () => {
    if (examType !== ExamType.ANNUAL && !syllabus.trim()) {
      alert("Please enter the syllabus/chapters for this exam.");
      return;
    }

    setLoading(true);
    setExam(null);
    setShowAnswers(false);
    try {
      const data = await generateExamPaper(syllabus, classLevel, subject, examType);
      setExam(data);
    } catch (error) {
      alert("Error creating exam.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!exam) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // Helper to print text wrapped
    const printText = (text: string, x: number, yPos: number, maxWidth: number) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, yPos);
        return lines.length * 5; // Approximate height per line (line height 5)
    };

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(exam.title, pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const info = `Class: ${classLevel} | Subject: ${subject} | Max Marks: ${exam.totalMarks} | Duration: ${exam.totalMarks === 80 ? '3 Hours' : '45 Mins'}`;
    doc.text(info, pageWidth / 2, y, { align: "center" });
    y += 10;
    
    doc.setLineWidth(0.5);
    doc.line(10, y, pageWidth - 10, y);
    y += 10;

    doc.setFontSize(11);

    let currentSection = "";

    for (let index = 0; index < exam.questions.length; index++) {
      const q = exam.questions[index];

      // Page Break Check (Conservative)
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Check Section Change
      // @ts-ignore
      if (q.section && q.section !== currentSection) {
         y += 5;
         // @ts-ignore
         currentSection = q.section;
         doc.setFont("helvetica", "bold");
         doc.text(currentSection, 10, y);
         y += 8;
         doc.setFont("helvetica", "normal");
      }

      // 1. Render Question Number
      const qNum = `${index + 1}.`;
      doc.text(qNum, 10, y);

      // 2. Render Figure (SVG or Placeholder)
      if (q.figureSVG) {
        const element = document.getElementById(`exam-fig-${index}`);
        if (element) {
          try {
            // Capture the SVG from DOM
            const canvas = await html2canvas(element, { scale: 2, backgroundColor: null });
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 100;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Check if image fits on page
            if (y + imgHeight > 280) {
              doc.addPage();
              y = 20;
              doc.text(qNum, 10, y); // Reprint number on new page if figure pushed it
            }

            doc.addImage(imgData, 'PNG', 20, y, imgWidth, imgHeight);
            y += imgHeight + 5;
            
            doc.setFontSize(9);
            doc.text(`Fig. for Q${index + 1}`, 20, y - 2);
            doc.setFontSize(11);
          } catch (e) {
            // Fallback to box if capture fails
            console.error("Figure capture failed", e);
            doc.rect(20, y, 100, 40);
            doc.text("Figure Missing (Render Error)", 25, y + 20);
            y += 45;
          }
        } else {
           // Element not found in DOM (should not happen if rendered)
           doc.rect(20, y, 100, 40);
           doc.text("Refer to Web View for Figure", 25, y + 20);
           y += 45;
        }
      } else if (q.figureDescription) {
        // Text only description
        const descText = `[Figure: ${q.figureDescription}]`;
        const descLines = doc.splitTextToSize(descText, pageWidth - 35);
        doc.setTextColor(100);
        doc.text(descLines, 20, y);
        doc.setTextColor(0);
        y += descLines.length * 5 + 2;
      }

      // 3. Render Question Text
      const height = printText(`${q.questionText} [${q.marks} Marks]`, 20, y, pageWidth - 35);
      y += height;

      // 4. Render Options (MCQ)
      if (q.type === QuestionType.MCQ && q.options) {
        q.options.forEach((opt, i) => {
          if (y > 280) { doc.addPage(); y = 20; }
          const label = String.fromCharCode(65 + i);
          doc.text(`(${label}) ${opt}`, 25, y);
          y += 6;
        });
        y += 2;
      } else {
        y += 4;
      }
    }

    doc.save(`${subject}_Class${classLevel}_Exam.pdf`);
  };

  const getDifficultyBadge = (diff: Difficulty) => {
    switch (diff) {
      case Difficulty.EASY: return <Badge type="success">Easy</Badge>;
      case Difficulty.MEDIUM: return <Badge type="warning">Medium</Badge>;
      case Difficulty.HARD: return <Badge type="danger">Hard</Badge>;
      default: return null;
    }
  };

  const getQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case QuestionType.MCQ: return <CheckCircle size={16} className="text-blue-400" />;
      case QuestionType.COMPETENCY: return <Brain size={16} className="text-purple-400" />;
      case QuestionType.CASE_STUDY: return <FileQuestion size={16} className="text-orange-400" />;
      default: return <AlertTriangle size={16} className="text-gray-400" />;
    }
  };

  const isFullSyllabus = examType === ExamType.ANNUAL;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Card className="border-t-4 border-t-edu-primary">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FileQuestion className="text-edu-primary" />
          CBSE Exam Paper Generator
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
           <div className="space-y-2">
             <label className="text-sm text-gray-400 font-semibold">Subject & Class</label>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-900 border border-edu-border/50 rounded-lg p-3 flex items-center justify-center text-gray-400 font-semibold cursor-not-allowed">
                  Class {classLevel}
                </div>
                <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
                   <option value="Mathematics">Mathematics</option>
                   <option value="Physics">Physics</option>
                   <option value="Chemistry">Chemistry</option>
                   <option value="Biology">Biology</option>
                   <option value="Science">Science</option>
                   <option value="Computer Science">Computer Science</option>
                   <option value="English">English</option>
                   <option value="Social Science">Social Science</option>
                   <option value="Accountancy">Accountancy</option>
                   <option value="Business Studies">Business Studies</option>
                </Select>
             </div>
           </div>

           <div className="space-y-2">
              <label className="text-sm text-gray-400 font-semibold">Exam Pattern</label>
              <Select value={examType} onChange={(e) => setExamType(e.target.value as ExamType)}>
                {Object.values(ExamType).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
           </div>
        </div>

        <div className="space-y-2 mb-6">
           <label className="text-sm text-gray-400 font-semibold flex items-center gap-2">
             <Book size={16} />
             Syllabus / Chapters
             {isFullSyllabus && <span className="text-edu-primary text-xs ml-2">(Auto-selected: Complete Book)</span>}
           </label>
           <div className="relative">
             <Input 
               placeholder="e.g. Chapter 1: Real Numbers, Chapter 2: Polynomials..." 
               value={syllabus}
               onChange={(e) => setSyllabus(e.target.value)}
               disabled={isFullSyllabus}
               className={isFullSyllabus ? "opacity-50 cursor-not-allowed italic" : ""}
             />
           </div>
        </div>

        <div className="flex justify-end">
           <Button onClick={handleCreate} disabled={loading || (!syllabus && !isFullSyllabus)}>
             {loading ? 'Designing Paper...' : 'Generate Exam Paper'}
           </Button>
        </div>
      </Card>

      {loading && <LoadingSpinner />}

      {exam && !loading && (
        <div className="animate-fade-in space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-edu-card border border-edu-border p-6 rounded-xl">
            <div>
              <div className="flex items-center gap-3 mb-1">
                 <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{exam.title}</h2>
                 <Badge type="neutral">{subject}</Badge>
              </div>
              <p className="text-gray-400 mt-1 flex items-center gap-4">
                <span className="flex items-center gap-1"><CheckCircle size={14}/> Total Marks: <span className="text-edu-primary font-bold">{exam.totalMarks}</span></span>
                <span className="flex items-center gap-1"><Calendar size={14}/> Duration: {exam.totalMarks === 80 ? '3 Hours' : '45 Mins'}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={downloadPDF} title="Download PDF">
                <Download size={18} className="mr-2"/> Download PDF
              </Button>
              <Button variant="outline" onClick={() => setShowAnswers(!showAnswers)}>
                {showAnswers ? 'Hide Key' : 'Show Key'}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {exam.questions.map((q, index) => (
              <div key={q.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 hover:border-edu-border/50 transition-all relative">
                
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-edu-border/20 text-edu-primary font-mono text-sm px-2 py-1 rounded">Q{index + 1}</span>
                    {/* @ts-ignore */}
                    {q.section && <Badge type="neutral">{q.section}</Badge>}
                    <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide font-semibold ml-2">
                      {getQuestionTypeIcon(q.type)}
                      {q.type.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getDifficultyBadge(q.difficulty)}
                    <span className="text-gray-400 text-sm font-semibold">[{q.marks} Marks]</span>
                  </div>
                </div>

                {/* VISUAL SVG RENDERER with ID for Capture */}
                {q.figureSVG && (
                  <div className="mb-6 mt-2">
                    <div 
                      id={`exam-fig-${index}`} 
                      className="bg-white rounded-lg p-4 overflow-hidden flex justify-center border-2 border-neutral-700 w-fit mx-auto"
                    >
                      <div 
                        className="w-full max-w-[400px]"
                        dangerouslySetInnerHTML={{ __html: q.figureSVG }} 
                      />
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-2 font-mono">Figure for Q{index + 1}</p>
                  </div>
                )}
                
                {/* Fallback Text Description */}
                {!q.figureSVG && q.figureDescription && (
                   <div className="mb-4 bg-black border border-dashed border-gray-700 p-4 rounded-lg flex items-start gap-3">
                    <ImageIcon className="text-gray-500 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Figure Description</p>
                      <p className="text-gray-300 text-sm italic">{q.figureDescription}</p>
                    </div>
                  </div>
                )}

                <p className="text-lg text-gray-200 mb-4 font-medium whitespace-pre-line">{q.questionText}</p>

                {q.type === QuestionType.MCQ && q.options && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 pl-4">
                    {q.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded bg-black/40 border border-neutral-800">
                        <span className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-xs text-gray-400 border border-neutral-700">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-gray-300">{opt}</span>
                      </div>
                    ))}
                  </div>
                )}

                {showAnswers && (
                  <div className="mt-4 pt-4 border-t border-neutral-800 animate-fade-in bg-green-900/10 p-3 rounded">
                    <p className="text-green-400 font-medium flex items-start gap-2">
                      <CheckCircle size={16} className="mt-1 shrink-0" />
                      <div>
                        <span className="block text-xs uppercase text-green-500/70 mb-1">Correct Answer / Key Points</span>
                        <span className="text-gray-200 font-normal">{q.answerKey}</span>
                      </div>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamGenerator;