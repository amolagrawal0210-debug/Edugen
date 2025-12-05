import React, { useState } from 'react';
import { analyzeStudentPerformance } from '../services/geminiService';
import { AnalyticsData } from '../types';
import { Button, Card, LoadingSpinner, Badge } from './UIComponents';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Activity, Zap, AlertOctagon, TrendingUp, Sparkles, Brain } from 'lucide-react';

const AnalyticsDashboard: React.FC = () => {
  const [input, setInput] = useState('');
  const [data, setData] = useState<AnalyticsData[] | null>(null);
  const [loading, setLoading] = useState(false);

  const initialData: AnalyticsData[] = [
    { subject: 'Physics', masteryScore: 75, topicsStrong: ['Optics'], topicsWeak: ['Magnetism'], lastStudied: 'Yesterday' },
    { subject: 'Math', masteryScore: 45, topicsStrong: ['Calculus'], topicsWeak: ['Vectors', '3D Geometry'], lastStudied: '3 days ago' },
    { subject: 'Chemistry', masteryScore: 88, topicsStrong: ['Organic'], topicsWeak: ['Surface Chem'], lastStudied: 'Today' },
  ];

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const result = await analyzeStudentPerformance(input);
      setData(result);
    } catch (error) {
      alert("Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const displayData = data || initialData;
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 rounded-lg border border-white/10 shadow-xl backdrop-blur-xl">
          <p className="text-white font-bold">{label}</p>
          <p className="text-primary-glow font-mono">Mastery: {payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-500/10 to-transparent">
           <div className="flex items-center gap-5">
             <div className="p-4 bg-emerald-500/20 rounded-2xl text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"><TrendingUp size={28} /></div>
             <div>
               <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">Preparedness</p>
               <h3 className="text-4xl font-black text-white">68%</h3>
             </div>
           </div>
        </Card>
        <Card className="border-l-4 border-l-rose-500 bg-gradient-to-br from-rose-500/10 to-transparent">
           <div className="flex items-center gap-5">
             <div className="p-4 bg-rose-500/20 rounded-2xl text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]"><AlertOctagon size={28} /></div>
             <div>
               <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">Critical Areas</p>
               <h3 className="text-4xl font-black text-white">3 Topics</h3>
             </div>
           </div>
        </Card>
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-500/10 to-transparent">
           <div className="flex items-center gap-5">
             <div className="p-4 bg-blue-500/20 rounded-2xl text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]"><Zap size={28} /></div>
             <div>
               <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">Streak</p>
               <h3 className="text-4xl font-black text-white">5 Days</h3>
             </div>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Mastery Heatmap" className="min-h-[450px] bg-black/20">
            <div className="h-80 w-full pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#666" tick={{fill: '#888', fontSize: 12}} />
                  <YAxis dataKey="subject" type="category" stroke="#fff" width={100} tick={{fill: '#eee', fontWeight: 600, fontSize: 14}} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                  <Bar dataKey="masteryScore" barSize={32} radius={[0, 8, 8, 0]}>
                    {displayData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.masteryScore > 75 ? '#10b981' : entry.masteryScore > 40 ? '#f59e0b' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 flex flex-wrap gap-8 text-xs text-gray-400 justify-center">
              <span className="flex items-center gap-3 font-medium"><div className="w-4 h-4 bg-emerald-500 rounded-md shadow-[0_0_10px_#10b981]"></div> Strong (&gt;75%)</span>
              <span className="flex items-center gap-3 font-medium"><div className="w-4 h-4 bg-amber-500 rounded-md shadow-[0_0_10px_#f59e0b]"></div> Review (40-75%)</span>
              <span className="flex items-center gap-3 font-medium"><div className="w-4 h-4 bg-rose-500 rounded-md shadow-[0_0_10px_#f43f5e]"></div> Weak (&lt;40%)</span>
            </div>
          </Card>
          
          <Card className="relative overflow-hidden border-t-2 border-t-accent">
             <div className="absolute top-0 right-0 p-6 opacity-5">
               <Brain size={120} className="rotate-12" />
             </div>
             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Sparkles size={22} className="text-accent-glow animate-pulse"/> AI Insight Engine
             </h3>
             <div className="space-y-4 relative z-10">
               <textarea 
                 className="w-full glass-input rounded-xl p-5 text-white h-32 resize-none text-base leading-relaxed"
                 placeholder="Tell me how your last study session went... (e.g., 'Confident in Calculus but confused about Vectors')"
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
               />
               <div className="flex justify-end">
                 <Button onClick={handleAnalyze} disabled={loading} className="shadow-lg px-8">
                   {loading ? 'Crunching Numbers...' : 'Update Heatmap'}
                 </Button>
               </div>
             </div>
          </Card>
        </div>

        <div className="space-y-4">
           {displayData.map((item, idx) => (
             <div key={idx} className={`glass-panel p-6 rounded-2xl border-l-4 ${item.masteryScore > 75 ? 'border-l-emerald-500 bg-gradient-to-r from-emerald-500/10 to-transparent' : item.masteryScore > 40 ? 'border-l-amber-500 bg-gradient-to-r from-amber-500/10 to-transparent' : 'border-l-rose-500 bg-gradient-to-r from-rose-500/10 to-transparent'} transition-transform hover:-translate-y-1`}>
               <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                 <h4 className="font-bold text-white text-xl tracking-tight">{item.subject}</h4>
                 <Badge type={item.masteryScore > 75 ? 'success' : item.masteryScore > 40 ? 'warning' : 'danger'}>{item.masteryScore}%</Badge>
               </div>
               
               <div className="mb-5">
                 <div className="text-[10px] text-emerald-400 mb-2 font-bold uppercase tracking-wider flex items-center gap-1.5"><Zap size={12} /> Strong Areas</div>
                 <div className="flex flex-wrap gap-2">
                   {item.topicsStrong.length > 0 ? item.topicsStrong.map(t => (
                     <span key={t} className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[11px] text-emerald-300 font-semibold">{t}</span>
                   )) : <span className="text-gray-600 text-xs italic">Calculating...</span>}
                 </div>
               </div>

               <div>
                 <div className="text-[10px] text-rose-400 mb-2 font-bold uppercase tracking-wider flex items-center gap-1.5"><AlertOctagon size={12} /> Focus Needed</div>
                 <div className="flex flex-wrap gap-2">
                   {item.topicsWeak.length > 0 ? item.topicsWeak.map(t => (
                     <span key={t} className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-md text-[11px] text-rose-300 font-semibold">{t}</span>
                   )) : <span className="text-gray-600 text-xs italic">None detected</span>}
                 </div>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;