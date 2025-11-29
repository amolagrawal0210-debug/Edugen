
import React, { useState, useEffect } from 'react';
import NotesGenerator from './components/NotesGenerator';
import ExamGenerator from './components/ExamGenerator';
import MathsSolver from './components/MathsSolver';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { BookOpen, FileQuestion, BarChart2, GraduationCap, LayoutDashboard, Menu, X, Calculator, Sun, Moon, LogIn, LogOut, CloudOff, User as UserIcon, Settings, Edit } from 'lucide-react';
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
import { UserProfile, User } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'notes' | 'exam' | 'solver' | 'analytics'>('dashboard');
  const [globalClassLevel, setGlobalClassLevel] = useState<string>('12');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
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
        // Load saved class preference
        const savedClass = await getUserClassLevel(currentUser.uid);
        if (savedClass) {
          setGlobalClassLevel(savedClass);
        }
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync Class Level changes to DB if logged in
  const handleClassChange = (newClass: string) => {
    setGlobalClassLevel(newClass);
    if (user) {
      saveUserClassLevel(user.uid, newClass);
    }
  };

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
        return <MathsSolver />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return <DashboardHome onChangeTab={setActiveTab} userName={user?.displayName || 'Student'} />;
    }
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); // Close menu on selection
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-edu-primary"></div>
      </div>
    );
  }

  // --- LOGIN SCREEN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-edu-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 max-w-md w-full space-y-8 text-center">
           <div className="flex flex-col items-center gap-4 mb-8">
             <div className="bg-edu-primary p-4 rounded-2xl shadow-[0_0_30px_rgba(22,163,74,0.4)]">
               <GraduationCap size={48} className="text-white" />
             </div>
             <h1 className="text-4xl font-black tracking-tight">EduGen<span className="text-edu-primary">.ai</span></h1>
             <p className="text-gray-400 text-lg">Your AI-Powered Exam Companion</p>
           </div>

           <Card className="p-8 backdrop-blur-sm bg-neutral-900/80 border-edu-border/50">
             <h2 className="text-xl font-bold mb-2">Welcome Back</h2>
             <p className="text-gray-500 mb-8 text-sm">Sign in to sync your class level, save notes, and track your progress.</p>
             
             <button 
               onClick={handleLogin}
               className="w-full bg-white text-black hover:bg-gray-100 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-transform hover:scale-105"
             >
               {isLocalMode ? (
                 <>
                   <LogIn size={20} className="text-black"/>
                   Enter as Guest Student
                 </>
               ) : (
                 <>
                   <svg className="w-5 h-5" viewBox="0 0 24 24">
                     <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                     <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                     <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                     <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                   </svg>
                   Sign in with Google
                 </>
               )}
             </button>

             {isLocalMode && (
               <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-500 bg-neutral-800 p-2 rounded">
                 <CloudOff size={12} />
                 <span>Local Mode Enabled (Data saved to browser)</span>
               </div>
             )}
           </Card>
           
           <p className="text-xs text-gray-600 mt-4">By continuing, you agree to our Terms of Service.</p>
        </div>
      </div>
    );
  }

  // --- MAIN APP ---
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-edu-primary selection:text-white flex flex-col md:flex-row transition-colors duration-200">
      
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex w-64 bg-edu-dark border-r border-edu-border flex-col sticky top-0 h-screen z-20">
        <SidebarContent 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          classLevel={globalClassLevel} 
          onClassChange={handleClassChange}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          user={user}
          onLogout={handleLogout}
          isLocalMode={isLocalMode}
          onEditProfile={openProfileModal}
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
          <div className="fixed top-16 right-0 left-0 z-20 bg-edu-dark/95 backdrop-blur-sm border-b border-edu-border p-4 animate-in slide-in-from-top-2 shadow-2xl">
            <SidebarContent 
              activeTab={activeTab} 
              onTabChange={handleTabChange} 
              classLevel={globalClassLevel} 
              onClassChange={handleClassChange}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
              user={user}
              onLogout={handleLogout}
              isLocalMode={isLocalMode}
              onEditProfile={() => { openProfileModal(); setIsMobileMenuOpen(false); }}
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
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-neutral-800 p-1.5 rounded-lg transition-colors"
                onClick={openProfileModal}
                title="Edit Profile"
              >
                 <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full border border-neutral-700" />
                 <span className="text-sm font-medium">{user.displayName}</span>
                 {isLocalMode && <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-gray-400">Guest</span>}
              </div>
            </div>
         </header>
         <div className="p-4 md:p-8">
           {renderContent()}
         </div>
      </main>

      <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Edit Profile">
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative group cursor-pointer">
              <img src={editPhoto || user.photoURL || ''} alt="Preview" className="w-24 h-24 rounded-full border-2 border-edu-primary object-cover" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-gray-400 font-semibold">Display Name</label>
            <Input 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)} 
              placeholder="Your Name"
            />
          </div>

          <div className="space-y-2">
             <label className="text-sm text-gray-400 font-semibold">Profile Picture URL</label>
             <Input 
               value={editPhoto}
               onChange={(e) => setEditPhoto(e.target.value)}
               placeholder="https://..."
             />
             <p className="text-[10px] text-gray-500">
               Enter a direct image link. 
               <span className="text-edu-primary cursor-pointer hover:underline ml-1" onClick={() => setEditPhoto(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random().toString(36)}`)}>
                  Generate Random Avatar
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
  isDarkMode: boolean;
  onToggleTheme: () => void;
  user: User;
  onLogout: () => void;
  isLocalMode: boolean;
  onEditProfile: () => void;
}

const SidebarContent: React.FC<SidebarProps> = ({ activeTab, onTabChange, classLevel, onClassChange, isDarkMode, onToggleTheme, user, onLogout, isLocalMode, onEditProfile }) => (
  <>
    <div className="p-6 border-b border-edu-border hidden md:block">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-edu-primary p-1.5 rounded-lg">
          <GraduationCap className="text-white" size={24} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">EduGen<span className="text-edu-primary">.ai</span></h1>
      </div>
      {isLocalMode && (
        <div className="bg-yellow-900/20 border border-yellow-900/50 p-2 rounded text-[10px] text-yellow-500 flex items-center gap-1.5">
           <CloudOff size={10} />
           Local Storage Mode
        </div>
      )}
    </div>
    
    <div className="p-4 md:p-6 border-b border-edu-border md:border-none flex-1">
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

    {/* User Footer */}
    <div className="p-4 border-t border-edu-border bg-neutral-900/30">
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center gap-2 overflow-hidden cursor-pointer hover:bg-white/5 p-1 -ml-1 rounded transition-colors flex-1 mr-2"
          onClick={onEditProfile}
          title="Edit Profile"
        >
          <img src={user.photoURL || ''} className="w-8 h-8 rounded-full" />
          <div className="text-xs truncate">
            <p className="text-white font-semibold truncate flex items-center gap-1">{user.displayName} <Edit size={10} className="text-gray-500" /></p>
            <p className="text-gray-500 truncate max-w-[80px]">Class {classLevel}</p>
          </div>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-red-400 transition-colors p-2" title="Sign Out">
           <LogOut size={18} />
        </button>
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

const DashboardHome: React.FC<{ onChangeTab: (tab: any) => void, userName: string }> = ({ onChangeTab, userName }) => (
  <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
    <div className="text-center space-y-4 py-10">
      <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
        Hello, <span className="text-edu-primary">{userName.split(' ')[0]}</span>!
      </h1>
      <p className="text-xl text-gray-400 max-w-2xl mx-auto">
        Ready to crush your CBSE 2025 exams? Let's get to work.
      </p>
      <div className="flex justify-center gap-4">
        <button onClick={() => onChangeTab('notes')} className="bg-white dark:bg-white bg-black text-white dark:text-black px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all transform hover:scale-105 shadow-lg">
          Start Studying
        </button>
      </div>
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
