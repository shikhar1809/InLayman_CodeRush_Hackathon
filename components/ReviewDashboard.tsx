import React, { useEffect, useState } from 'react';
import { srsSystem } from '../services/srsSystem';
import { generateReviewQuestion } from '../services/gemini';
import { ReviewItem, Question } from '../types';
import { Clock, Mail, CheckCircle2, XCircle, ArrowRight, BrainCircuit, Loader2, Calendar, Download } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

interface Props {
    onBack: () => void;
    initialTopic?: string;
}

const ReviewDashboard: React.FC<Props> = ({ onBack, initialTopic }) => {
    const [dueItems, setDueItems] = useState<ReviewItem[]>([]);
    const [activeReview, setActiveReview] = useState<ReviewItem | null>(null);
    const [question, setQuestion] = useState<Question | null>(null);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

    useEffect(() => {
        const due = srsSystem.getDueItems();
        setDueItems(due);
        
        if (initialTopic) {
            // Find or create dummy item for ad-hoc review
            const existing = srsSystem.getAll().find(i => i.topic === initialTopic);
            const itemToReview = existing || { 
                topic: initialTopic, 
                stage: 1, 
                nextReviewDate: 0, 
                lastReviewedDate: 0, 
                masteryLevel: 0 
            } as ReviewItem;
            startReview(itemToReview);
        }
    }, [initialTopic]);

    const startReview = async (item: ReviewItem) => {
        setLoading(true);
        setActiveReview(item);
        const q = await generateReviewQuestion(item.topic);
        setQuestion(q);
        setLoading(false);
    };

    const handleAnswer = (optionIdx: number) => {
        if (!question || !activeReview) return;

        const isCorrect = optionIdx === question.correctAnswer;
        setFeedback(isCorrect ? 'correct' : 'wrong');
        
        // Wait briefly then update SRS
        setTimeout(() => {
            srsSystem.submitReview(activeReview.topic, isCorrect);
            setDueItems(srsSystem.getDueItems()); // Refresh list
            if (initialTopic) {
                onBack(); // If direct review, go back after one question
            } else {
                setActiveReview(null);
                setQuestion(null);
                setFeedback(null);
            }
        }, 1500);
    };

    const handleSendAlert = () => {
        const mailto = srsSystem.generateMailAlert(dueItems);
        if (mailto) {
            window.location.href = mailto;
        } else {
            alert("No items due for review!");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="text-slate-400 hover:text-white transition">
                    &larr; Back to {initialTopic ? 'Profile' : 'Home'}
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Spaced Repetition System</span>
                    <BrainCircuit className="w-5 h-5 text-primary-500" />
                </div>
            </div>

            {!activeReview ? (
                // --- DASHBOARD VIEW ---
                <div className="space-y-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center">
                        <h2 className="text-3xl font-bold text-white mb-2">Review Dashboard</h2>
                        <p className="text-slate-400 max-w-lg mx-auto mb-6">
                            We use the Day 1, 2, 4, 7 method to ensure you never forget a concept.
                            Review items now to lock them into long-term memory.
                        </p>
                        
                        <div className="flex justify-center gap-4">
                            <div className="bg-slate-950 px-6 py-3 rounded-xl border border-slate-800">
                                <div className="text-2xl font-black text-white">{dueItems.length}</div>
                                <div className="text-xs text-slate-500 font-bold uppercase">Due Now</div>
                            </div>
                            <button 
                                onClick={handleSendAlert}
                                disabled={dueItems.length === 0}
                                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-50"
                            >
                                <Mail className="w-4 h-4" /> Send Alert via Mail
                            </button>
                            <button 
                                onClick={() => srsSystem.exportToAnki()}
                                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center gap-2 transition"
                            >
                                <Download className="w-4 h-4" /> Export to Anki
                            </button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {(dueItems || []).map((item) => (
                            <motion.div 
                                key={item.topic}
                                layout
                                className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex justify-between items-center group hover:border-primary-500/30 transition-colors"
                            >
                                <div>
                                    <h3 className="font-bold text-lg text-slate-200">{item.topic}</h3>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                            Stage: Day {item.stage}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-500">
                                            Lvl {item.masteryLevel}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => startReview(item)}
                                    className="p-3 bg-primary-600 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 shadow-lg shadow-primary-900/50"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </motion.div>
                        ))}
                        
                        {dueItems.length === 0 && (
                            <div className="col-span-2 text-center py-12 text-slate-500">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                All caught up! Check back tomorrow.
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // --- ACTIVE REVIEW SESSION ---
                <div className="max-w-2xl mx-auto">
                    {loading ? (
                        <div className="text-center py-20">
                            <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white">Generating Context-Aware Question...</h3>
                            <p className="text-slate-500">Recalling analogy context for "{activeReview.topic}"</p>
                        </div>
                    ) : question ? (
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                             {/* Feedback Overlay */}
                             <AnimatePresence>
                                {feedback && (
                                    <motion.div 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }}
                                        className={`absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm ${feedback === 'correct' ? 'bg-green-500/10' : 'bg-red-500/10'}`}
                                    >
                                        <motion.div 
                                            initial={{ scale: 0.5 }} 
                                            animate={{ scale: 1 }}
                                            className={`p-6 rounded-2xl border ${feedback === 'correct' ? 'bg-green-500 border-green-400 text-white' : 'bg-red-500 border-red-400 text-white'} shadow-2xl`}
                                        >
                                            {feedback === 'correct' ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <CheckCircle2 className="w-10 h-10" />
                                                    <span className="font-bold text-xl">Retained!</span>
                                                    <span className="text-xs opacity-80">Next review in {activeReview.stage * 2} days</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <XCircle className="w-10 h-10" />
                                                    <span className="font-bold text-xl">Needs Work</span>
                                                    <span className="text-xs opacity-80">Resetting to Day 1</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    </motion.div>
                                )}
                             </AnimatePresence>

                             <div className="flex justify-between items-center mb-6">
                                <span className="text-xs font-bold text-primary-400 uppercase tracking-widest bg-primary-500/10 px-3 py-1 rounded-full">Recall Check</span>
                                <span className="text-slate-500 text-sm font-mono">{activeReview.topic}</span>
                             </div>

                             <h3 className="text-xl font-bold text-white mb-8">{question.text}</h3>

                             <div className="space-y-3">
                                {(question.options || []).map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        className="w-full text-left p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:border-primary-500 hover:text-white transition-colors"
                                    >
                                        {opt}
                                    </button>
                                ))}
                             </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default ReviewDashboard;