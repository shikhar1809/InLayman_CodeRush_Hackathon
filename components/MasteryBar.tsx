import React from 'react';
import { motion as motionBase } from 'framer-motion';
import { Trophy, Star } from 'lucide-react';

const motion = motionBase as any;

interface Props {
  progress: number;
  compact?: boolean;
}

const MasteryBar: React.FC<Props> = ({ progress, compact = false }) => {
  return (
    <div className={`w-full ${compact ? '' : 'bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg'}`}>
      <div className="flex justify-between items-center mb-2">
        {!compact && (
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                </div>
                <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">Mastery Progress</span>
            </div>
        )}
        <div className="flex items-center gap-2">
            <span className={`font-black ${compact ? 'text-sm text-primary-400' : 'text-2xl text-white'}`}>{progress}%</span>
            {compact && <span className="text-xs text-slate-500 font-bold uppercase">Complete</span>}
        </div>
      </div>
      
      <div className="relative h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
        <motion.div 
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-primary-600 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
        >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        </motion.div>
        
        {/* Milestones */}
        <div className="absolute top-0 bottom-0 left-[33%] w-px bg-slate-950/50 border-r border-white/5"></div>
        <div className="absolute top-0 bottom-0 left-[66%] w-px bg-slate-950/50 border-r border-white/5"></div>
      </div>
      
      {!compact && (
          <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Novice</span>
              <span>Intermediate</span>
              <span>Expert</span>
          </div>
      )}
    </div>
  );
};

export default MasteryBar;