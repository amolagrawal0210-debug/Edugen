import React, { useState, useEffect } from 'react';
import { generateStudyNotes } from '../services/geminiService';
import { StudyNote, SavedItem, User } from '../types';
import { Button, Card, Input, Select, LoadingSpinner, Badge, ProgressBar } from './UIComponents';
import { BookOpen, Printer, Lightbulb, Save, History, ChevronRight, Search, FileText, Sparkles, Zap, BrainCircuit, List } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import { saveGeneratedItem, getSavedItems } from '../services/firebaseService';

interface NotesGeneratorProps {
  classLevel: string;
  user: User | null;
}

const SUGGESTED_TOPICS: Record<string, string[]> = {
  'Physics': ['Light: Reflection and Refraction', 'Electricity', 'Human Eye', 'Motion', 'Gravitation', 'Force and Laws of Motion'],
  'Chemistry': ['Chemical Reactions', 'Acids, Bases and Salts', 'Metals and Non-metals', 'Carbon and its Compounds', 'Atoms and Molecules'],
  'Mathematics': ['Real Numbers', 'Polynomials', 'Triangles', 'Trigonometry', 'Statistics', 'Probability', 'Circles'],
  'Biology': ['Life Processes', 'Control and Coordination', 'Reproduction', 'Heredity', 'Our Environment'],
  'Computer Science': ['Python Basics', 'Data Handling', 'SQL', 'Networking', 'Cyber Safety'],
  'Social Science': ['Rise of Nationalism in Europe', 'Resources and Development', 'Power Sharing', 'Federalism'],
  'English': ['Letter to God', 'Nelson Mandela', 'Tenses', 'Modals', 'Reported Speech']
};

const NotesGenerator: React.FC<NotesGeneratorProps> = ({ classLevel, user }) => {
  const [activeView, setActiveView] = useState<'create' | 'saved'>('create');
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [note, setNote] = useState<StudyNote | null>(null);
  const [saving, setSaving] = useState(false);
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
    const combined = [...notes].sort((a, b) => b.createdAt - a.createdAt);
    setSavedItems(combined);
    setLoadingSaved(false);
  };

  const simulateProgress = () => {
    setProgressStep(1);
    setProgressMsg('Scanning NCERT Curriculum...');
    
    const t1 = setTimeout(() => {
        setProgressStep(2);
        setProgressMsg('Synthesizing Concepts & Tables...');
    }, 3000);
    
    const t2 = setTimeout(() => {
        setProgressStep(3);
        setProgressMsg('Generating Memory Hacks...');
    }, 8000);
    
    return () => { clearTimeout(t1); clearTimeout(t2); };
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setNote(null);
    const clearProgress = simulateProgress();
    
    try {
      const data = await generateStudyNotes(topic, classLevel, subject, language);
      setNote(data);
    } catch (error: any) {
      alert(error.message || "Failed to generate content. Please try again.");
    } finally {
      clearProgress();
      setLoading(false);
      setProgressStep(0);
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
      const element = document.getElementById('note-content-container');
      if (!element) return;
      try {
        const originalStyle = element.getAttribute('style');
        element.style.background = 'white';
        element.style.color = 'black';
        element.classList.add('pdf-capture-mode');
        
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
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
        
        element.setAttribute('style', originalStyle || '');
        element.style.background = '';
        element.style.color = '';
        element.classList.remove('pdf-capture-mode');
      } catch (err) { alert("PDF Error"); }
    }
  };

  const filteredItems = savedItems.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(query) || item.subject.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Top Tabs */}
      <div className="flex justify-center mb-8">
        <div className="glass-panel p-1 rounded-xl flex gap-1 bg-black/40">
          <button 
            onClick={() => setActiveView('create')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeView === 'create' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Create New
          </button>
          <button 
            onClick={() => setActiveView('saved')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeView === 'saved' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <History size={16} /> History
          </button>
        </div>
      </div>

      {activeView === 'create' ? (
        <>
          <Card className="relative overflow-hidden border-t-4 border-t-primary">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <BrainCircuit size={150} className="text-primary rotate-12" />
            </div>
            <h2 className="text-3xl font-black mb-8 flex items-center gap-3 relative z-10">
              <span className="bg-primary/20 p-2.5 rounded-xl text-primary shadow-[0_0_15px_rgba(16,185,129,0.3)]"><BookOpen size={24} /></span>
              Concept Engine
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
              <div className="md:col-span-1 glass-input rounded-xl p-3 flex flex-col items-center justify-center text-gray-400 font-bold border border-white/10">
                <span className="text-xs uppercase tracking-widest mb-1 text-primary-glow">Class Level</span>
                <span className="text-2xl text-white tracking-tighter">{classLevel}</span>
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
              
              <div className="md:col-span-2 relative">
                <Input 
                  list="topic-suggestions"
                  placeholder="Enter a specific topic..." 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="font-semibold text-lg"
                />
                <datalist id="topic-suggestions">
                   {SUGGESTED_TOPICS[subject]?.map((t) => <option key={t} value={t} />)}
                </datalist>
              </div>

              <div className="md:col-span-5 flex flex-col items-center gap-4 mt-6">
                {!loading ? (
                    <Button onClick={handleGenerate} disabled={!topic} className="w-full md:w-1/3 py-4 text-lg shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                      <Sparkles size={20} /> Generate Notes
                    </Button>
                ) : (
                    <div className="w-full md:w-2/3 glass-panel p-8 rounded-2xl bg-black/40">
                       <ProgressBar step={progressStep} totalSteps={3} message={progressMsg} />
                    </div>
                )}
              </div>
            </div>
          </Card>

          {/* Render STUDY NOTES */}
          {note && !loading && (
            <div id="note-content-container" className="animate-fade-in-up space-y-8">
               <div className="flex justify-between items-center mb-6 flex-wrap gap-4 glass-panel p-8 rounded-3xl border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
                  <div>
                    <Badge type="accent">{note.subject}</Badge>
                    <h1 className="text-4xl md:text-5xl font-black text-white mt-3 tracking-tighter">{note.topic}</h1>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="!px-4" onClick={handleSave} disabled={saving}>
                      <Save size={18} className="mr-2" /> {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="secondary" className="!px-4" onClick={downloadPDF}>
                      <Printer size={18} className="mr-2" /> PDF
                    </Button>
                  </div>
               </div>
               
               <Card className="bg-gradient-to-br from-primary-20 to-transparent border-primary/20">
                 <div className="flex gap-6 items-start">
                   <div className="bg-primary/20 p-4 rounded-2xl shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                     <Lightbulb className="text-primary-glow" size={32} />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">The Hook</h3>
                     <p className="text-gray-200 italic leading-relaxed text-lg font-medium">"{note.intro}"</p>
                   </div>
                 </div>
               </Card>

               <div className="grid gap-8">
                 {note.sections.map((section, idx) => (
                   <Card key={idx} className="relative overflow-hidden group hover:border-white/20 transition-all">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/10 transition-all"></div>
                     
                     <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-4 border-b border-white/5 pb-4">
                       <span className="bg-gradient-to-br from-white/10 to-transparent text-primary-glow w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-inner border border-white/5">{idx + 1}</span>
                       {section.title}
                     </h3>
                     
                     <ul className="space-y-4 mb-8 ml-2">
                       {section.content.map((point, pIdx) => (
                         <li key={pIdx} className="flex gap-4 text-gray-300 group/item hover:text-white transition-colors">
                           <span className="text-primary mt-1.5 opacity-50 group-hover/item:opacity-100 transition-opacity"><Zap size={16} fill="currentColor" /></span>
                           <span className="leading-relaxed text-lg">{point}</span>
                         </li>
                       ))}
                     </ul>
                     
                     {section.table && (
                        <div className="overflow-x-auto mb-4 border border-white/10 rounded-xl bg-black/30 shadow-inner">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-primary-glow uppercase font-bold text-xs tracking-wider">
                              <tr>{section.table.headers.map((h, i) => <th key={i} className="px-6 py-4">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {section.table.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                                  {row.map((cell, cIdx) => <td key={cIdx} className="px-6 py-4 text-gray-300">{cell}</td>)}
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
                 <div className="grid md:grid-cols-2 gap-6">
                     {note.mnemonics.map((m, i) => (
                       <div key={i} className="glass-panel p-6 rounded-2xl border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-500/10 to-transparent relative overflow-hidden hover:translate-y-[-2px] transition-transform">
                         <div className="flex justify-between items-start mb-3">
                            <span className="text-yellow-400 font-black text-xl tracking-wide">{m.name}</span>
                            <Badge type="warning">Memory Hack</Badge>
                         </div>
                         <p className="text-gray-300">{m.description}</p>
                       </div>
                     ))}
                 </div>
               )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6 animate-fade-in-up">
           <div className="relative mb-6">
             <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
             <Input 
               placeholder="Search your library..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-12"
             />
           </div>

           {loadingSaved ? <LoadingSpinner /> : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {filteredItems.length > 0 ? filteredItems.map((item) => {
                 const noteData = item.data as StudyNote;
                 return (
                 <div key={item.id} className="glass-panel p-6 rounded-2xl flex justify-between items-center hover:bg-white/5 hover:border-primary/50 transition-all cursor-pointer group glass-card-hover" onClick={() => handleViewSaved(item)}>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2 mb-2">
                         <FileText size={14} className="text-primary"/>
                         <Badge type="neutral" >NOTES</Badge>
                      </div>
                      <h3 className="font-bold text-white text-lg truncate group-hover:text-primary-glow transition-colors">{item.title}</h3>
                      <div className="text-sm text-gray-500 flex flex-col gap-0.5 mt-1">
                          <span className="font-semibold text-gray-400">{item.subject} • Class {noteData.classLevel}</span>
                          <span className="text-xs opacity-50">{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button variant="ghost" className="h-10 w-10 !p-0 rounded-full flex items-center justify-center shrink-0 border border-white/5 group-hover:bg-white/10 group-hover:text-white">
                      <ChevronRight size={20} />
                    </Button>
                 </div>
               )}) : (
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