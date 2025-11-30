
import React, { useState, useEffect } from 'react';
import { generateStudyNotes } from '../services/geminiService';
import { StudyNote, SavedItem, User } from '../types';
import { Button, Card, Input, Select, LoadingSpinner, Badge } from './UIComponents';
import { BookOpen, Printer, Lightbulb, Save, History, ChevronRight, Search, FileText } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import { saveGeneratedItem, getSavedItems } from '../services/firebaseService';

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
  
  // Data States
  const [note, setNote] = useState<StudyNote | null>(null);
  const [saving, setSaving] = useState(false);

  // Saved State
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeView === 'saved' && user) {
      loadSavedItems();
    }
  }, [activeView, user]);

  const loadSavedItems = async () => {
    if (!user) return;
    setLoadingSaved(true);
    const notes = await getSavedItems(user.uid, 'note');
    // Removed mindmap fetching
    const combined = [...notes].sort((a, b) => b.createdAt - a.createdAt);
    setSavedItems(combined);
    setLoadingSaved(false);
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setNote(null);
    
    try {
      const data = await generateStudyNotes(topic, classLevel, subject, language);
      setNote(data);
    } catch (error: any) {
      alert(error.message || "Failed to generate content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!note) return;

    setSaving(true);
    try {
      await saveGeneratedItem(user.uid, 'note', note.topic, note.subject, note);
      alert('Note saved successfully!');
    } catch (e) {
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleViewSaved = (item: SavedItem) => {
    if (item.type === 'note') {
      setNote(item.data as StudyNote);
      setActiveView('create');
    }
  };

  const downloadPDF = async () => {
    if (note) {
      downloadNotesPDF();
    }
  };

  const downloadNotesPDF = async () => {
    if (!note) return;
    
    const element = document.getElementById('note-content-container');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#000000', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pdfW) / canvas.width;
      let hLeft = imgH;
      let pos = 0;
      pdf.addImage(imgData, 'PNG', 0, pos, pdfW, imgH);
      hLeft -= pdfH;
      while (hLeft >= 0) {
        pos = hLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, pos, pdfW, imgH);
        hLeft -= pdfH;
      }
      pdf.save(`${note.topic}_Notes.pdf`);
    } catch (err) { alert("PDF Error"); }
  };

  // Search Logic
  const filteredItems = savedItems.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    
    if (item.title.toLowerCase().includes(query)) return true;
    if (item.subject.toLowerCase().includes(query)) return true;
    if (item.type.includes(query)) return true;
    
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
              Generate Study Notes
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
                placeholder="Enter Topic (e.g., Photosynthesis)" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="md:col-span-2"
              />
              <div className="md:col-span-5 flex flex-col items-center gap-1">
                <Button onClick={handleGenerate} disabled={loading || !topic} className="w-full md:w-1/2">
                  {loading ? 'Generating Notes...' : 'Generate Notes'}
                </Button>
                <span className="text-[10px] text-gray-500 font-mono">
                  Estimated time: ~10-15s
                </span>
              </div>
            </div>
          </Card>

          {loading && <LoadingSpinner />}

          {/* Render STUDY NOTES */}
          {note && !loading && (
            <div id="note-content-container" className="animate-fade-in space-y-6 bg-black p-4 md:p-0">
               <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                  <h1 className="text-3xl font-extrabold text-edu-primary tracking-tight">{note.topic}</h1>
                  <div className="flex gap-2">
                    <Button variant="outline" className="!px-4" onClick={handleSave} disabled={saving}>
                      <Save size={18} className="mr-2" /> {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="secondary" className="!px-4" onClick={downloadPDF}>
                      <Printer size={18} className="mr-2" /> PDF
                    </Button>
                  </div>
               </div>
               
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
                     {section.table && (
                        <div className="overflow-x-auto mb-4 border border-neutral-800 rounded-lg">
                          <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-neutral-900 text-white uppercase font-bold">
                              <tr>{section.table.headers.map((h, i) => <th key={i} className="px-4 py-3">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                              {section.table.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-neutral-900/50">
                                  {row.map((cell, cIdx) => <td key={cIdx} className="px-4 py-3 text-gray-300">{cell}</td>)}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                   </Card>
                 ))}
               </div>
               
               {note.mnemonics.length > 0 && (
                 <Card className="bg-yellow-900/10 border-yellow-900/50">
                   <h3 className="text-xl font-bold text-yellow-500 mb-4">Memory Hacks</h3>
                   <div className="grid gap-4 md:grid-cols-2">
                     {note.mnemonics.map((m, i) => (
                       <div key={i} className="bg-black/40 p-3 rounded border border-yellow-900/30">
                         <span className="text-yellow-400 font-bold block">{m.name}</span>
                         <span className="text-gray-400 text-xs">{m.description}</span>
                       </div>
                     ))}
                   </div>
                 </Card>
               )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6 animate-fade-in">
           <h2 className="text-2xl font-bold mb-4">Saved Content History</h2>
           
           <div className="relative mb-6">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
             <Input 
               placeholder="Search by title, type or subject..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-10"
             />
           </div>

           {loadingSaved ? <LoadingSpinner /> : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {filteredItems.length > 0 ? filteredItems.map((item) => (
                 <div key={item.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex justify-between items-center hover:border-edu-primary transition-colors cursor-pointer" onClick={() => handleViewSaved(item)}>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2 mb-1">
                         <FileText size={14} className="text-blue-400"/>
                         <Badge type="neutral" >NOTES</Badge>
                      </div>
                      <h3 className="font-bold text-white text-lg truncate">{item.title}</h3>
                      <p className="text-sm text-gray-500 truncate">{item.subject} • {new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Button variant="outline" className="h-10 w-10 !p-0 rounded-full flex items-center justify-center shrink-0">
                      <ChevronRight size={20} />
                    </Button>
                 </div>
               )) : (
                 <div className="col-span-2 text-center py-20 text-gray-500">
                   {searchQuery ? "No matching items found." : "No saved notes found."}
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
