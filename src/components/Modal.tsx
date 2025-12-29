
import React from 'react';
import { X, Crown } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Darkened Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* 3D Modal Container */}
      <div className="relative bg-black/90 w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(212,160,0,0.15)] border border-gold-500/30 animate-in zoom-in-95 duration-300 scale-100 transform transition-all">
        
        {/* Decorative Top Highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold-400 to-transparent opacity-50"></div>

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gold-900/50 bg-gradient-to-r from-black via-zinc-900 to-black">
          <div className="flex items-center gap-2">
             <Crown className="w-5 h-5 text-gold-500 drop-shadow-[0_0_5px_rgba(212,160,0,0.5)]" />
             <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-gold-200 to-gold-500 font-serif text-xl font-bold tracking-wide">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="group relative p-2 rounded-full hover:bg-gold-900/30 transition-all"
          >
            <X className="w-5 h-5 text-gray-500 group-hover:text-gold-400 transition-colors" />
          </button>
        </div>

        {/* Content Area with Inner Shadow */}
        <div className="p-6 overflow-y-auto custom-scrollbar text-gray-300 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] bg-fixed shadow-inner">
          {children}
        </div>

        {/* Decorative Bottom Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-black via-gold-900 to-black"></div>
      </div>
    </div>
  );
};
