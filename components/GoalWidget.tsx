import React, { useState, useEffect } from 'react';
import { Target, ArrowRight, Play, Loader2, Calendar, CheckCircle2, RefreshCw } from 'lucide-react';
<<<<<<< HEAD
import { motion } from 'framer-motion';
=======
import { motion as motionBase } from 'framer-motion';
>>>>>>> 2867a5c (Update wire connection visuals)
import { generateGoalCurriculum } from '../services/gemini';
import { authService } from '../services/authService';
import { UserGoal, DayPlan } from '../types';

<<<<<<< HEAD
=======
const motion = motionBase as any;

>>>>>>> 2867a5c (Update wire connection visuals)
interface Props {
    onTaskStart: (task: DayPlan) => void;
}

const GoalWidget: React.FC<Props> = ({ onTaskStart }) => {
    const [goal, setGoal] = useState<UserGoal | null>(null);
    const [loading, setLoading] = useState(false);
    const [inputGoal, setInputGoal] = useState('');
    const [inputDuration, setInputDuration] = useState('7');

    useEffect(() => {
        const saved = authService.getGoal();
        if (saved) setGoal(saved);
        
        // Polling to update UI if goal progress changes from other components
        const interval = setInterval(() => {
             const updated = authService.getGoal();
             if (updated && JSON.stringify(updated) !== JSON.stringify(goal)) {
                 setGoal(updated);
             }
        }, 2000);
        return () => clearInterval(interval);
    }, [goal]);

    const handleCreateGoal = async () => {
        if (!inputGoal.trim()) return;
        setLoading(true);
        let curriculum;
        try {
            curriculum = await generateGoalCurriculum(inputGoal, parseInt(inputDuration));
        } catch (e) {
            console.error("Goal Gen Failed", e);
        }
        
        if (!curriculum || curriculum.length === 0) {
            // Robust Fallback
            curriculum = Array.from({ length: parseInt(inputDuration) }, (_, i) => ({
                day: i + 1,
                title: `${inputGoal} - Part ${i + 1}`,
                description: `Step ${i + 1} of mastering ${inputGoal}`,
                taskType: (i % 3 === 0 ? 'THEORY' : i % 3 === 1 ? 'CODE' : 'SIMULATION') as any,
                topic: `${inputGoal} Part ${i+1}`,
                isCompleted: false
            }));
        }

        const newGoal: UserGoal = {
            id: Date.now().toString(),
            title: inputGoal,
            durationDays: parseInt(inputDuration),
            startDate: Date.now(),
            progress: 0,
            curriculum
        };
        authService.saveGoal(newGoal);
        setGoal(newGoal);
        setLoading(false);
    };

    const handleStartToday = () => {
        if (!goal) return;
        const dayIndex = Math.min(goal.progress, goal.curriculum.length - 1);
        const task = goal.curriculum[dayIndex];
        // If all done
        if (goal.progress >= goal.durationDays) {
            alert("Goal Completed! Start a new one.");
            return;
        }
        onTaskStart(task);
    };
    
    const handleReset = () => {
        if(confirm("Abandon current goal?")) {
            localStorage.removeItem('inlayman_user_goal');
            setGoal(null);
            setInputGoal('');
        }
    }

    if (loading) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center h-full min-h-[140px] shadow-lg">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
                <span className="text-xs text-slate-400">Building your {inputDuration} day plan...</span>
            </div>
        );
    }

    if (!goal) {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-emerald-900/40 to-slate-900/80 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-4 shadow-lg relative overflow-hidden h-full flex flex-col justify-between min-h-[140px]">
                <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Goal Oriented Learning</span>
                </div>
                <div className="flex flex-col gap-2 flex-1 justify-end">
                    <input 
                        value={inputGoal}
                        onChange={(e) => setInputGoal(e.target.value)}
                        placeholder="e.g. Master React JS"
                        className="bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-full"
                    />
                    <div className="flex gap-2">
                        <select value={inputDuration} onChange={(e) => setInputDuration(e.target.value)} className="bg-slate-950/50 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none cursor-pointer">
                            <option value="3">3 Days</option>
                            <option value="7">7 Days</option>
                            <option value="14">14 Days</option>
                            <option value="30">30 Days</option>
                        </select>
                        <button onClick={handleCreateGoal} disabled={!inputGoal} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-emerald-900/20 disabled:opacity-50">
                            Start Plan
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    const currentDayIdx = Math.min(goal.progress, goal.curriculum.length - 1);
    const currentTask = goal.curriculum[currentDayIdx];
    const progressPercent = Math.min(100, Math.round(((goal.progress) / goal.durationDays) * 100));
    const isCompleted = goal.progress >= goal.durationDays;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gradient-to-br from-emerald-900/40 to-slate-900/80 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-4 shadow-lg relative overflow-hidden h-full flex flex-col justify-between min-h-[140px] group">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Current Goal</span>
                        <button onClick={handleReset} className="text-[10px] text-slate-500 hover:text-red-400 ml-2" title="Reset Goal"><RefreshCw size={10} /></button>
                    </div>
                    <div className="text-sm font-bold text-white truncate max-w-[140px]">{goal.title}</div>
                </div>
                <div className="text-right shrink-0">
                    <div className="text-xs text-slate-400">Day {Math.min(currentDayIdx + 1, goal.durationDays)}/{goal.durationDays}</div>
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
            </div>

            {isCompleted ? (
                <div className="flex flex-col items-center justify-center text-green-400 py-2">
                    <CheckCircle2 className="w-8 h-8 mb-1"/>
                    <span className="text-sm font-bold">Goal Completed!</span>
                </div>
            ) : (
                <>
                    <div className="mt-1">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Today's Mission</div>
                        <div className="text-sm text-slate-200 font-medium line-clamp-1">{currentTask?.title}</div>
                    </div>

                    <button onClick={handleStartToday} className="mt-3 w-full bg-emerald-600/20 hover:bg-emerald-600 hover:text-white text-emerald-300 border border-emerald-500/30 rounded-lg py-1.5 text-xs font-bold flex items-center justify-center gap-2 transition-all">
                        <Play className="w-3 h-3 fill-current" /> Continue
                    </button>
                </>
            )}
        </motion.div>
    );
};

export default GoalWidget;