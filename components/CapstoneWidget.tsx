import React from 'react';
import { CapstoneProject } from '../types';
import { Hammer, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { motion as motionBase } from 'framer-motion';

const motion = motionBase as any;

interface Props {
    project: CapstoneProject | null;
    loading: boolean;
}

const CapstoneWidget: React.FC<Props> = ({ project, loading }) => {
    if (loading) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full animate-pulse">
                <div className="w-1/2 h-4 bg-slate-800 rounded mb-4"></div>
                <div className="space-y-3">
                    <div className="w-full h-12 bg-slate-800 rounded-xl"></div>
                    <div className="w-full h-12 bg-slate-800 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full flex flex-col shadow-xl">
            <div className="flex items-center gap-2 mb-2">
                <Hammer className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Capstone Project</h3>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{project.title}</h2>
            <p className="text-sm text-slate-500 mb-6 italic">"{project.goal}"</p>

            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                {project.tasks.map((task, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                            task.isCompleted 
                                ? 'bg-green-900/20 border-green-500/30' 
                                : task.isUnlocked 
                                    ? 'bg-slate-800 border-slate-700 hover:border-purple-500/50' 
                                    : 'bg-slate-900/50 border-slate-800 opacity-50'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {task.isCompleted ? (
                                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-slate-900">
                                    <CheckCircle2 size={14} />
                                </div>
                            ) : task.isUnlocked ? (
                                <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400">
                                    <ArrowRight size={14} />
                                </div>
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-600">
                                    <Lock size={14} />
                                </div>
                            )}
                            <div>
                                <h4 className={`text-sm font-bold ${task.isCompleted ? 'text-green-400 line-through' : 'text-slate-200'}`}>{task.title}</h4>
                                <p className="text-xs text-slate-500">{task.description}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default CapstoneWidget;