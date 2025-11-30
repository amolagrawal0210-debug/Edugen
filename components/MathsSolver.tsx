
import React, { useState, useRef, useEffect } from 'react';
import { solveMathProblem } from '../services/geminiService';
import { MathSolution } from '../types';
import { Button, Card, LoadingSpinner, Accordion } from './UIComponents';
import { Calculator, Upload, Image as ImageIcon, AlertTriangle, Lightbulb, ScanLine, Camera, X, Crop, MousePointer2, CheckCircle, ListOrdered, Sparkles } from 'lucide-react';

const MathsSolver: React.FC = () => {
  const [problemText, setProblemText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Cropper State
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null); // Raw base64
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
        // Keep the raw base64 data separate from the Data URL for logic
        const base64Data = base64String.split(',')[1]; 
        
        // AUTO TRIGGER LOGIC: Open cropper immediately for precision
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
      const result = await solveMathProblem(textToUse || '', imageToUse || undefined);
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

  // --- Cropper Logic ---

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

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const performCropAndSolve = () => {
    if (!imageRef.current || !cropRect || !tempImage) return;

    // 1. Calculate scaling ratio
    const naturalWidth = imageRef.current.naturalWidth;
    const displayedWidth = imageRef.current.clientWidth;
    const scale = naturalWidth / displayedWidth;

    // 2. Create Canvas
    const canvas = document.createElement('canvas');
    canvas.width = cropRect.w * scale;
    canvas.height = cropRect.h * scale;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // 3. Draw cropped image
    const sourceImage = new Image();
    sourceImage.onload = () => {
      ctx.drawImage(
        sourceImage,
        cropRect.x * scale, cropRect.y * scale, cropRect.w * scale, cropRect.h * scale, // Source
        0, 0, canvas.width, canvas.height // Dest
      );
      
      // 4. Get Data URL and Solve
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const croppedBase64 = croppedDataUrl.split(',')[1];
      
      setImage(croppedBase64); // Show the cropped version in main UI
      setShowCropper(false);
      
      // AUTO TRIGGER SOLVE
      handleSolveInternal(undefined, croppedBase64);
    };
    sourceImage.src = `data:image/png;base64,${tempImage}`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="border-t-4 border-t-edu-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <Calculator size={100} />
        </div>
        
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 relative z-10">
          <Calculator className="text-edu-primary" />
          AI Maths Solver
        </h2>
        
        <div className="space-y-6 relative z-10">
          {/* Main Input Area */}
          <div className="bg-black/40 p-4 rounded-xl border border-neutral-800">
            <textarea
              className="w-full bg-transparent border-none text-white placeholder-neutral-500 focus:ring-0 resize-none h-24 text-lg"
              placeholder="e.g. Integrate x^2 sin(x) dx"
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
            />
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-neutral-800">
               <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-all shadow-lg shadow-indigo-500/20"
                  >
                    <Camera size={16} /> Snap/Upload Problem
                  </button>
                  
                  {image && (
                    <div className="flex items-center gap-2 bg-neutral-800 px-3 py-1.5 rounded-full border border-neutral-700 ml-2 animate-fade-in">
                      <ImageIcon size={14} className="text-edu-primary" />
                      <span className="text-xs text-white">Image Ready</span>
                      <button onClick={clearImage} className="text-gray-500 hover:text-red-400">
                        <X size={14} />
                      </button>
                    </div>
                  )}
               </div>
               
               <Button onClick={() => handleSolve()} disabled={loading || (!problemText && !image)} className="px-8">
                 {loading ? 'Analyzing...' : 'Solve Problem'}
               </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Cropper Modal */}
      {showCropper && tempImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg mb-4 flex justify-between items-center text-white">
             <div>
                <h3 className="font-bold text-lg flex items-center gap-2"><Crop size={20} className="text-indigo-400"/> Crop Problem</h3>
                <p className="text-xs text-gray-400">Select the specific question to solve.</p>
             </div>
             <button onClick={() => setShowCropper(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
          </div>
          
          <div 
             ref={containerRef}
             className="relative border-2 border-white/20 touch-none select-none cursor-crosshair overflow-hidden rounded-lg bg-neutral-900"
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
             <div className="absolute inset-0 bg-black/50 pointer-events-none" 
                  style={{
                    clipPath: cropRect && cropRect.w > 0 
                      ? `polygon(0% 0%, 0% 100%, ${cropRect.x}px 100%, ${cropRect.x}px ${cropRect.y}px, ${cropRect.x + cropRect.w}px ${cropRect.y}px, ${cropRect.x + cropRect.w}px ${cropRect.y + cropRect.h}px, ${cropRect.x}px ${cropRect.y + cropRect.h}px, ${cropRect.x}px 100%, 100% 100%, 100% 0%)`
                      : 'none'
                  }}>
             </div>
             {cropRect && cropRect.w > 0 && (
               <div 
                 className="absolute border-2 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] bg-transparent pointer-events-none"
                 style={{
                   left: cropRect.x,
                   top: cropRect.y,
                   width: cropRect.w,
                   height: cropRect.h
                 }}
               />
             )}
          </div>
          
          <div className="mt-6 flex gap-4 w-full max-w-lg">
             <Button variant="secondary" className="flex-1" onClick={() => setShowCropper(false)}>Cancel</Button>
             <Button className="flex-[2] bg-indigo-600 hover:bg-indigo-500" onClick={performCropAndSolve}>
               Analyze Selection
             </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !showCropper && (
         <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/50 rounded-xl border border-neutral-800 animate-pulse">
            <div className="relative">
               <div className="absolute inset-0 bg-edu-primary blur-xl opacity-20 animate-pulse"></div>
               <ScanLine size={48} className="text-edu-primary relative z-10 animate-bounce" />
            </div>
            <h3 className="text-white font-bold mt-6 text-xl">Analyzing Problem...</h3>
            <p className="text-gray-400 text-sm mt-2">Identifying numbers, symbols & logic</p>
         </div>
      )}

      {/* Results */}
      {solution && !loading && (
        <div className="animate-fade-in space-y-4">
          
          {/* 1. Final Answer Accordion */}
          <Accordion title="Final Answer" defaultOpen={true} icon={<CheckCircle size={18} />}>
            <div className="text-center py-4">
               <div className="inline-block bg-green-900/20 text-green-400 text-2xl font-black px-8 py-4 rounded-xl border border-green-800 shadow-lg">
                  {solution.finalAnswer}
               </div>
               <p className="text-gray-400 mt-2 text-sm">{solution.problemStatement}</p>
            </div>
          </Accordion>

          {/* 2. Step-by-Step Accordion */}
          <Accordion title="Step-by-Step CBSE Method" defaultOpen={true} icon={<ListOrdered size={18} />}>
            <div className="space-y-6 px-2">
                {solution.steps.map((step, idx) => (
                  <div key={idx} className="relative pl-6 border-l-2 border-neutral-700 hover:border-edu-primary transition-colors pb-2">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-neutral-900 border-2 border-edu-primary"></div>
                      
                      <h4 className="font-bold text-white text-lg mb-1 leading-none">{step.stepTitle}</h4>
                      <p className="text-gray-400 mb-3 text-sm">{step.description}</p>
                      
                      {step.equation && (
                        <div className="bg-neutral-800 p-3 rounded-lg border border-neutral-700 font-mono text-lg text-center text-green-300 my-2 overflow-x-auto">
                          {step.equation}
                        </div>
                      )}
                  </div>
                ))}
            </div>
          </Accordion>

          {/* 3. AI Insight Accordion */}
          <Accordion title="AI Insight & Coaching Tips" defaultOpen={false} icon={<Sparkles size={18} />}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-yellow-500 font-bold mb-3 flex items-center gap-2"><Lightbulb size={16}/> Key Concepts</h4>
                  <ul className="space-y-2">
                    {solution.keyTips.map((tip, i) => (
                      <li key={i} className="flex gap-2 text-gray-300 text-sm">
                        <span className="text-yellow-500">•</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2"><AlertTriangle size={16}/> Common Mistakes</h4>
                  <ul className="space-y-2">
                    {solution.commonErrors.map((err, i) => (
                      <li key={i} className="flex gap-2 text-gray-300 text-sm">
                        <span className="text-red-500">•</span> {err}
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
