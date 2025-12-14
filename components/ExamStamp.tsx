import React from 'react';
import { Flame } from 'lucide-react';
import { ExamMetadata } from '../types';

interface ExamStampProps {
  metadata: ExamMetadata;
}

const ExamStamp: React.FC<ExamStampProps> = ({ metadata }) => {
  if (!metadata.is_exam_favorite) return null;

  return (
    <div className="group absolute -right-16 top-0 cursor-help opacity-70 hover:opacity-100 transition-opacity z-10">
      <div className="w-12 h-12 border-2 border-red-800 rounded-full flex flex-col items-center justify-center transform rotate-12 animate-stamp">
         <Flame size={16} className="text-red-800" />
         <span className="text-[8px] font-bold text-red-900 uppercase tracking-tighter leading-none mt-1">Exam<br/>Fav</span>
      </div>
      
      {/* Tooltip */}
      <div className="absolute top-14 right-0 w-32 bg-red-50 border border-red-200 p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
          <p className="text-xs font-bold text-red-900 mb-1">🔥 Hot Topic</p>
          <p className="text-[10px] text-red-800 leading-tight">
            {metadata.context || `Often seen in exams. Rating: ${metadata.frequency_rating}`}
          </p>
      </div>
    </div>
  );
};

export default ExamStamp;
