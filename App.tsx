import React, { useState, useEffect } from 'react';
import NotesGenerator from './components/NotesGenerator';
import ExamGenerator from './components/ExamGenerator';
import MathsSolver from './components/MathsSolver';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { BookOpen, FileQuestion, BarChart2, GraduationCap, LayoutDashboard, Menu, X, Calculator, Sun, Moon } from 'lucide-react';
import { Select } from './components/UIComponents';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'notes' | 'exam' | 'solver' | 'analytics'>('dashboard');
  const [globalClassLevel, setGlobalClassLevel] = useState<string>('12');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Initialize theme based on state
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'notes':
        return <NotesGenerator classLevel={globalClassLevel} />;
      case 'exam':
        return <ExamGenerator classLevel={globalClassLevel} />;
      case 'solver':
        return <MathsSolver />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return <DashboardHome onChangeTab={setActiveTab} />;
    }
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); // Close menu on selection
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-edu-primary selection:text-white flex flex-col md:flex-row transition-colors duration-200">
      
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex w-64 bg-edu-dark border-r border-edu-border flex-col sticky top-0 h-screen z-20">
        <SidebarContent 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          classLevel={globalClassLevel} 
          onClassChange={setGlobalClassLevel}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
      </aside>

      {/* Mobile Header & Overlay Menu */}
      <div className="md:hidden">
        {/* Top Header */}
        <header className="fixed top-0 left-0 right-0 z-30 bg-edu-dark border-b border-edu-border p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-edu-primary p-1.5 rounded-lg">
              <GraduationCap className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">EduGen<span className="text-edu-primary">.ai</span></h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 text-white hover:bg-neutral-800 rounded-lg">
               {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-white hover:bg-neutral-800 rounded-lg">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        {/* Mobile Dropdown Menu (Top Right Expansion) */}
        {isMobileMenuOpen && (
          <div className="fixed top-16 right-0 left-0 z-20 bg-edu-dark/95 backdrop-blur-sm border-b border-edu-border p-4 animate-in slide-in-from-top-2">
            <SidebarContent 
              activeTab={activeTab} 
              onTabChange={handleTabChange} 
              classLevel={globalClassLevel} 
              onClassChange={setGlobalClassLevel}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
            />
          </div>
        )}
        
        {/* Spacer for fixed header */}
        <div className="h-16"></div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen relative scroll-smooth">
         <header className="hidden md:flex sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-edu-border p-4 md:px-8 justify-between items-center transition-colors duration-200">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold capitalize text-white">{activeTab.replace('-', ' ')}</h2>
              <span className="px-2 py-0.5 rounded text-xs bg-edu-primary/20 text-edu-primary border border-edu-primary/30">Class {globalClassLevel}</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full hover:bg-neutral-800 text-gray-400 hover:text-white transition-colors"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-green-500 font-mono">SYSTEM ONLINE</span>
              </div>
            </div>
         </header>
         <div className="p-4 md:p-8">
           {renderContent()}
         </div>
      </main>
    </div>
  );
};

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  classLevel: string;
  onClassChange: (level: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const SidebarContent: React.FC<SidebarProps> = ({ activeTab, onTabChange, classLevel, onClassChange, isDarkMode, onToggleTheme }) => (
  <>
    <div className="p-6 border-b border-edu-border hidden md:block">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-edu-primary p-1.5 rounded-lg">
          <GraduationCap className="text-white" size={24} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">EduGen<span className="text-edu-primary">.ai</span></h1>
      </div>
    </div>
    
    <div className="p-4 md:p-6 border-b border-edu-border md:border-none">
      {/* Global Class Selector */}
      <div className="bg-neutral-900/50 p-3 rounded-lg border border-neutral-800 mb-6">
        <label className="text-[10px] text-edu-primary font-bold uppercase tracking-wider mb-2 block">Student Class</label>
        <Select 
          value={classLevel} 
          onChange={(e) => onClassChange(e.target.value)}
          className="py-2 text-sm bg-black border-neutral-700 focus:border-edu-primary"
        >
          <option value="9">Class 9</option>
          <option value="10">Class 10</option>
          <option value="11">Class 11</option>
          <option value="12">Class 12</option>
        </Select>
      </div>

      <nav className="space-y-2">
        <NavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => onTabChange('dashboard')} 
          icon={<LayoutDashboard size={20} />} 
          label="Dashboard" 
        />
        <NavButton 
          active={activeTab === 'notes'} 
          onClick={() => onTabChange('notes')} 
          icon={<BookOpen size={20} />} 
          label="Smart Notes" 
        />
        <NavButton 
          active={activeTab === 'exam'} 
          onClick={() => onTabChange('exam')} 
          icon={<FileQuestion size={20} />} 
          label="Exam Generator" 
        />
        <NavButton 
          active={activeTab === 'solver'} 
          onClick={() => onTabChange('solver')} 
          icon={<Calculator size={20} />} 
          label="Maths Solver" 
        />
        <NavButton 
          active={activeTab === 'analytics'} 
          onClick={() => onTabChange('analytics')} 
          icon={<BarChart2 size={20} />} 
          label="Student Heatmap" 
        />
      </nav>
    </div>

    <div className="p-4 md:border-t border-edu-border mt-auto hidden md:block">
      <div className="bg-neutral-900 rounded-lg p-3 text-xs text-gray-400">
        <p className="mb-1 text-white font-semibold">Pro Tip:</p>
        Current Class: <span className="text-edu-primary font-bold">Class {classLevel}</span>. Change it here anytime.
      </div>
    </div>
  </>
);

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
      active 
        ? 'bg-edu-primary/10 text-edu-primary border border-edu-primary/20' 
        : 'text-gray-400 hover:bg-neutral-800 hover:text-white'
    }`}
  >
    <span className={`${active ? 'text-edu-primary' : 'text-gray-500 group-hover:text-white transition-colors'}`}>
      {icon}
    </span>
    <span className="font-medium">{label}</span>
  </button>
);

const DashboardHome: React.FC<{ onChangeTab: (tab: any) => void }> = ({ onChangeTab }) => (
  <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
    <div className="text-center space-y-4 py-10">
      <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
        Master CBSE <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-700">2025-26</span>
      </h1>
      <p className="text-xl text-gray-400 max-w-2xl mx-auto">
        Your AI-powered companion for smart notes, adaptive testing, and performance analytics.
      </p>
      <button onClick={() => onChangeTab('notes')} className="mt-8 bg-white dark:bg-white bg-black text-white dark:text-black px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all transform hover:scale-105 shadow-lg">
        Start Studying Now
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <FeatureCard 
        icon={<BookOpen className="text-edu-primary" size={32} />}
        title="AI Power Notes"
        desc="3-page high-density summaries with bullet points."
        onClick={() => onChangeTab('notes')}
      />
      <FeatureCard 
        icon={<FileQuestion className="text-blue-400" size={32} />}
        title="Exam Simulator"
        desc="Generate blueprint-aligned papers."
        onClick={() => onChangeTab('exam')}
      />
      <FeatureCard 
        icon={<Calculator className="text-purple-400" size={32} />}
        title="Maths Solver"
        desc="Step-by-step solutions for any math problem."
        onClick={() => onChangeTab('solver')}
      />
      <FeatureCard 
        icon={<BarChart2 className="text-red-400" size={32} />}
        title="Heatmap"
        desc="Visualize your strong and weak zones."
        onClick={() => onChangeTab('analytics')}
      />
    </div>
  </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string; onClick: () => void }> = ({ icon, title, desc, onClick }) => (
  <div onClick={onClick} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl cursor-pointer hover:border-edu-primary hover:bg-neutral-800 transition-all group">
    <div className="mb-4 bg-black w-14 h-14 rounded-lg flex items-center justify-center border border-neutral-800 group-hover:border-edu-primary/50 transition-colors">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-400 leading-relaxed text-sm">{desc}</p>
  </div>
);

export default App;