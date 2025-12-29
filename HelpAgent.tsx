
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MessageSquare, X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import { Role } from '../types';

interface HelpAgentProps {
  userRole: string;
  userName: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const HelpAgent: React.FC<HelpAgentProps> = ({ userRole, userName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Hello ${userName}! I am Lord's AI Assistant. How can I help you with the ${userRole} panel today?` }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !process.env.API_KEY) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        You are the intelligent assistant for "Lord's Bespoke Tailor System".
        The user is: ${userName} (Role: ${userRole}).
        
        System Context:
        - This is a tailoring management system.
        - Roles include Admin, Showroom, Measurement, Cutting, Stitching, etc.
        - Gold & Black aesthetic.
        
        Answer the user's question about how to use the system, track orders, or manage their wallet.
        Keep answers short, professional, and helpful. 
        User Question: ${userMsg}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-latest',
        contents: prompt,
      });

      const text = response.text || "I apologize, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'model', text: text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Connection error. Please check your API Key." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-gold-600 to-gold-400 text-black p-4 rounded-full shadow-[0_0_20px_rgba(212,160,0,0.4)] hover:scale-110 transition-transform animate-bounce-slow border-2 border-white/20"
        >
          <Bot className="w-8 h-8" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 bg-black border border-gold-600/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-zinc-900/90 p-4 border-b border-gold-900 flex justify-between items-center backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-400" />
              <h3 className="text-gold-100 font-serif font-bold">Lord's Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 h-80 overflow-y-auto p-4 space-y-3 bg-zinc-950/50 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    msg.role === 'user' 
                      ? 'bg-gold-600 text-black font-medium rounded-tr-none' 
                      : 'bg-zinc-800 text-gray-200 border border-zinc-700 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-zinc-800 p-2 rounded-lg rounded-tl-none">
                    <Loader2 className="w-4 h-4 text-gold-500 animate-spin" />
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex gap-2">
            <input 
              className="flex-1 bg-black border border-zinc-700 rounded-full px-4 py-2 text-sm text-white focus:border-gold-500 outline-none"
              placeholder="Ask for help..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading}
              className="bg-gold-600 text-black p-2 rounded-full hover:bg-gold-500 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
