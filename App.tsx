import React, { useState, useEffect } from 'react';
import NotesGenerator from './components/NotesGenerator';
import ExamGenerator from './components/ExamGenerator';
import MathsSolver from './components/MathsSolver';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { BookOpen, FileQuestion, BarChart2, GraduationCap, LayoutDashboard, Menu, X, Calculator, LogIn, LogOut, CloudOff, Settings, Sparkles } from 'lucide-react';
import { Select, Button, Card, Modal, Input } from './components/UIComponents';
import { 
  loginWithGoogle, 
  logoutUser, 
  subscribeToAuthChanges, 
  saveUserClassLevel, 
  getUserClassLevel,
  isFirebaseConfigured,
  updateUserProfile
} from './services/firebaseService';
import { User } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'notes' | 'exam' | 'solver' | 'analytics'>('dashboard');
  const [globalClassLevel, setGlobalClassLevel] = useState<string>('12');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(false);
  
  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState('');

  useEffect(() => {
    setIsLocalMode(!isFirebaseConfigured());

    const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const savedClass = await getUserClassLevel(currentUser.uid);
        if (savedClass) {
          setGlobalClassLevel(savedClass);
        }
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const handleClassChange = (newClass: string) => {
    setGlobalClassLevel(newClass);
    if (user) {
      saveUserClassLevel(user.uid, newClass);
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      alert("Login Failed. Check console.");
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setActiveTab('dashboard');
  };

  const openProfileModal = () => {
    if (user) {
      setEditName(user.displayName || '');
      setEditPhoto(user.photoURL || '');
      setIsProfileModalOpen(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await updateUserProfile(user, {
        displayName: editName,
        photoURL: editPhoto
      });
      setIsProfileModalOpen(false);
    } catch (e) {
      alert("Failed to update profile");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'notes':
        return <NotesGenerator classLevel={globalClassLevel} user={user} />;
      case 'exam':
        return <ExamGenerator classLevel={globalClassLevel} user={user} />;
      case 'solver':
        return <MathsSolver classLevel={globalClassLevel} />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return <DashboardHome onChangeTab={setActiveTab} userName={user?.displayName || 'Student'} />;
    }
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-white">
        <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- LOGIN SCREEN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-blob mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen"></div>

        <div className="relative z-10 max-w-md w-full space-y-8 text-center animate-fade-in-up">
           <div className="flex flex-col items-center gap-6 mb-8">
             <div className="bg-gradient-to-br from-primary to-primary-dark p-6 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.5)] rotate-12 hover:rotate-0 transition-transform duration-500">
               <GraduationCap size={64} className="text-white drop-shadow-md" />
             </div>
             <div>
                <h1 className="text-5xl font-black tracking-tight mb-2">EduGen<span className="text-primary">.ai</span></h1>
                <p className="text-gray-400 text-lg font-medium">Next-Gen Exam Preparation</p>
             </div>
           </div>

           <Card className="p-8 border-white/10 backdrop-blur-2xl bg-white/5">
             <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
             <p className="text-gray-400 mb-8 text-sm">Sign in to access your AI tutor.</p>
             
             <button 
               onClick={handleLogin}
               className="w-full bg-white text-black hover:bg-gray-200 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
             >
               {isLocalMode ? (
                 <>
                   <LogIn size={24} className="text-black"/>
                   Enter as Guest
                 </>
               ) : (
                 <>
                   <svg className="w-6 h-6" viewBox="0 0 24 24">
                     <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                     <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                     <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                     <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                   </svg>
                   Continue with Google
                 </>
               )}
             </button>

             {isLocalMode && (
               <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500 bg-white/5 p-2 rounded-lg border border-white/5">
                 <CloudOff size={14} />
                 <span>Local Storage Mode Enabled</span>
               </div>
             )}
           </Card>
        </div>
      </div>
    );
  }

  // --- MAIN APP ---
  return (
    <div className="min-h-screen bg-background text-white font-sans flex flex-col md:flex-row relative">
      
      {/* GLOBAL BACKGROUND ANIMATION */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-blob mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-screen"></div>
        <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-screen"></div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 glass-panel border-r border-white/5 flex-col sticky top-0 h-screen z-20 shadow-2xl">
        <SidebarContent 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          classLevel={globalClassLevel} 
          onClassChange={handleClassChange}
          user={user}
          onLogout={handleLogout}
          isLocalMode={isLocalMode}
          onEditProfile={openProfileModal}
        />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden">
        <header className="fixed top-0 left-0 right-0 z-30 glass-panel border-b border-white/10 p-4 flex justify-between items-center backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg shadow-lg shadow-primary/20">
              <GraduationCap className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">EduGen<span className="text-primary">.ai</span></h1>
          </div>
          
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {isMobileMenuOpen && (
          <div className="fixed top-16 inset-0 z-20 bg-background/95 backdrop-blur-xl p-4 animate-in slide-in-from-top-4">
            <SidebarContent 
              activeTab={activeTab} 
              onTabChange={handleTabChange} 
              classLevel={globalClassLevel} 
              onClassChange={handleClassChange}
              user={user}
              onLogout={handleLogout}
              isLocalMode={isLocalMode}
              onEditProfile={() => { openProfileModal(); setIsMobileMenuOpen(false); }}
            />
          </div>
        )}
        <div className="h-16"></div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen relative z-10 scroll-smooth">
         <header className="hidden md:flex sticky top-0 z-20 glass-panel border-b border-white/5 p-4 px-8 justify-between items-center backdrop-blur-md">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold capitalize text-gray-200 tracking-wide">{activeTab.replace('-', ' ')}</h2>
              <span className="px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary border border-primary/20 font-mono">Class {globalClassLevel}</span>
            </div>
            <div className="flex items-center gap-4">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-1.5 pr-4 rounded-full transition-all border border-transparent hover:border-white/10 group"
                onClick={openProfileModal}
              >
                 <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full border border-white/20 group-hover:scale-105 transition-transform" />
                 <span className="text-sm font-semibold group-hover:text-primary transition-colors">{user.displayName}</span>
              </div>
            </div>
         </header>
         <div className="p-4 md:p-8 max-w-7xl mx-auto">
           {renderContent()}
         </div>
      </main>

      <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Edit Profile">
        <div className="space-y-6">
          <div className="flex justify-center mb-4">
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
              <img src={editPhoto || user.photoURL || ''} alt="Preview" className="relative w-28 h-28 rounded-full border-4 border-surface object-cover shadow-2xl" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Display Name</label>
            <Input 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)} 
              placeholder="Your Name"
            />
          </div>

          <div className="space-y-2">
             <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Profile Picture URL</label>
             <Input 
               value={editPhoto}
               onChange={(e) => setEditPhoto(e.target.value)}
               placeholder="https://..."
             />
             <p className="text-[10px] text-gray-500">
               Or use a random avatar: 
               <span className="text-primary cursor-pointer hover:underline ml-1" onClick={() => setEditPhoto(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random().toString(36)}`)}>
                  Generate Random
               </span>
             </p>
          </div>

          <div className="pt-4 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsProfileModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSaveProfile}>Save Changes</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  classLevel: string;
  onClassChange: (level: string) => void;
  user: User;
  onLogout: () => void;
  isLocalMode: boolean;
  onEditProfile: () => void;
}

const SidebarContent: React.FC<SidebarProps> = ({ activeTab, onTabChange, classLevel, onClassChange, user, onLogout, isLocalMode, onEditProfile }) => (
  <>
    <div className="p-6 border-b border-white/5 hidden md:block relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50"></div>
      <div className="flex items-center gap-3 mb-2 relative z-10">
        <div className="bg-primary p-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)]">
          <GraduationCap className="text-white" size={24} />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">EduGen<span className="text-primary">.ai</span></h1>
      </div>
    </div>
    
    <div className="p-4 md:p-6 flex-1 flex flex-col justify-between overflow-y-auto">
      <div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-8">
          <label className="text-[10px] text-primary font-bold uppercase tracking-widest mb-2 block flex items-center gap-1">
            <Sparkles size={10} /> Student Class
          </label>
          <Select 
            value={classLevel} 
            onChange={(e) => onClassChange(e.target.value)}
            className="py-2 text-sm bg-black/50 border-white/10 focus:border-primary"
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
            label="Analytics" 
          />
        </nav>
      </div>
      
       <div className="mt-4 pt-4 border-t border-white/5">
          <NavButton 
            active={false} 
            onClick={onEditProfile} 
            icon={<Settings size={20} />} 
            label="Settings" 
          />
       </div>
    </div>

    <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center gap-3 overflow-hidden cursor-pointer hover:bg-white/5 p-2 -ml-2 rounded-lg transition-colors flex-1 mr-2 group"
          onClick={onEditProfile}
        >
          <img src={user.photoURL || ''} className="w-9 h-9 rounded-full border border-white/10 group-hover:border-primary transition-colors" />
          <div className="text-xs truncate">
            <p className="text-white font-bold truncate">{user.displayName}</p>
            <p className="text-gray-500 truncate text-[10px] uppercase tracking-wider">Student</p>
          </div>
        </div>
        <button onClick={onLogout} className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all" title="Sign Out">
           <LogOut size={18} />
        </button>
      </div>
    </div>
  </>
);

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
      active 
        ? 'text-white shadow-lg' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`}
  >
    {active && <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent border-l-2 border-primary opacity-100"></div>}
    <span className={`relative z-10 transition-colors duration-300 ${active ? 'text-primary' : 'group-hover:text-primary-glow'}`}>
      {icon}
    </span>
    <span className="relative z-10 font-medium tracking-wide">{label}</span>
  </button>
);

const DashboardHome: React.FC<{ onChangeTab: (tab: any) => void, userName: string }> = ({ onChangeTab, userName }) => (
  <div className="max-w-6xl mx-auto space-y-12 animate-fade-in-up pb-10">
    <div className="text-center space-y-6 py-12 relative">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
      <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter relative z-10">
        Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-glow to-primary-dark">{userName}.</span>
      </h1>
      <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-light relative z-10">
        Your personal AI tutor is ready. What shall we conquer today?
      </p>
      
      <div className="flex justify-center pt-4 relative z-10">
        <button 
          onClick={() => onChangeTab('notes')} 
          className="bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:scale-110 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-2"
        >
          <Sparkles size={20} className="text-primary-dark" /> Start Learning
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <FeatureCard 
        icon={<BookOpen className="text-primary" size={32} />}
        title="Smart Notes"
        desc="Deep-dive into concepts with AI-generated, NCERT-aligned summaries."
        onClick={() => onChangeTab('notes')}
        color="emerald"
      />
      <FeatureCard 
        icon={<FileQuestion className="text-accent-glow" size={32} />}
        title="Exam Simulator"
        desc="Practice with generated papers tailored to your syllabus."
        onClick={() => onChangeTab('exam')}
        color="violet"
      />
      <FeatureCard 
        icon={<Calculator className="text-blue-400" size={32} />}
        title="Maths Solver"
        desc="Stuck? Get step-by-step logic and coaching tips instantly."
        onClick={() => onChangeTab('solver')}
        color="blue"
      />
      <FeatureCard 
        icon={<BarChart2 className="text-rose-400" size={32} />}
        title="Heatmap"
        desc="Track your mastery. Focus on what matters."
        onClick={() => onChangeTab('analytics')}
        color="rose"
      />
    </div>
  </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string; onClick: () => void; color: string }> = ({ icon, title, desc, onClick, color }) => (
  <div 
    onClick={onClick} 
    className="glass-panel p-6 rounded-2xl cursor-pointer hover:border-white/20 transition-all group hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden"
  >
    <div className={`absolute inset-0 bg-${color}-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
    <div className="mb-4 bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300 shadow-inner">
      {icon}
    </div>
    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight group-hover:text-primary-glow transition-colors">{title}</h3>
    <p className="text-gray-400 leading-relaxed text-sm group-hover:text-gray-300">{desc}</p>
  </div>
);

export default App;