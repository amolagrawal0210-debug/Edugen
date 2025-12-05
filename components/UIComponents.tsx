import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }> = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  ...props 
}) => {
  const baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 tracking-wide relative overflow-hidden group";
  
  const variants = {
    primary: "bg-gradient-to-br from-primary-dark via-primary to-primary-glow text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] border border-transparent hover:brightness-110",
    secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-md shadow-lg",
    outline: "bg-transparent border border-primary/50 text-primary-glow hover:bg-primary/10 hover:border-primary shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-200%] group-hover:animate-shimmer" />
      )}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; noPadding?: boolean }> = ({ 
  children, 
  className = '',
  title,
  noPadding = false
}) => {
  return (
    <div className={`glass-panel rounded-2xl overflow-hidden animate-fade-in-up hover:border-white/10 transition-colors ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-white/5 bg-white/5 backdrop-blur-md flex items-center gap-2">
           <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <div className="relative group">
    <input 
      className={`w-full glass-input rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none ${className}`}
      {...props}
    />
    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity"></div>
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...props }) => (
  <div className="relative group">
    <select 
      className={`w-full glass-input appearance-none rounded-xl px-4 py-3.5 text-white focus:outline-none cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 group-hover:text-white transition-colors">
      <ChevronDown size={16} />
    </div>
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; type?: 'success' | 'warning' | 'danger' | 'neutral' | 'focus' | 'accent' }> = ({ children, type = 'neutral' }) => {
  const styles = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.2)]",
    neutral: "bg-slate-700/30 text-slate-300 border-slate-600/30",
    focus: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.2)]",
    accent: "bg-accent/10 text-accent-glow border-accent/20 shadow-[0_0_12px_rgba(139,92,246,0.2)]"
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md uppercase tracking-wider ${styles[type]}`}>
      {children}
    </span>
  );
};

export const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col justify-center items-center p-12 gap-6">
    <div className="relative w-20 h-20">
      <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
      <div className="absolute inset-2 rounded-full border-r-2 border-accent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></div>
      </div>
    </div>
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-glow to-accent-glow text-sm font-bold animate-pulse tracking-widest uppercase">
      AI Processing
    </span>
  </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="relative w-full max-w-lg glass-panel rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-300 border border-white/10">
        <div className="flex justify-between items-center p-5 border-b border-white/10 bg-white/5">
          <h3 className="text-xl font-bold text-white tracking-wide">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ProgressBar: React.FC<{ step: number; totalSteps: number; message: string }> = ({ step, totalSteps, message }) => {
  const progress = Math.min((step / totalSteps) * 100, 100);
  
  return (
    <div className="w-full space-y-4 animate-fade-in-up">
      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-primary-glow">
        <span>Generating...</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all duration-700 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/30 w-full animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
        </div>
      </div>
      <p className="text-center text-sm text-gray-400 font-mono animate-pulse">{message}</p>
    </div>
  );
};

export const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; icon?: React.ReactNode }> = ({ 
  title, 
  children, 
  defaultOpen = false,
  icon
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/5 transition-colors hover:border-white/10">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-3 font-bold text-white">
          {icon && <span className="text-primary-glow drop-shadow-md">{icon}</span>}
          <span className="tracking-wide">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-primary" /> : <ChevronDown size={20} className="text-gray-500" />}
      </button>
      
      {isOpen && (
        <div className="p-6 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
};