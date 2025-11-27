import React, { useState } from 'react';
import { analyzeStudentPerformance } from '../services/geminiService';
import { AnalyticsData } from '../types';
import { Button, Card, LoadingSpinner, Badge } from './UIComponents';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Activity, Zap, AlertOctagon, TrendingUp } from 'lucide-react';

const AnalyticsDashboard: React.FC = () => {
  const [input, setInput] = useState('');
  const [data, setData] = useState<AnalyticsData[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Initial Mock Data for visual demonstration before user input
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
        <div className="bg-black border border-edu-border p-3 rounded shadow-lg">
          <p className="text-white font-bold">{label}</p>
          <p className="text-edu-primary">Mastery: {payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-neutral-900 to-black border-l-4 border-l-green-500">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-green-900/20 rounded-full text-green-500"><TrendingUp /></div>
             <div>
               <p className="text-gray-400 text-sm">Overall Preparedness</p>
               <h3 className="text-3xl font-bold text-white">68%</h3>
             </div>
           </div>
        </Card>
        <Card className="bg-gradient-to-br from-neutral-900 to-black border-l-4 border-l-red-500">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-red-900/20 rounded-full text-red-500"><AlertOctagon /></div>
             <div>
               <p className="text-gray-400 text-sm">Critical Focus Areas</p>
               <h3 className="text-3xl font-bold text-white">3 Topics</h3>
             </div>
           </div>
        </Card>
        <Card className="bg-gradient-to-br from-neutral-900 to-black border-l-4 border-l-blue-500">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-900/20 rounded-full text-blue-500"><Zap /></div>
             <div>
               <p className="text-gray-400 text-sm">Study Streak</p>
               <h3 className="text-3xl font-bold text-white">5 Days</h3>
             </div>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Student Knowledge Heatmap">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#666" />
                  <YAxis dataKey="subject" type="category" stroke="#fff" width={80} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#1a1a1a'}} />
                  <Bar dataKey="masteryScore" barSize={20} radius={[0, 4, 4, 0]}>
                    {displayData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.masteryScore > 70 ? '#16a34a' : entry.masteryScore > 40 ? '#ca8a04' : '#dc2626'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex gap-4 text-xs text-gray-400 justify-center">
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-600 rounded-sm"></div> Green Zone (Mastered)</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-600 rounded-sm"></div> Learning Zone</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-600 rounded-sm"></div> Dark Zone (Revision Needed)</span>
            </div>
          </Card>
          
          <Card title="AI Input Analyzer">
             <div className="space-y-4">
               <p className="text-sm text-gray-400">Paste a recent quiz summary, a reflection note, or list of doubts to update your heatmap.</p>
               <textarea 
                 className="w-full bg-black border border-edu-border rounded-lg p-3 text-white h-24 focus:ring-1 focus:ring-edu-accent outline-none resize-none"
                 placeholder="e.g. I felt confident in Organic Chemistry today but struggled completely with 3D Geometry vectors..."
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
               />
               <div className="flex justify-end">
                 <Button onClick={handleAnalyze} disabled={loading}>
                   {loading ? 'Analyzing...' : 'Update Analytics'}
                 </Button>
               </div>
             </div>
          </Card>
        </div>

        {/* Side Panel Breakdown */}
        <div className="space-y-6">
           {displayData.map((item, idx) => (
             <Card key={idx} className="border-l-2 border-l-edu-primary">
               <div className="flex justify-between items-center mb-2">
                 <h4 className="font-bold text-white">{item.subject}</h4>
                 <span className="text-xs text-gray-500">{item.lastStudied}</span>
               </div>
               
               <div className="mb-3">
                 <div className="text-xs text-green-400 mb-1 font-semibold uppercase">Strong Topics</div>
                 <div className="flex flex-wrap gap-1">
                   {item.topicsStrong.length > 0 ? item.topicsStrong.map(t => (
                     <span key={t} className="px-2 py-0.5 bg-green-900/30 border border-green-900 rounded text-xs text-green-300">{t}</span>
                   )) : <span className="text-gray-600 text-xs italic">None detected</span>}
                 </div>
               </div>

               <div>
                 <div className="text-xs text-red-400 mb-1 font-semibold uppercase">Dark Zones (Weak)</div>
                 <div className="flex flex-wrap gap-1">
                   {item.topicsWeak.length > 0 ? item.topicsWeak.map(t => (
                     <span key={t} className="px-2 py-0.5 bg-red-900/30 border border-red-900 rounded text-xs text-red-300">{t}</span>
                   )) : <span className="text-gray-600 text-xs italic">None detected</span>}
                 </div>
               </div>
             </Card>
           ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
