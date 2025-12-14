import React, { useState } from 'react';
import { Flashcard } from '../types';
import { X, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';

interface FlashcardDeckProps {
  cards: Flashcard[];
  onClose: () => void;
}

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards, onClose }) => {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) {
      return (
          <div className="fixed inset-0 bg-stone-900/80 backdrop-blur z-[60] flex items-center justify-center p-8">
              <div className="bg-white p-8 rounded-xl text-center max-w-sm">
                  <p className="font-serif text-stone-600 mb-4">No cards yet. Use the "Simplify" tool to generate flashcards automatically.</p>
                  <button onClick={onClose} className="text-stone-400 hover:text-stone-800">Close</button>
              </div>
          </div>
      );
  }

  const current = cards[index];

  return (
    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur z-[60] flex flex-col items-center justify-center p-8">
      
      <div className="w-full max-w-2xl flex justify-between items-center text-white mb-8">
          <h2 className="font-sans font-bold text-xl tracking-wide">Review Deck ({index + 1}/{cards.length})</h2>
          <button onClick={onClose}><X size={24} /></button>
      </div>

      {/* Card */}
      <div 
        className="w-full max-w-lg aspect-video perspective-1000 cursor-pointer"
        onClick={() => setFlipped(!flipped)}
      >
          <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
              
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-paper shadow-2xl rounded-xl p-12 flex flex-col justify-center items-center text-center border border-stone-200">
                  <span className="absolute top-6 left-6 text-xs font-bold text-stone-400 uppercase tracking-widest">Term</span>
                  <p className="font-serif text-2xl text-ink leading-relaxed">{current.front}</p>
                  <div className="absolute bottom-6 right-6 text-stone-300">
                      <RotateCw size={16} />
                  </div>
              </div>

              {/* Back */}
              <div className="absolute inset-0 backface-hidden bg-stone-800 shadow-2xl rounded-xl p-12 flex flex-col justify-center items-center text-center rotate-y-180 text-white">
                   <span className="absolute top-6 left-6 text-xs font-bold text-stone-500 uppercase tracking-widest">Analogy</span>
                   <p className="font-sans text-xl leading-relaxed text-stone-200">{current.back}</p>
              </div>

          </div>
      </div>

      {/* Controls */}
      <div className="flex gap-8 mt-12">
          <button 
            onClick={() => { setIndex(Math.max(0, index - 1)); setFlipped(false); }}
            disabled={index === 0}
            className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-colors"
          >
              <ChevronLeft size={24} />
          </button>
          <button 
            onClick={() => { setIndex(Math.min(cards.length - 1, index + 1)); setFlipped(false); }}
            disabled={index === cards.length - 1}
            className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-colors"
          >
              <ChevronRight size={24} />
          </button>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default FlashcardDeck;
