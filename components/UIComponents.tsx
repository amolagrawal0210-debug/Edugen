import React from 'react';
import { X } from 'lucide-react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' }> = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  ...props 
}) => {
  const baseStyle = "px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-edu-primary hover:bg-edu-accent text-white shadow-[0_0_15px_rgba(22,163,74,0.3)]",
    secondary: "bg-edu-card hover:bg-neutral-800 text-edu-primary border border-edu-border",
    outline: "bg-transparent border border-edu-primary text-edu-primary hover:bg-edu-primary/10"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ 
  children, 
  className = '',
  title
}) => {
  return (
    <div className={`bg-edu-card border border-edu-border/50 rounded-xl p-6 ${className}`}>
      {title && <h3 className="text-xl font-bold text-white mb-4 border-b border-edu-border pb-2">{title}</h3>}
      {children}
    </div>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input 
    className={`w-full bg-black border border-edu-border rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-edu-accent focus:ring-1 focus:ring-edu-accent transition-all ${className}`}
    {...props}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...props }) => (
  <div className="relative">
    <select 
      className={`w-full bg-black border border-edu-border rounded-lg px-4 py-3 text-white appearance-none focus:outline-none focus:border-edu-accent focus:ring-1 focus:ring-edu-accent transition-all cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
    </div>
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; type?: 'success' | 'warning' | 'danger' | 'neutral' }> = ({ children, type = 'neutral' }) => {
  const styles = {
    success: "bg-green-900/40 text-green-400 border-green-800",
    warning: "bg-yellow-900/40 text-yellow-400 border-yellow-800",
    danger: "bg-red-900/40 text-red-400 border-red-800",
    neutral: "bg-neutral-800 text-gray-300 border-neutral-700"
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold border ${styles[type]}`}>
      {children}
    </span>
  );
};

export const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-edu-accent"></div>
  </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-edu-card border border-edu-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center p-4 border-b border-edu-border">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};