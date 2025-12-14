
import React from 'react';
import { RevisionMode } from '../types';
import { Timer, Brain, Target, FileText, Headphones, X } from 'lucide-react';

interface RevisionMenuProps {
  onSelect: (mode: RevisionMode) => void;
  onClose: () => void;
  loading?: boolean;
}

const RevisionMenu: React.FC<RevisionMenuProps> = ({ onSelect, onClose, loading }) => {
  const modes = [
      { id: 'QUICK_TEST', label: 'Quick Quiz', icon: Timer, desc: 'Rapid MCQ Sprint', color: 'text-orange-500' },
      { id: 'DETAILED_TEST', label: 'Deep Dive', icon: Brain, desc: 'Short Answers + Rubric', color: 'text-purple-500' },
      { id: 'IMPORTANT_Q', label: 'High Yield', icon: Target, desc: 'Must-Know Exam Qs', color: 'text-red-500' },
      { id: 'CHEAT_SHEET', label: 'Cheat Sheet', icon: FileText, desc: '1-Page Summary', color: 'text-blue-500' },
      { id: 'AUDIO_SUMMARY', label: 'Audio Recap', icon: Headphones, desc: 'Listen on Commute', color: 'text-green-500' },
  ];

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-xl border border-white/50 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-pop-in">
            
            {/* Header */}
            <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-white/50">
                <div>
                    <h3 className="font-serif font-bold text-xl text-stone-800 flex items-center gap-2">
                        <span className="text-2xl">⚡</span> Revision Engine
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">Select a study mode to activate the AI.</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-700 transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Grid Buttons */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {modes.map((mode) => (
                    <button
                        key={mode.id}
                        onClick={() => onSelect(mode.id as RevisionMode)}
                        disabled={loading}
                        className={`group relative p-4 rounded-xl border border-stone-200 bg-white hover:border-stone-400 hover:shadow-lg transition-all text-left flex flex-col gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className={`p-2 rounded-lg bg-stone-50 group-hover:bg-stone-100 transition-colors ${mode.color}`}>
                                <mode.icon size={20} />
                            </div>
                            {/* Hover Arrow */}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 text-lg">→</span>
                        </div>
                        
                        <div>
                            <span className="block font-bold text-stone-700 text-sm">{mode.label}</span>
                            <span className="block text-xs text-stone-400">{mode.desc}</span>
                        </div>
                    </button>
                ))}
            </div>

            {loading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div>
                        <p className="text-xs font-bold uppercase tracking-widest text-stone-500 animate-pulse">Generating Artifact...</p>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default RevisionMenu;
