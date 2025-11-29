
import React, { useState, useEffect } from 'react';
import { generateExamPaper } from '../services/geminiService';
import { ExamPaper, QuestionType, Difficulty, ExamType, SavedItem, User } from '../types';
import { Button, Card, Input, Select, LoadingSpinner, Badge } from './UIComponents';
import { FileQuestion, CheckCircle, Brain, AlertTriangle, Book, Calendar, Download, ImageIcon, Save, History, ChevronRight, Search } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import { saveGeneratedItem, getSavedItems } from '../services/firebaseService';

interface ExamGeneratorProps {
  classLevel: string;
  user: User | null;
}

const ExamGenerator: React.FC<ExamGeneratorProps> = ({ classLevel, user }) => {
  const [activeView, setActiveView] = useState<'create' | 'saved'>('create');

  // Create State
  const [subject, setSubject] = useState('Mathematics');
  const [examType, setExamType] = useState<ExamType>(ExamType.PT1);
  const [language, setLanguage] = useState('English');
  const [syllabus, setSyllabus] = useState('');
  const [exam, setExam] = useState<ExamPaper | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [saving, setSaving] = useState(false);

  // Saved State
  const [savedExams, setSavedExams] = useState<SavedItem[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeView === 'saved' && user) {
      loadSavedExams();
    }
  }, [activeView, user]);

  const loadSavedExams = async () => {
    if (!user) return;
    setLoadingSaved(true);
    const items = await getSavedItems(user.uid, 'exam');
    setSavedExams(items);
    setLoadingSaved(false);
  };

  const handleCreate = async () => {
    if (examType !== ExamType.ANNUAL && !syllabus.trim()) {
      alert("Please enter the syllabus/chapters for this exam.");
      return;
    }

    setLoading(true);
    setExam(null);
    setShowAnswers(false);
    try {
      const data = await generateExamPaper(syllabus, classLevel, subject, examType, language);
      setExam(data);
    } catch (error: any) {
      alert(error.message || "Error creating exam.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !exam) return;
    setSaving(true);
    try {
      await saveGeneratedItem(user.uid, 'exam', exam.title, subject, exam);
      alert("Exam saved successfully!");
    } catch (e) {
      alert("Failed to save exam.");
    } finally {
      setSaving(false);
    }
  };

  const handleViewSaved = (item: SavedItem) => {
    setExam(item.data as ExamPaper);
    setActiveView('create');
  };

  const downloadPDF = async () => {
    if (!exam) return;

    // Use HTML Capture for Hindi (Language) or Hindi (Subject) to preserve fonts
    if (language === 'Hindi' || subject === 'Hindi') {
      const element = document.getElementById('exam-paper-container');
      if (!element) return;

      try {
        // Temporarily ensure background is white for capture
        const originalBg = element.style.backgroundColor;
        element.style.backgroundColor = '#ffffff';
        element.style.color = '#000000';
        element.classList.add('pdf-capture-mode'); // Could be used for CSS overrides

        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false
        });

        // Revert styles
        element.style.backgroundColor = originalBg;
        element.style.color = '';
        element.classList.remove('pdf-capture-mode');

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        // Calculate height for full width
        const imgHeightInPdf = (imgHeight * pdfWidth) / imgWidth;
        let heightLeft = imgHeightInPdf;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
        heightLeft -= pdfHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeightInPdf;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
          heightLeft -= pdfHeight;
        }

        pdf.save(`${subject}_Hindi_Exam.pdf`);
      } catch (e) {
        console.error("Hindi PDF Gen Error", e);
        alert("Failed to generate Hindi PDF");
      }
      return;
    }

    // Default English Generation (Text Based)
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // Helper to print text wrapped
    const printText = (text: string, x: number, yPos: number, maxWidth: number) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, yPos);
        return lines.length * 5; // Approximate height per line
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
            // Force white background for capture
            const canvas = await html2canvas(element, { 
              scale: 2, 
              backgroundColor: '#ffffff',
              logging: false,
              useCORS: true 
            });
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 80; // Reasonable width for figure
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Check if image fits on page
            if (y + imgHeight > 280) {
              doc.addPage();
              y = 20;
              doc.text(qNum, 10, y); // Reprint number
            }

            // Offset X to not overlap question number
            doc.addImage(imgData, 'PNG', 20, y, imgWidth, imgHeight);
            y += imgHeight + 5;
            
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(`Figure for Q${index + 1}`, 20, y - 2);
            doc.setTextColor(0);
            doc.setFontSize(11);
          } catch (e) {
            console.error("Figure capture failed", e);
            doc.rect(20, y, 100, 30);
            doc.text("[Figure could not be rendered]", 25, y + 15);
            y += 35;
          }
        } else {
           doc.rect(20, y, 100, 30);
           doc.text("[Figure not found in view]", 25, y + 15);
           y += 35;
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

  // Search Logic for Exams
  const filteredExams = savedExams.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    
    if (item.title.toLowerCase().includes(query)) return true;
    if (item.subject.toLowerCase().includes(query)) return true;
    
    const examData = item.data as ExamPaper;
    // Deep search in questions
    if (examData.questions.some(q => q.questionText.toLowerCase().includes(query))) return true;

    return false;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Tabs */}
      <div className="flex justify-center mb-6 bg-neutral-900/50 p-1 rounded-lg w-fit mx-auto border border-edu-border">
        <button 
          onClick={() => setActiveView('create')}
          className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeView === 'create' ? 'bg-edu-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          Create New
        </button>
        <button 
          onClick={() => setActiveView('saved')}
          className={`px-6 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeView === 'saved' ? 'bg-edu-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          <History size={16} /> History
        </button>
      </div>

      {activeView === 'create' ? (
        <>
          <Card className="border-t-4 border-t-edu-primary">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FileQuestion className="text-edu-primary" />
              CBSE Exam Paper Generator
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-semibold">Subject & Class</label>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-neutral-900 border border-edu-border/50 rounded-lg p-3 flex items-center justify-center text-gray-400 font-semibold cursor-not-allowed">
                      Class {classLevel}
                    </div>
                    <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (Medium)</option>
                    </Select>
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
                      <option value="Hindi">Hindi</option>
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

            <div className="flex flex-col items-end gap-1">
              <Button onClick={handleCreate} disabled={loading || (!syllabus && !isFullSyllabus)}>
                {loading ? 'Designing Paper...' : 'Generate Exam Paper'}
              </Button>
              <span className="text-[10px] text-gray-500 font-mono">Estimated time: ~20-40s</span>
            </div>
          </Card>

          {loading && <LoadingSpinner />}

          {exam && !loading && (
            <div id="exam-paper-container" className="animate-fade-in space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-edu-card border border-edu-border p-6 rounded-xl">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{exam.title}</h2>
                    <Badge type="neutral">{subject}</Badge>
                    {(language === 'Hindi' || subject === 'Hindi') && <Badge type="warning">हिंदी माध्यम</Badge>}
                  </div>
                  <p className="text-gray-400 mt-1 flex items-center gap-4">
                    <span className="flex items-center gap-1"><CheckCircle size={14}/> Total Marks: <span className="text-edu-primary font-bold">{exam.totalMarks}</span></span>
                    <span className="flex items-center gap-1"><Calendar size={14}/> Duration: {exam.totalMarks === 80 ? '3 Hours' : '45 Mins'}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSave} disabled={saving} title="Save to Profile">
                    <Save size={18} className="mr-2"/> {saving ? 'Saving...' : 'Save'}
                  </Button>
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
        </>
      ) : (
        <div className="space-y-6 animate-fade-in">
           <h2 className="text-2xl font-bold mb-4">Saved Exams History</h2>

           <div className="relative mb-6">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
             <Input 
               placeholder="Search exams by title, subject, or questions..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-10"
             />
           </div>

           {loadingSaved ? <LoadingSpinner /> : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {filteredExams.length > 0 ? filteredExams.map((item) => (
                 <div key={item.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex justify-between items-center hover:border-edu-primary transition-colors cursor-pointer" onClick={() => handleViewSaved(item)}>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-white text-lg truncate">{item.title}</h3>
                      <p className="text-sm text-gray-500 truncate">{item.subject} • {new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Button variant="outline" className="h-10 w-10 !p-0 rounded-full flex items-center justify-center shrink-0">
                      <ChevronRight size={20} />
                    </Button>
                 </div>
               )) : (
                 <div className="col-span-2 text-center py-20 text-gray-500">
                   {searchQuery ? "No matching exams found." : "No saved exams found. Generate and save some!"}
                 </div>
               )}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default ExamGenerator;
