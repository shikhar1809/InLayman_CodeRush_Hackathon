
import React, { useState, useEffect } from 'react';
import { analyzeTextIntent, checkExamFrequency } from '../services/geminiService';
import { Wand2, Search, Eraser, MoreHorizontal, Sparkles, Mic, Library, Shapes, Flame, Activity, Book, Globe } from 'lucide-react';
import { TextIntentAnalysis, ExamMetadata } from '../types';

interface SmartLassoMenuProps {
  selectionText: string;
  onExplain: () => void;
  onEnhance: () => void;
  onLookup: (source: 'personal' | 'community') => void;
  onVisualize: () => void;
}

const SmartLassoMenu: React.FC<SmartLassoMenuProps> = ({ selectionText, onExplain, onEnhance, onLookup, onVisualize }) => {
  const [analysis, setAnalysis] = useState<TextIntentAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [examData, setExamData] = useState<ExamMetadata | null>(null);
  const [showLookupOptions, setShowLookupOptions] = useState(false);

  useEffect(() => {
    let active = true;
    const analyze = async () => {
        setLoading(true);
        setVisible(true);
        setExamData(null); // Reset
        setShowLookupOptions(false); // Reset menu state
        
        try {
            // Parallel Execution: Intent + Exam Check
            const [intentResult, examResult] = await Promise.all([
                analyzeTextIntent(selectionText),
                checkExamFrequency(selectionText)
            ]);
            
            if (active) {
                setAnalysis(intentResult);
                setExamData(examResult);
            }
        } catch (e) {
            if (active) {
                setAnalysis({ primary_intent: 'COMPLEXITY', suggested_action_label: 'Explain' });
            }
        } finally {
            if (active) setLoading(false);
        }
    };
    analyze();
    return () => { active = false; };
  }, [selectionText]);

  const containerClasses = `fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-50 transition-all duration-300 ease-out transform ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`;

  if (loading) {
      return (
          <div className={containerClasses}>
              <div className="bg-stone-800/90 text-white rounded-full px-5 py-3 shadow-xl flex items-center gap-3 backdrop-blur-sm border border-stone-600">
                  <Sparkles size={16} className="animate-spin text-yellow-300" />
                  <span className="text-xs font-bold uppercase tracking-widest">Thinking...</span>
              </div>
          </div>
      );
  }

  if (!analysis) return null;

  return (
    <div className={containerClasses}>
        
        {/* Exam Radar Badge (Popup if Hot) */}
        {examData && examData.is_exam_favorite && (
             <div className="bg-red-50 text-red-900 border border-red-200 rounded-full px-4 py-1.5 shadow-lg flex items-center gap-2 animate-pop-in mb-1">
                 <Flame size={14} className="text-red-600 fill-red-600 animate-pulse" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">High Yield Topic</span>
                 <span className="text-[10px] font-serif opacity-80 border-l border-red-200 pl-2 ml-1">{examData.frequency_rating} Frequency</span>
             </div>
        )}

        {/* Lookup Sub-Menu (Pops up above Lookup button) */}
        {showLookupOptions && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-stone-200 p-1.5 flex gap-2 animate-pop-in z-50">
                <button 
                    onClick={() => { onLookup('personal'); setShowLookupOptions(false); }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-stone-100 rounded-lg text-stone-700 transition-colors whitespace-nowrap"
                >
                    <Book size={14} className="text-stone-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">My Notes</span>
                </button>
                <div className="w-px bg-stone-200 my-1"></div>
                <button 
                    onClick={() => { onLookup('community'); setShowLookupOptions(false); }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 rounded-lg text-indigo-700 transition-colors whitespace-nowrap"
                >
                    <Globe size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Community</span>
                </button>
            </div>
        )}

        {/* The Magic Tool Belt */}
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md p-2 rounded-full shadow-2xl border border-stone-200 animate-pop-in relative">
            
            {/* 1. Explain (Voice) */}
            <button 
                onClick={onExplain}
                className="p-3 rounded-full hover:bg-stone-100 transition-colors group flex flex-col items-center gap-1 min-w-[60px]"
                title="Explain (Voice)"
            >
                <div className={`p-2 rounded-full ${analysis.primary_intent === 'COMPLEXITY' ? 'bg-yellow-100 text-yellow-700' : 'bg-stone-100 text-stone-600'} group-hover:scale-110 transition-transform`}>
                    <Mic size={18} />
                </div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Explain</span>
            </button>

            {/* 2. Enhance (Context Rewrite) */}
            <button 
                onClick={onEnhance}
                className="p-3 rounded-full hover:bg-stone-100 transition-colors group flex flex-col items-center gap-1 min-w-[60px]"
                title="Enhance with Context"
            >
                 <div className={`p-2 rounded-full ${analysis.primary_intent === 'DRAFT' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'} group-hover:scale-110 transition-transform`}>
                    <Sparkles size={18} />
                </div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Enhance</span>
            </button>

             {/* 3. Lookup (Deep Dive) - Toggles Options */}
            <button 
                onClick={() => setShowLookupOptions(!showLookupOptions)}
                className={`p-3 rounded-full hover:bg-stone-100 transition-colors group flex flex-col items-center gap-1 min-w-[60px] ${showLookupOptions ? 'bg-stone-50' : ''}`}
                title="Deep Dive Lookup"
            >
                 <div className={`p-2 rounded-full ${analysis.primary_intent === 'CLAIM' ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-600'} group-hover:scale-110 transition-transform`}>
                    <Library size={18} />
                </div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Lookup</span>
            </button>

            <div className="w-px h-8 bg-stone-200 mx-1"></div>

             {/* 4. Visualize (Mindmap) */}
            <button 
                onClick={onVisualize}
                className="p-3 rounded-full hover:bg-stone-100 transition-colors group flex flex-col items-center gap-1 min-w-[60px]"
                title="Generate Diagram"
            >
                 <div className="p-2 rounded-full bg-stone-100 text-stone-600 group-hover:scale-110 transition-transform">
                    <Shapes size={18} />
                </div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Visuals</span>
            </button>

        </div>

    </div>
  );
};

export default SmartLassoMenu;
