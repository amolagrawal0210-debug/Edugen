import React, { useState, useRef } from 'react';
import { solveMathProblem } from '../services/geminiService';
import { MathSolution } from '../types';
import { Button, Card, Accordion } from './UIComponents';
import { Calculator, ImageIcon, AlertTriangle, Lightbulb, ScanLine, Camera, X, Crop, CheckCircle, ListOrdered, Sparkles, UploadCloud } from 'lucide-react';

interface MathsSolverProps {
  classLevel: string;
}

const MathsSolver: React.FC<MathsSolverProps> = ({ classLevel }) => {
  const [problemText, setProblemText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [cropRect, setCropRect] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1]; 
        setTempImage(base64Data);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolveInternal = async (textOverride?: string, imageOverride?: string) => {
    const textToUse = textOverride !== undefined ? textOverride : problemText;
    const imageToUse = imageOverride !== undefined ? imageOverride : image;

    if (!textToUse && !imageToUse) {
      alert("Please enter a problem or upload an image.");
      return;
    }

    setLoading(true);
    setSolution(null);
    try {
      const result = await solveMathProblem(textToUse || '', classLevel, imageToUse || undefined);
      setSolution(result);
    } catch (error: any) {
      alert(error.message || "Failed to solve problem. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSolve = () => handleSolveInternal();

  const clearImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Cropper Logic
  const getClientCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    e.preventDefault(); 
    const rect = containerRef.current.getBoundingClientRect();
    const { x: clientX, y: clientY } = getClientCoordinates(e);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setIsDragging(true);
    setStartPos({ x, y });
    setCropRect({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const { x: clientX, y: clientY } = getClientCoordinates(e);
    const currentX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const currentY = Math.max(0, Math.min(clientY - rect.top, rect.height));
    const newX = Math.min(startPos.x, currentX);
    const newY = Math.min(startPos.y, currentY);
    const newW = Math.abs(currentX - startPos.x);
    const newH = Math.abs(currentY - startPos.y);
    setCropRect({ x: newX, y: newY, w: newW, h: newH });
  };

  const handleMouseUp = () => { setIsDragging(false); };

  const performCropAndSolve = () => {
    if (!imageRef.current || !cropRect || !tempImage) return;
    const naturalWidth = imageRef.current.naturalWidth;
    const displayedWidth = imageRef.current.clientWidth;
    const scale = naturalWidth / displayedWidth;
    const canvas = document.createElement('canvas');
    canvas.width = cropRect.w * scale;
    canvas.height = cropRect.h * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const sourceImage = new Image();
    sourceImage.onload = () => {
      ctx.drawImage(sourceImage, cropRect.x * scale, cropRect.y * scale, cropRect.w * scale, cropRect.h * scale, 0, 0, canvas.width, canvas.height);
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const croppedBase64 = croppedDataUrl.split(',')[1];
      setImage(croppedBase64); 
      setShowCropper(false);
      handleSolveInternal(undefined, croppedBase64);
    };
    sourceImage.src = `data:image/png;base64,${tempImage}`;
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
            
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl mt-1">
               <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-white bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm transition-all border border-white/10 font-semibold"
                  >
                    <Camera size={18} /> Snap Photo
                  </button>
                  
                  {image && (
                    <div className="flex items-center gap-2 bg-blue-500/20 px-4 py-2 rounded-full border border-blue-500/30 ml-2 animate-fade-in-up">
                      <ImageIcon size={14} className="text-blue-400" />
                      <span className="text-xs text-blue-200 font-bold">Image Ready</span>
                      <button onClick={clearImage} className="text-blue-300 hover:text-white">
                        <X size={14} />
                      </button>
                    </div>
                  )}
               </div>
               
               <Button onClick={() => handleSolve()} disabled={loading || (!problemText && !image)} className="px-10 shadow-lg hover:shadow-blue-500/20">
                 {loading ? 'Thinking...' : 'Solve'}
               </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Cropper Modal */}
      {showCropper && tempImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg mb-4 flex justify-between items-center text-white">
             <div>
                <h3 className="font-bold text-lg flex items-center gap-2 text-primary"><Crop size={20}/> Crop Problem</h3>
             </div>
             <button onClick={() => setShowCropper(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
          </div>
          
          <div 
             ref={containerRef}
             className="relative border border-white/20 touch-none select-none cursor-crosshair overflow-hidden rounded-xl bg-neutral-900 shadow-2xl"
             onMouseDown={handleMouseDown}
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseUp}
             onTouchStart={handleMouseDown}
             onTouchMove={handleMouseMove}
             onTouchEnd={handleMouseUp}
          >
             <img 
               ref={imageRef}
               src={`data:image/png;base64,${tempImage}`} 
               className="max-h-[60vh] max-w-full object-contain pointer-events-none"
               onLoad={(e) => {
                   const t = e.currentTarget;
                   setTimeout(() => {
                       if (t) setCropRect({ x: 0, y: 0, w: t.clientWidth, h: t.clientHeight });
                   }, 50);
               }}
             />
             <div className="absolute inset-0 bg-black/70 pointer-events-none" 
                  style={{
                    clipPath: cropRect && cropRect.w > 0 
                      ? `polygon(0% 0%, 0% 100%, ${cropRect.x}px 100%, ${cropRect.x}px ${cropRect.y}px, ${cropRect.x + cropRect.w}px ${cropRect.y}px, ${cropRect.x + cropRect.w}px ${cropRect.y + cropRect.h}px, ${cropRect.x}px ${cropRect.y + cropRect.h}px, ${cropRect.x}px 100%, 100% 100%, 100% 0%)`
                      : 'none'
                  }}>
             </div>
             {cropRect && cropRect.w > 0 && (
               <div 
                 className="absolute border-2 border-primary shadow-[0_0_20px_rgba(16,185,129,0.5)] bg-transparent pointer-events-none"
                 style={{ left: cropRect.x, top: cropRect.y, width: cropRect.w, height: cropRect.h }}
               />
             )}
          </div>
          
          <div className="mt-8 flex gap-4 w-full max-w-lg">
             <Button variant="secondary" className="flex-1" onClick={() => setShowCropper(false)}>Cancel</Button>
             <Button className="flex-[2]" onClick={performCropAndSolve}>Analyze</Button>
          </div>
        </div>
      )}

      {loading && !showCropper && (
         <div className="flex flex-col items-center justify-center p-16 glass-panel rounded-2xl bg-black/40">
            <div className="relative mb-8">
               <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-30 animate-pulse"></div>
               <ScanLine size={64} className="text-blue-400 relative z-10 animate-bounce" />
            </div>
            <h3 className="text-white font-bold text-2xl tracking-tight">Deconstructing...</h3>
            <p className="text-gray-400 mt-2">Identifying mathematical patterns</p>
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