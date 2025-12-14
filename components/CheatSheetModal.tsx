
import React from 'react';
import { X, Download, Zap } from 'lucide-react';

interface CheatSheetModalProps {
  content: string;
  onClose: () => void;
}

const CheatSheetModal: React.FC<CheatSheetModalProps> = ({ content, onClose }) => {
  
  // Helper to parse basic markdown styles
  const renderLine = (line: string, index: number) => {
      // 1. Headers (# Header)
      if (line.trim().startsWith('#')) {
          return <h3 key={index} className="font-bold underline text-stone-950 mt-4 mb-2 text-xl">{line.replace(/#/g, '').trim()}</h3>;
      }
      
      // 2. Bullet Points (- Point or * Point)
      if (line.trim().match(/^[-*]\s/)) {
          const cleanLine = line.trim().replace(/^[-*]\s/, '');
          return (
              <div key={index} className="flex gap-2 ml-4 mb-1">
                  <span className="text-stone-500 mt-1.5 w-1.5 h-1.5 bg-stone-800 rounded-full shrink-0"></span>
                  <p dangerouslySetInnerHTML={{ __html: parseBold(cleanLine) }}></p>
              </div>
          )
      }

      // 3. Normal Text with Bold parsing
      if (line.trim().length === 0) return <div key={index} className="h-2"></div>;

      return <p key={index} dangerouslySetInnerHTML={{ __html: parseBold(line) }} className="mb-1"></p>;
  };

  const parseBold = (text: string) => {
      // Replace **text** with <b>text</b>
      return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  };

  return (
    <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="w-full max-w-md h-[80vh] bg-[#f0e6d2] shadow-2xl relative rounded-sm rotate-1 flex flex-col animate-stamp overflow-hidden border border-stone-400">
          
          {/* Crumpled Texture Overlay */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/crumpled-paper.png')] opacity-40 pointer-events-none mix-blend-multiply"></div>

          {/* Header */}
          <div className="p-4 border-b-2 border-stone-800/20 flex justify-between items-center z-10 bg-[#f0e6d2]">
              <div className="flex items-center gap-2">
                  <Zap size={20} className="text-yellow-600 fill-yellow-600" />
                  <h2 className="font-serif font-bold text-xl text-stone-900 uppercase tracking-tight">Revision Sheet</h2>
              </div>
              <button onClick={onClose} className="text-stone-500 hover:text-stone-900"><X size={24} /></button>
          </div>

          {/* Dense Content */}
          <div className="flex-1 overflow-y-auto p-6 z-10 font-handwriting text-stone-900 text-lg leading-tight">
               {content.split('\n').map((line, i) => renderLine(line, i))}
          </div>

          {/* Footer / Actions */}
          <div className="p-4 border-t-2 border-stone-800/20 z-10 bg-[#e6dbc4] flex justify-center">
              <button className="bg-stone-900 text-yellow-50 px-6 py-3 rounded shadow-lg font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-stone-800 hover:scale-105 transition-all">
                  <Download size={14} /> Save to Lock Screen
              </button>
          </div>
      </div>
    </div>
  );
};

export default CheatSheetModal;
