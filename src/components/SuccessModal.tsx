
import React from 'react';
import { CheckCircle, X, Sparkles } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  recipientRole?: string;
  recipientName?: string;
  message: string;
  subMessage?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ 
  isOpen, onClose, title, recipientRole, recipientName, message, subMessage 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      
      <div className="relative bg-gradient-to-b from-zinc-900 to-black w-full max-w-sm rounded-2xl shadow-[0_0_60px_rgba(34,197,94,0.15)] overflow-hidden border border-zinc-800 animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Glowing Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent shadow-[0_0_10px_#22c55e]"></div>

        <div className="p-8 flex flex-col items-center text-center relative z-10">
          
          {/* Floating Icon */}
          <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-6 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            <CheckCircle className="w-10 h-10 text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
          </div>

          <h3 className="text-2xl font-serif font-bold text-white mb-2 tracking-wide">{title}</h3>
          
          <div className="space-y-4 my-4 w-full">
            <p className="text-gray-400 text-sm leading-relaxed font-sans">
              {message}
            </p>

            {(recipientRole || recipientName) && (
               <div className="bg-black/40 p-4 rounded-lg border border-green-900/50 text-left relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50"></div>
                  <p className="text-[10px] text-green-500/80 uppercase tracking-widest font-bold">Processed To</p>
                  <p className="text-green-400 font-bold text-sm mt-1">{recipientRole}</p>
                  <p className="text-white text-lg font-serif">{recipientName}</p>
                  <Sparkles className="absolute top-2 right-2 w-4 h-4 text-green-500/20 group-hover:text-green-500/50 transition-colors" />
               </div>
            )}
            
            {subMessage && (
               <p className="text-xs text-gray-600 italic mt-2">{subMessage}</p>
            )}
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-bold py-3 rounded-xl mt-4 transition-all uppercase tracking-wider text-xs shadow-lg transform active:scale-95"
          >
            Acknowledge
          </button>

        </div>
        
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-green-900/10 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};
