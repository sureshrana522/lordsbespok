import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Copy, Loader2 } from 'lucide-react';

interface GenAIAssistantProps {
  customerName: string;
  vipCategory: string;
}

export const GenAIAssistant: React.FC<GenAIAssistantProps> = ({ customerName, vipCategory }) => {
  const [generatedWish, setGeneratedWish] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateBirthdayWish = async () => {
    if (!process.env.API_KEY) {
      setError("API Key not found in environment.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        You are the social media manager for "Lord's Bespoke Tailor", a high-end luxury menswear brand.
        Write a short, elegant, and very premium Instagram caption for a customer's birthday.
        
        Customer Name: ${customerName}
        VIP Tier: ${vipCategory}
        
        Tone: Classy, Royal, Sophisticated, Warm but Professional.
        Include emojis like 👑, ✨, 🧵.
        Do not use hashtags.
        Keep it under 50 words.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response.text) {
        setGeneratedWish(response.text.trim());
      }
    } catch (err) {
      setError("Failed to generate wish. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-gray-900 to-black border border-gold-800/30 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-gold-400 text-sm font-serif flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold-300" />
          Lord's AI Social Assistant
        </h4>
      </div>
      
      {!generatedWish && !isLoading && (
        <button
          onClick={generateBirthdayWish}
          className="text-xs bg-gold-900/40 text-gold-300 hover:bg-gold-800/40 border border-gold-700/50 px-3 py-2 rounded transition-colors w-full"
        >
          Generate VIP Birthday Wish
        </button>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-2 text-gold-500">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs mt-2">{error}</p>
      )}

      {generatedWish && (
        <div className="animate-fade-in">
          <div className="bg-black/50 p-3 rounded text-gray-300 text-sm italic border-l-2 border-gold-500">
            "{generatedWish}"
          </div>
          <div className="flex gap-2 mt-2">
            <button 
                onClick={() => { navigator.clipboard.writeText(generatedWish); }}
                className="flex-1 flex items-center justify-center gap-2 text-xs text-gold-600 hover:text-gold-400 py-1"
            >
                <Copy className="w-3 h-3" /> Copy
            </button>
            <button 
                onClick={() => setGeneratedWish('')}
                className="flex-1 text-xs text-gray-600 hover:text-gray-400 py-1"
            >
                Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};