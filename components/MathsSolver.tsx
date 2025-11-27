import React, { useState, useRef } from 'react';
import { solveMathProblem } from '../services/geminiService';
import { MathSolution } from '../types';
import { Button, Card, Input, LoadingSpinner, Badge } from './UIComponents';
import { Calculator, Upload, Image as ImageIcon, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';

const MathsSolver: React.FC = () => {
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
        // Remove data URL prefix for API
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
      const result = await solveMathProblem(problemText, image || undefined);
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="border-t-4 border-t-edu-primary">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Calculator className="text-edu-primary" />
          AI Maths Solver
        </h2>
        
        <div className="space-y-4">
          <textarea
            className="w-full bg-black border border-edu-border rounded-lg p-4 text-white placeholder-neutral-500 focus:outline-none focus:border-edu-accent focus:ring-1 focus:ring-edu-accent transition-all h-32 resize-none"
            placeholder="Type your math problem here (e.g., 'Solve quadratic equation x^2 - 5x + 6 = 0')..."
            value={problemText}
            onChange={(e) => setProblemText(e.target.value)}
          />

          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden" 
              />
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full md:w-auto">
                <Upload size={18} /> Upload Image
              </Button>
              {image && (
                <div className="flex items-center gap-2 bg-neutral-900 px-3 py-2 rounded-lg border border-neutral-800">
                  <ImageIcon size={16} className="text-edu-primary" />
                  <span className="text-xs text-green-400">Image Loaded</span>
                  <button onClick={clearImage} className="text-gray-500 hover:text-white ml-2">✕</button>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 w-full md:w-auto">
              <Button onClick={handleSolve} disabled={loading || (!problemText && !image)} className="w-full md:w-auto">
                {loading ? 'Solving...' : 'Get Step-by-Step Solution'}
              </Button>
              <span className="text-[10px] text-gray-500 font-mono">Estimated time: ~15-20s</span>
            </div>
          </div>
        </div>
      </Card>

      {loading && <LoadingSpinner />}

      {solution && !loading && (
        <div className="animate-fade-in space-y-6">
          {/* Problem Statement */}
          <Card className="bg-neutral-900 border-l-4 border-l-blue-500">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-2">Problem</h3>
            <p className="text-white text-lg font-medium">{solution.problemStatement}</p>
          </Card>

          {/* Solution Steps */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-edu-primary w-8 h-8 rounded-full flex items-center justify-center text-black text-sm">✓</span>
              Step-by-Step Solution
            </h3>
            
            {solution.steps.map((step, idx) => (
              <div key={idx} className="bg-black border border-neutral-800 rounded-xl p-5 hover:border-edu-border/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-edu-primary">Step {idx + 1}: {step.stepTitle}</h4>
                </div>
                <p className="text-gray-300 mb-3">{step.description}</p>
                {step.equation && (
                  <div className="bg-neutral-900 p-3 rounded-lg font-mono text-center text-white border border-neutral-800">
                    {step.equation}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Final Answer */}
          <div className="bg-green-900/20 border border-green-800 rounded-xl p-6 text-center">
            <h3 className="text-green-500 uppercase text-xs font-bold tracking-widest mb-2">Final Answer</h3>
            <p className="text-2xl md:text-3xl font-black text-white">{solution.finalAnswer}</p>
          </div>

          {/* Tips & Errors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-yellow-900/10 border-yellow-900/50">
              <h3 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2">
                <Lightbulb size={20} />
                Key Tips to Remember
              </h3>
              <ul className="space-y-3">
                {solution.keyTips.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-gray-300 text-sm">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="bg-red-900/10 border-red-900/50">
              <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2">
                <AlertTriangle size={20} />
                Commonly Made Errors
              </h3>
              <ul className="space-y-3">
                {solution.commonErrors.map((err, i) => (
                  <li key={i} className="flex gap-3 text-gray-300 text-sm">
                    <span className="text-red-500 mt-0.5">•</span>
                    {err}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathsSolver;