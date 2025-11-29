import React, { useState, useEffect } from 'react';
import { generateStudyNotes } from '../services/geminiService';
import { StudyNote, SavedItem } from '../types';
import { Button, Card, Input, Select, LoadingSpinner, Badge } from './UIComponents';
import { BookOpen, Printer, Brain, HelpCircle, Lightbulb, Save, History, ChevronRight, Search } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import { saveGeneratedItem, getSavedItems } from '../services/firebaseService';
import { User } from 'firebase/auth';

interface NotesGeneratorProps {
  classLevel: string;
  user: User | null;
}

const NotesGenerator: React.FC<NotesGeneratorProps> = ({ classLevel, user }) => {
  const [activeView, setActiveView] = useState<'create' | 'saved'>('create');
  
  // Creation State
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<StudyNote | null>(null);
  const [saving, setSaving] = useState(false);

  // Saved State
  const [savedNotes, setSavedNotes] = useState<SavedItem[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeView === 'saved' && user) {
      loadSavedNotes();
    }
  }, [activeView, user]);

  const loadSavedNotes = async () => {
    if (!user) return;
    setLoadingSaved(true);
    const items = await getSavedItems(user.uid, 'note');
    setSavedNotes(items);
    setLoadingSaved(false);
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setNote(null); // Clear previous
    try {
      const data = await generateStudyNotes(topic, classLevel, subject, language);
      setNote(data);
    } catch (error: any) {
      alert(error.message || "Failed to generate notes. Please check your API key or try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !note) return;
    setSaving(true);
    try {
      await saveGeneratedItem(user.uid, 'note', note.topic, note.subject, note);
      alert("Note saved successfully!");
    } catch (e) {
      alert("Failed to save note.");
    } finally {
      setSaving(false);
    }
  };

  const handleViewSaved = (item: SavedItem) => {
    setNote(item.data as StudyNote);
    setActiveView('create'); // Go back to view mode
    // Optional: Pre-fill input states based on saved item if desired
  };

  const downloadNotesPDF = async () => {
    if (!note) return;

    // Use Image-based generation for Hindi or Hindi Subject to preserve font rendering
    if (language === 'Hindi' || subject === 'Hindi') {
      const element = document.getElementById('note-content-container');
      if (!element) return;

      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: '#000000', // Capture dark theme correctly or set to white if preferred
          useCORS: true,
          logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        
        // Calculate height for full width
        const imgHeightInPdf = (imgHeight * pdfWidth) / imgWidth;
        let heightLeft = imgHeightInPdf;
        let position = 0;

        // Multi-page logic for long notes
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
        heightLeft -= pdfHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeightInPdf;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
          heightLeft -= pdfHeight;
        }

        pdf.save(`${note.topic}_Hindi_Notes.pdf`);
      } catch (err) {
        console.error("PDF Gen Error", err);
        alert("Could not generate Hindi PDF.");
      }
      return;
    }

    // Default English Text-Based PDF (Better Selectability)
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    const checkPageBreak = (h: number) => {
      if (y + h > 280) {
        doc.addPage();
        y = 20;
        return true;
      }
      return false;
    };

    // Helper to estimate height
    const getLinesHeight = (text: string, fontSize: number, width: number) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, width);
      return { lines, height: lines.length * (fontSize * 0.5) + 2 }; // approx height multiplier
    };

    // Title
    doc.setFontSize(22);
    doc.setTextColor(22, 163, 74); // Edu Green
    doc.setFont("helvetica", "bold");
    doc.text(note.topic, pageWidth / 2, y, { align: "center" });
    y += 10;

    // Subject Info
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Class: ${classLevel} | Subject: ${subject}`, pageWidth / 2, y, { align: "center" });
    y += 15;

    // Intro Box
    doc.setFont("helvetica", "italic");
    const { lines: introLines, height: introHeight } = getLinesHeight(note.intro, 11, pageWidth - 40);
    
    doc.setFillColor(240, 255, 240);
    doc.rect(15, y, pageWidth - 30, introHeight + 10, 'F');
    doc.setTextColor(0);
    doc.text(introLines, 20, y + 8);
    y += introHeight + 20;

    // Sections
    note.sections.forEach((section, idx) => {
      checkPageBreak(40);
      
      // Section Title
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text(`${idx + 1}. ${section.title}`, 15, y);
      y += 10;

      // Content
      doc.setFont("helvetica", "normal");
      section.content.forEach((point) => {
        const { lines, height } = getLinesHeight(`• ${point}`, 11, pageWidth - 35);
        checkPageBreak(height);
        doc.text(lines, 20, y);
        y += height + 2;
      });
      y += 5;

      // Table (if exists)
      if (section.table) {
        checkPageBreak(40);
        const colWidth = (pageWidth - 40) / section.table.headers.length;
        
        // Header
        doc.setFillColor(22, 163, 74);
        doc.rect(20, y, pageWidth - 40, 10, 'F');
        doc.setTextColor(255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        section.table.headers.forEach((h, i) => {
          doc.text(h, 22 + (i * colWidth), y + 7);
        });
        y += 10;

        // Rows
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        
        section.table.rows.forEach((row, rIdx) => {
          // Calculate Row Height dynamically
          let maxRowHeight = 10;
          const rowData = row.map((cell) => {
             const { lines } = getLinesHeight(cell, 10, colWidth - 4);
             const h = lines.length * 5 + 4;
             if (h > maxRowHeight) maxRowHeight = h;
             return lines;
          });

          checkPageBreak(maxRowHeight);

          // Alternating row color
          if (rIdx % 2 === 0) doc.setFillColor(245, 245, 245);
          else doc.setFillColor(255, 255, 255);
          
          doc.rect(20, y, pageWidth - 40, maxRowHeight, 'F');
          
          rowData.forEach((lines, cIdx) => {
             doc.text(lines, 22 + (cIdx * colWidth), y + 5);
          });
          
          y += maxRowHeight;
        });
        y += 10;
      }
    });

    // Mnemonics
    if (note.mnemonics.length > 0) {
      checkPageBreak(50);
      let mnY = y;
      
      doc.setFontSize(12);
      doc.setTextColor(180, 83, 9); // Brownish
      doc.setFont("helvetica", "bold");
      doc.text("Memory Hacks / Mnemonics", 20, mnY + 8);
      mnY += 12;
      
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.setFont("helvetica", "normal");
      
      let mnContentHeight = 12;
      
      note.mnemonics.forEach(m => {
        const { lines, height } = getLinesHeight(`${m.name}: ${m.description}`, 11, pageWidth - 40);
        mnContentHeight += height + 4;
      });

      // Draw background rect first
      doc.setFillColor(255, 250, 205); 
      doc.rect(15, y, pageWidth - 30, mnContentHeight, 'F');
      
      // Redraw title on top of rect
      doc.setFontSize(12);
      doc.setTextColor(180, 83, 9);
      doc.setFont("helvetica", "bold");
      doc.text("Memory Hacks / Mnemonics", 20, y + 8);
      
      y += 12;
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.setFont("helvetica", "normal");

      note.mnemonics.forEach(m => {
        const { lines, height } = getLinesHeight(`${m.name}: ${m.description}`, 11, pageWidth - 40);
        doc.text(lines, 20, y + 5);
        y += height + 4;
      });
      y += 10;
    }

    // IST & MCQs
    checkPageBreak(60);
    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74);
    doc.setFont("helvetica", "bold");
    doc.text("IST (It's a Sawal Time)", 15, y);
    y += 10;
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    
    note.practiceQuestions.forEach((q, i) => {
       const { lines: qLines, height: qH } = getLinesHeight(`Q${i+1}: ${q.question}`, 11, pageWidth - 35);
       checkPageBreak(qH);
       doc.text(qLines, 20, y);
       y += qH + 2;
       
       const { lines: aLines, height: aH } = getLinesHeight(`Ans: ${q.answer}`, 11, pageWidth - 35);
       checkPageBreak(aH);
       doc.setTextColor(100);
       doc.text(aLines, 20, y);
       doc.setTextColor(0);
       y += aH + 5;
    });

    doc.save(`${note.topic}_Notes.pdf`);
  };

  // Search Logic
  const filteredNotes = savedNotes.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const noteData = item.data as StudyNote;

    // Search top-level fields
    if (item.title.toLowerCase().includes(query)) return true;
    if (item.subject.toLowerCase().includes(query)) return true;

    // Search deep content
    if (noteData.intro?.toLowerCase().includes(query)) return true;
    
    // Search sections
    if (noteData.sections?.some(section => 
      section.title.toLowerCase().includes(query) || 
      section.content.some(c => c.toLowerCase().includes(query)) ||
      section.keywords.some(k => k.toLowerCase().includes(query))
    )) return true;

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
              <BookOpen className="text-edu-primary" />
              Generate AI Power Notes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-1 bg-neutral-900 border border-edu-border/50 rounded-lg p-3 flex items-center justify-center text-gray-400 font-semibold cursor-not-allowed">
                Class {classLevel}
              </div>
              <Select value={language} onChange={(e) => setLanguage(e.target.value)} className="md:col-span-1">
                <option value="English">English</option>
                <option value="Hindi">Hindi (Medium)</option>
              </Select>
              <Select value={subject} onChange={(e) => setSubject(e.target.value)} className="md:col-span-1">
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
                <option value="Computer Science">Computer Science</option>
                <option value="English">English</option>
                <option value="Social Science">Social Science</option>
                <option value="Hindi">Hindi</option>
              </Select>
              <Input 
                placeholder="Enter Topic (e.g., Ray Optics)" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="md:col-span-2"
              />
              <div className="md:col-span-5 flex flex-col items-center gap-1">
                <Button onClick={handleGenerate} disabled={loading || !topic} className="w-full md:w-1/2">
                  {loading ? 'Processing...' : 'Generate Notes'}
                </Button>
                <span className="text-[10px] text-gray-500 font-mono">Estimated time: ~10-20s</span>
              </div>
            </div>
          </Card>

          {loading && <LoadingSpinner />}

          {note && !loading && (
            <div id="note-content-container" className="animate-fade-in space-y-6 bg-black p-4 md:p-0">
              {/* Header */}
              <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                <h1 className="text-3xl font-extrabold text-edu-primary tracking-tight">{note.topic}</h1>
                <div className="flex gap-2">
                  <Button variant="outline" className="!px-4" onClick={handleSave} disabled={saving}>
                    <Save size={18} className="mr-2" /> {saving ? 'Saving...' : 'Save to Profile'}
                  </Button>
                  <Button variant="secondary" className="!px-4" onClick={downloadNotesPDF}>
                    <Printer size={18} className="mr-2" /> Download PDF
                  </Button>
                </div>
              </div>
              
              {/* Intro Hook */}
              <Card className="bg-gradient-to-r from-green-900/20 to-black border-l-4 border-l-edu-primary">
                <div className="flex gap-4">
                  <div className="bg-edu-primary/20 p-3 rounded-full h-fit">
                    <Lightbulb className="text-edu-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Introduction</h3>
                    <p className="text-gray-300 italic leading-relaxed">"{note.intro}"</p>
                  </div>
                </div>
              </Card>

              {/* Content Sections */}
              <div className="grid gap-8">
                {note.sections.map((section, idx) => (
                  <Card key={idx} className="relative overflow-hidden border border-neutral-800">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-800 pb-3">
                      <span className="bg-edu-primary text-black w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg">{idx + 1}</span>
                      {section.title}
                    </h3>
                    
                    <ul className="space-y-3 mb-6 ml-2">
                      {section.content.map((point, pIdx) => (
                        <li key={pIdx} className="flex gap-3 text-gray-300">
                          <span className="text-edu-primary font-bold mt-1">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Comparison Table Render */}
                    {section.table && (
                      <div className="overflow-x-auto mb-4 border border-neutral-800 rounded-lg">
                        <table className="w-full text-left text-sm text-gray-400">
                          <thead className="bg-neutral-900 text-white uppercase font-bold">
                            <tr>
                              {section.table.headers.map((h, i) => (
                                <th key={i} className="px-4 py-3">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-800">
                            {section.table.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-neutral-900/50">
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="px-4 py-3 text-gray-300">{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {section.keywords.map((kw, kIdx) => (
                        <Badge key={kIdx} type="neutral">{kw}</Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Mnemonics */}
              {note.mnemonics.length > 0 && (
                <Card className="bg-yellow-900/10 border-yellow-900/50">
                  <h3 className="text-xl font-bold text-yellow-500 mb-4 flex items-center gap-2">
                    <Brain size={24} />
                    Memory Hacks (Mnemonics)
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {note.mnemonics.map((m, i) => (
                      <div key={i} className="bg-black/40 p-4 rounded-lg border border-yellow-900/30">
                        <span className="text-yellow-400 font-bold block mb-1">{m.name}</span>
                        <span className="text-gray-400 text-sm">{m.description}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* IST Questions */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card title="IST (It's a Sawal Time)">
                  <div className="space-y-4">
                    {note.practiceQuestions.map((q, i) => (
                      <div key={i} className="bg-neutral-900 p-4 rounded-lg">
                        <p className="text-white font-medium mb-2 flex gap-2">
                          <HelpCircle size={18} className="text-edu-primary mt-0.5" />
                          {q.question}
                        </p>
                        <p className="text-gray-400 text-sm pl-6 border-l-2 border-edu-border">
                          Ans: {q.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Quick MCQs">
                  <div className="space-y-4">
                    {note.mcqs.map((mcq, i) => (
                      <div key={i} className="bg-neutral-900 p-4 rounded-lg">
                        <p className="text-white font-medium mb-3">{i+1}. {mcq.question}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {mcq.options.map((opt, oIdx) => (
                            <div key={oIdx} className={`text-xs p-2 rounded border ${opt === mcq.answer ? 'border-green-600 bg-green-900/20 text-green-400' : 'border-neutral-800 text-gray-500'}`}>
                              {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Summary Table */}
              <Card className="bg-neutral-900 border-edu-primary/30">
                <h3 className="text-lg font-bold text-white mb-4">Quick Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {note.summaryTable.map((item, i) => (
                    <div key={i} className="p-3 bg-black rounded border border-neutral-800">
                      <div className="text-edu-primary font-bold text-sm mb-1">{item.concept}</div>
                      <div className="text-gray-400 text-xs">{item.description}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6 animate-fade-in">
           <h2 className="text-2xl font-bold mb-4">Saved Notes History</h2>
           
           <div className="relative mb-6">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
             <Input 
               placeholder="Search notes by title, topic, or content..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-10"
             />
           </div>

           {loadingSaved ? <LoadingSpinner /> : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {filteredNotes.length > 0 ? filteredNotes.map((item) => (
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
                   {searchQuery ? "No matching notes found." : "No saved notes found. Generate and save some!"}
                 </div>
               )}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default NotesGenerator;