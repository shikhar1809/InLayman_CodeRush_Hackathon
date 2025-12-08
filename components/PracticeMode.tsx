import React, { useState, useEffect, useRef } from 'react';
import { startPracticeSession, continuePracticeSession } from '../services/gemini';
import { PracticeState } from '../types';
import { MessageSquare, User, Bot, Loader2, ArrowRight, BookOpen, AlertCircle, CheckCircle2, Award } from 'lucide-react';
import { motion as motionBase } from 'framer-motion';

const motion = motionBase as any;

interface Props {
  topic: string;
  onBack: () => void;
}

const PracticeMode: React.FC<Props> = ({ topic, onBack }) => {
  const [state, setState] = useState<PracticeState | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        const s = await startPracticeSession(topic);
        setState(s);
        setLoading(false);
    };
    init();
  }, [topic]);

  useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state?.history]);

  const handleSend = async () => {
      if (!input.trim() || !state) return;
      const val = input;
      setInput('');
      setLoading(true);
      const newState = await continuePracticeSession(state, val);
      setState(newState);
      setLoading(false);
  };

  if (!state) return <div className="p-10 text-center flex flex-col items-center"><Loader2 className="animate-spin mb-4 w-8 h-8 text-primary-500"/><span className="text-slate-400">Preparing Practice Session...</span></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-80px)] flex flex-col">
       <button onClick={onBack} className="text-slate-400 hover:text-white mb-4 flex items-center gap-2 w-fit">
           <ArrowRight className="rotate-180 w-4 h-4"/> End Practice
       </button>
       
       <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col flex-1 shadow-2xl">
           {/* Header */}
           <div className="p-6 border-b border-slate-800 bg-slate-950">
               <div className="flex items-center gap-2 text-primary-400 font-bold uppercase text-xs tracking-widest mb-2">
                   <BookOpen className="w-4 h-4"/> Feynman Technique
               </div>
               <h2 className="text-2xl font-bold text-white mb-1">Teaching: {state.topic}</h2>
               <div className="flex gap-4 text-sm text-slate-400">
                   Your Student: <span className="text-white font-bold">{state.studentName}</span> (Beginner)
               </div>
           </div>

           {/* Chat Area */}
           <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/50">
               {state.history.map((msg, i) => (
                   <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={i} 
                        className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                   >
                       {msg.role === 'model' && (
                           <div className="flex flex-col items-center gap-1 shrink-0">
                               <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 border border-yellow-500/30">
                                   <User size={20}/>
                               </div>
                               <span className="text-[10px] text-slate-500 font-bold">{state.studentName}</span>
                           </div>
                       )}
                       
                       <div className={`p-4 rounded-2xl max-w-[75%] text-sm leading-relaxed shadow-sm ${
                           msg.role === 'user' 
                           ? 'bg-primary-600 text-white rounded-tr-none' 
                           : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                       }`}>
                           {msg.text}
                       </div>
                       
                       {msg.role === 'user' && (
                           <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 border border-slate-700">
                               <User size={20}/>
                           </div>
                       )}
                   </motion.div>
               ))}
               
               {state.isComplete && (
                   <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`p-8 rounded-2xl border text-center my-8 shadow-2xl relative overflow-hidden ${state.score && state.score > 70 ? 'bg-green-900/20 border-green-500/30' : 'bg-orange-900/20 border-orange-500/30'}`}
                   >
                       <div className="relative z-10">
                           <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${state.score && state.score > 70 ? 'bg-green-500 text-slate-900' : 'bg-orange-500 text-slate-900'}`}>
                               <Award className="w-8 h-8" />
                           </div>
                           <h3 className={`text-3xl font-black mb-2 ${state.score && state.score > 70 ? 'text-green-400' : 'text-orange-400'}`}>
                               {state.score && state.score > 70 ? 'Concept Mastered!' : 'Needs Clarification'}
                           </h3>
                           <div className="text-5xl font-bold text-white mb-6">{state.score}%</div>
                           
                           <div className="bg-slate-950/50 p-6 rounded-xl border border-white/5 text-left max-w-lg mx-auto">
                               <p className="text-slate-300 italic mb-4">"{state.feedback}"</p>
                               {state.weakAreas && state.weakAreas.length > 0 && (
                                   <div>
                                       <h4 className="text-xs font-bold text-red-400 uppercase mb-2 flex items-center gap-2"><AlertCircle size={12}/> Confusing Areas</h4>
                                       <ul className="list-disc pl-4 text-sm text-slate-400 space-y-1">
                                           {state.weakAreas.map((area, idx) => <li key={idx}>{area}</li>)}
                                       </ul>
                                   </div>
                               )}
                           </div>
                       </div>
                   </motion.div>
               )}
               <div ref={bottomRef}></div>
           </div>

           {/* Input */}
           {!state.isComplete && (
               <div className="p-4 bg-slate-950 border-t border-slate-800">
                   <div className="flex gap-2">
                       <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            disabled={loading}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:outline-none focus:border-primary-500"
                            placeholder="Explain it simply... (be specific)"
                       />
                       <button 
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="p-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl disabled:opacity-50 transition-colors"
                       >
                           {loading ? <Loader2 className="animate-spin"/> : <MessageSquare/>}
                       </button>
                   </div>
               </div>
           )}
       </div>
    </div>
  );
};

export default PracticeMode;