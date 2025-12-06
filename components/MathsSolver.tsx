import React, { useState, useRef } from 'react';
import { solveMathProblem } from '../services/geminiService';
import { MathSolution } from '../types';
import { Button, Card, Accordion } from './UIComponents';
import { Calculator, ImageIcon, AlertTriangle, Lightbulb, ScanLine, Camera, X, CheckCircle, ListOrdered, Sparkles } from 'lucide-react';

interface MathsSolverProps {
  classLevel: string;
}

const MathsSolver: React.FC<MathsSolverProps> = ({ classLevel }) => {
  const [problemText, setProblemText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Keep only data part
        const base64Data = base64String.split(',')[1]; 
        setImage(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolve = async () => {
    if (!problemText && !image) {
      alert("Please enter a problem or upload an image.");
      return;
    }

    setLoading(true);
    setSolution(null);
    try {
      const result = await solveMathProblem(problemText || '', classLevel, image || undefined);
      setSolution(result);
    } catch (error: any) {
      alert(error.message || "Failed to solve problem. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in-up">
      <Card className="relative overflow-hidden border-t-4 border-t-blue-500">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <Calculator size={150} className="text-blue-500 rotate-12" />
        </div>
        
        <h2 className="text-3xl font-black mb-8 flex items-center gap-3 relative z-10">
          <span className="bg-blue-500/20 p-2.5 rounded-xl text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]"><Calculator size={24} /></span>
          AI Solver
        </h2>
        
        <div className="space-y-6 relative z-10">
          <div className="glass-input p-1 rounded-2xl border border-white/10 shadow-inner">
            <textarea
              className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 resize-none h-40 text-lg p-5 font-medium"
              placeholder="Type your math problem here (e.g., Integrate x^2 sin(x) dx)..."
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
            />
            
            <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-white/5 rounded-xl mt-1 gap-4">
               <div className="flex items-center gap-3 w-full md:w-auto">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-white bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm transition-all border border-white/10 font-semibold whitespace-nowrap"
                  >
                    <Camera size={18} /> Upload Photo
                  </button>
                  
                  {image && (
                    <div className="relative group animate-fade-in-up">
                      <div className="h-12 w-12 rounded-lg overflow-hidden border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        <img 
                          src={`data:image/png;base64,${image}`} 
                          alt="Problem Preview" 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button 
                        onClick={clearImage} 
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors transform hover:scale-110"
                        title="Remove Image"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
               </div>
               
               <Button onClick={handleSolve} disabled={loading || (!problemText && !image)} className="w-full md:w-auto px-10 shadow-lg hover:shadow-blue-500/20">
                 {loading ? 'Thinking...' : 'Solve Problem'}
               </Button>
            </div>
          </div>
        </div>
      </Card>

      {loading && (
         <div className="flex flex-col items-center justify-center p-16 glass-panel rounded-2xl bg-black/40 animate-fade-in-up">
            <div className="relative mb-8">
               <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-30 animate-pulse"></div>
               <ScanLine size={64} className="text-blue-400 relative z-10 animate-bounce" />
            </div>
            <h3 className="text-white font-bold text-2xl tracking-tight">Analyzing Problem...</h3>
            <p className="text-gray-400 mt-2">Identifying mathematical patterns and logic</p>
         </div>
      )}

      {solution && !loading && (
        <div className="animate-fade-in-up space-y-6">
          <Accordion title="Final Answer" defaultOpen={true} icon={<CheckCircle size={20} />}>
            <div className="text-center py-8">
               <div className="inline-block bg-gradient-to-br from-emerald-500/20 to-emerald-900/10 text-emerald-400 text-4xl font-black px-12 py-8 rounded-3xl border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                  {solution.finalAnswer}
               </div>
               <p className="text-gray-400 mt-6 text-lg font-medium">{solution.problemStatement}</p>
            </div>
          </Accordion>

          <Accordion title="Step-by-Step Method" defaultOpen={true} icon={<ListOrdered size={20} />}>
            <div className="space-y-10 px-4 py-4">
                {solution.steps.map((step, idx) => (
                  <div key={idx} className="relative pl-10 border-l-2 border-white/10 pb-2 group">
                      <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-surface border-4 border-blue-500 group-hover:scale-125 transition-transform shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                      
                      <h4 className="font-bold text-white text-xl mb-3 leading-none tracking-tight">{step.stepTitle}</h4>
                      <p className="text-gray-300 mb-5 text-base leading-relaxed">{step.description}</p>
                      
                      {step.equation && (
                        <div className="glass-panel p-6 rounded-2xl border border-white/10 font-mono text-xl text-center text-blue-300 overflow-x-auto shadow-inner bg-black/30">
                          {step.equation}
                        </div>
                      )}
                  </div>
                ))}
            </div>
          </Accordion>

          <Accordion title="AI Insight & Tips" defaultOpen={false} icon={<Sparkles size={20} />}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-500/10 to-transparent">
                  <h4 className="text-yellow-400 font-bold mb-4 flex items-center gap-2 text-lg"><Lightbulb size={20}/> Key Concepts</h4>
                  <ul className="space-y-3">
                    {solution.keyTips.map((tip, i) => (
                      <li key={i} className="flex gap-3 text-gray-300 text-sm">
                        <span className="text-yellow-500 mt-1">•</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-rose-500 bg-gradient-to-br from-rose-500/10 to-transparent">
                  <h4 className="text-rose-400 font-bold mb-4 flex items-center gap-2 text-lg"><AlertTriangle size={20}/> Common Mistakes</h4>
                  <ul className="space-y-3">
                    {solution.commonErrors.map((err, i) => (
                      <li key={i} className="flex gap-3 text-gray-300 text-sm">
                        <span className="text-rose-500 mt-1">•</span> {err}
                      </li>
                    ))}
                  </ul>
                </div>
             </div>
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default MathsSolver;