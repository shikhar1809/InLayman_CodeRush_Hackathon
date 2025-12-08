import React, { useMemo } from 'react';
import { LearningPath, PrerequisiteNode, NextSteps } from '../types';
import { Lock, Check, Play, BookOpen, Clock, Unlock, SkipForward, Target, GraduationCap, ArrowRight, Lightbulb } from 'lucide-react';
import { motion as motionBase } from 'framer-motion';

const motion = motionBase as any;

interface Props {
  data: LearningPath;
  onSelectNode: (nodeId: string) => void;
  onPractice: (nodeLabel: string) => void;
  onSimulate: (nodeLabel: string) => void;
  currentNodeId: string;
  nextSteps?: NextSteps | null;
  onSelectTopic: (topic: string) => void;
}

const LearningPathGraph: React.FC<Props> = ({ data, onSelectNode, onPractice, onSimulate, currentNodeId, nextSteps, onSelectTopic }) => {
  
  const sortedNodes = useMemo(() => {
    if (!data.nodes || data.nodes.length === 0) return [];
    return data.nodes;
  }, [data]);

  const isCompleted = sortedNodes.every(n => n.status === 'completed');

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col">
        {sortedNodes.map((node, index) => {
          const isLocked = node.status === 'locked';
          const isCompletedStatus = node.status === 'completed';
          const isCurrent = node.id === currentNodeId;
          const isAvailable = node.status === 'available';

          const isLast = index === sortedNodes.length - 1;

          return (
            <motion.div 
              key={node.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex group"
            >
              {/* Left Column: Time/Step */}
              <div className="w-24 flex flex-col items-end pr-6 py-6 text-right shrink-0">
                 <span className={`text-xs font-bold uppercase tracking-wider ${isCurrent ? 'text-primary-400' : 'text-slate-500'}`}>
                    Step {index + 1}
                 </span>
                 <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                    <Clock className="w-3 h-3" /> {node.time || '~5 min'}
                 </div>
              </div>

              {/* Middle Column: Line and Dot */}
              <div className="relative flex flex-col items-center px-2">
                 {/* Connection Line */}
                 {!isLast && (
                    <div className={`absolute top-8 bottom-[-32px] w-0.5 z-0 ${isCompletedStatus ? 'bg-green-500/20' : 'bg-slate-800'}`}></div>
                 )}
                 
                 {/* Node Dot */}
                 <div className={`relative z-10 w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                     isCompletedStatus ? 'bg-green-500 border-green-900/50' :
                     isCurrent ? 'bg-primary-600 border-primary-900/50 scale-125 shadow-lg shadow-primary-500/30' :
                     isAvailable ? 'bg-slate-800 border-primary-500/30' :
                     'bg-slate-900 border-slate-800'
                 }`}>
                    {isCompletedStatus && <Check className="w-4 h-4 text-white" />}
                    {isCurrent && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                    {isLocked && <Lock className="w-3 h-3 text-slate-600" />}
                 </div>
              </div>

              {/* Right Column: Card Content */}
              <div className="flex-1 pb-8 pl-6">
                 <div 
                    className={`relative overflow-hidden rounded-xl border p-6 transition-all duration-300 ${
                        isCurrent 
                            ? 'bg-slate-800 border-primary-500 shadow-xl shadow-primary-500/10 scale-[1.02]' 
                            : isLocked 
                                ? 'bg-slate-900/40 border-slate-800/50' 
                                : 'bg-slate-900 border-slate-800 hover:border-primary-500/30 hover:shadow-lg'
                    }`}
                 >
                    {isCurrent && (
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Play className="w-24 h-24 text-primary-500 -rotate-12 transform translate-x-4 -translate-y-4" />
                        </div>
                    )}
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2 gap-4">
                            <h3 className={`font-bold text-lg leading-tight ${isCurrent ? 'text-primary-400' : isLocked ? 'text-slate-400' : 'text-slate-200'}`}>
                                {node.label}
                            </h3>
                            {isCompletedStatus && (
                                <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wide rounded-md border border-green-500/20">
                                    Done
                                </span>
                            )}
                             {isCurrent && (
                                <span className="px-2 py-1 bg-primary-500/10 text-primary-400 text-[10px] font-bold uppercase tracking-wide rounded-md border border-primary-500/20 animate-pulse">
                                    Active Lesson
                                </span>
                            )}
                        </div>
                        
                        <p className="text-sm text-slate-400 mb-5 leading-relaxed max-w-lg">
                            {node.description}
                        </p>

                        {(isCurrent || isAvailable) && !isCompletedStatus && (
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => onSelectNode(node.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-600/20 transition-colors">
                                    Start Lesson <Play className="w-3 h-3 fill-current" />
                                </button>
                                <button onClick={() => onPractice(node.label)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                                    Practice <GraduationCap className="w-3 h-3" />
                                </button>
                                <button onClick={() => onSimulate(node.label)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                                    Simulate <Target className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        {isLocked && !isCurrent && (
                            <button onClick={() => onSelectNode(node.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 text-slate-400 text-sm font-bold border border-slate-700 hover:bg-slate-800 hover:text-white transition-colors group-hover:border-slate-600">
                                <SkipForward className="w-3 h-3" /> Jump to Topic
                            </button>
                        )}
                        
                        {isCompletedStatus && (
                            <button onClick={() => onSelectNode(node.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-900/20 text-green-400 text-sm font-bold border border-green-500/20 hover:bg-green-900/30 transition-colors">
                                Review <BookOpen className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                 </div>
              </div>
            </motion.div>
          );
        })}

        {/* Next Steps Suggestions */}
        {isCompleted && nextSteps && nextSteps.suggestions && nextSteps.suggestions.length > 0 && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="mt-12 p-8 bg-slate-900 border border-slate-800 rounded-3xl border-dashed relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <ArrowRight className="w-32 h-32 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Lightbulb className="w-6 h-6 text-yellow-400" /> What to Learn Next?
                </h3>
                <div className="grid md:grid-cols-3 gap-4 relative z-10">
                    {nextSteps.suggestions.map((s, i) => (
                        <div key={i} onClick={() => onSelectTopic(s.topic)} className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-primary-500/50 cursor-pointer group transition-all">
                            <h4 className="font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">{s.topic}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">{s.reason}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        )}
      </div>
    </div>
  );
};

export default LearningPathGraph;