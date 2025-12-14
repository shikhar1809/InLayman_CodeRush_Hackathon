
import React from 'react';
import { TopicProfile } from '../types';
import { BrainCircuit, Activity, Layers, ArrowRight } from 'lucide-react';

interface TopicCardProps {
  profile: TopicProfile;
  onPractice: (question: string, answer: string) => void;
}

const TopicCard: React.FC<TopicCardProps> = ({ profile, onPractice }) => {
  const { topic_name, layman_summary, stats, prerequisites, practice_pod } = profile;
  
  const getToughnessColor = (score: number) => {
      if (score <= 4) return 'bg-green-100 text-green-700 border-green-200';
      if (score <= 7) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <div className="w-[300px] h-auto bg-white rounded-xl shadow-paper border border-stone-200 overflow-hidden flex flex-col font-serif select-none">
        
        {/* Header */}
        <div className="bg-stone-50 p-4 border-b border-stone-100 flex justify-between items-start">
            <div>
                <h3 className="font-bold text-lg leading-tight text-stone-800">{topic_name}</h3>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getToughnessColor(stats.toughness_score)} inline-block mt-1`}>
                    {stats.toughness_label} ({stats.toughness_score}/10)
                </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                <BrainCircuit size={16} className="text-stone-400" />
            </div>
        </div>

        {/* Body */}
        <div className="p-4 flex-grow space-y-4">
            
            {/* Summary */}
            <p className="text-sm text-stone-600 leading-relaxed font-sans">
                {layman_summary}
            </p>

            {/* Exam Frequency */}
            <div>
                <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-bold uppercase text-stone-400 flex items-center gap-1">
                        <Activity size={10} /> Exam Frequency
                    </span>
                    <span className="text-[10px] font-bold text-stone-800">{stats.exam_frequency_score}/10</span>
                </div>
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                        style={{ width: `${stats.exam_frequency_score * 10}%` }}
                    ></div>
                </div>
                <p className="text-[9px] text-stone-400 mt-1 italic">"{stats.exam_note}"</p>
            </div>

            {/* Prerequisites */}
            <div>
                 <span className="text-[10px] font-bold uppercase text-stone-400 flex items-center gap-1 mb-2">
                    <Layers size={10} /> Prerequisites
                </span>
                <div className="flex flex-wrap gap-1">
                    {(prerequisites || []).map((req, i) => (
                        <span key={i} className="px-2 py-1 bg-stone-100 text-stone-600 rounded text-[10px] font-bold border border-stone-200">
                            {req}
                        </span>
                    ))}
                </div>
            </div>

        </div>

        {/* Footer Action */}
        <div className="p-3 bg-stone-50 border-t border-stone-100">
            <button 
                onClick={(e) => { e.stopPropagation(); onPractice(practice_pod?.question || "Review Topic", practice_pod?.answer || "No answer provided."); }}
                className="w-full bg-stone-800 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-stone-700 transition-colors flex items-center justify-center gap-2"
            >
                {practice_pod?.button_label || "Practice"} <ArrowRight size={12} />
            </button>
        </div>

    </div>
  );
};

export default TopicCard;
