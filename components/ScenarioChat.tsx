

import React, { useState, useEffect, useRef } from 'react';
import { startScenario, continueScenario } from '../services/gemini';
import { ScenarioState, ScenarioLevel } from '../types';
import { MessageSquare, Target, User, Bot, Loader2, ArrowRight, Briefcase, Zap, Shield, Crown } from 'lucide-react';
import { motion as motionBase } from 'framer-motion';

const motion = motionBase as any;

interface Props {
  topic: string;
  onBack: () => void;
}

const ScenarioChat: React.FC<Props> = ({ topic, onBack }) => {
  const [level, setLevel] = useState<ScenarioLevel | null>(null);
  const [state, setState] = useState<ScenarioState | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      // Clear state on topic change just in case
      setState(null);
      setLevel(null);
  }, [topic]);

  useEffect(() => {
      if (level && !state && !loading) {
          const init = async () => {
            setLoading(true);
            const s = await startScenario(topic, level);
            setState(s);
            setLoading(false);
        };
        init();
      }
  }, [level]);

  useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state?.history]);

  const handleSend = async () => {
      if (!input.trim() || !state) return;
      const val = input;
      setInput('');
      setLoading(true);
      const newState = await continueScenario(state, val);
      setState(newState);
      setLoading(false);
  };

  // LEVEL SELECTION SCREEN
  if (!level) {
      return (
          <div className="max-w-5xl mx-auto p-8 h-screen flex flex-col justify-center">
              <button onClick={onBack} className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2"><ArrowRight className="rotate-180 w-4 h-4"/> Cancel</button>
              
              <div className="text-center mb-10">
                  <span className="text-xs font-bold text-primary-400 uppercase tracking-widest bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/20">Real World Simulation</span>
                  <h1 className="text-4xl font-bold text-white mt-4 mb-2">Choose Your Clearance Level</h1>
                  <p className="text-slate-400">Select difficulty for the <b>{topic}</b> scenario.</p>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                  {[
                      { l: 'Intern', icon: Briefcase, color: 'text-slate-400', border: 'border-slate-700', bg: 'bg-slate-900', desc: "Low stakes. Guided tasks. Perfect for beginners." },
                      { l: 'Junior', icon: Zap, color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-900/10', desc: "Standard bugs and features. Some hand-holding." },
                      { l: 'Senior', icon: Shield, color: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-900/10', desc: "High stakes. Complex architecture. Minimal guidance." },
                      { l: 'Principal', icon: Crown, color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-900/10', desc: "System Critical. Crisis Management. Experts only." }
                  ].map((item) => (
                      <motion.button 
                        key={item.l}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setLevel(item.l as ScenarioLevel)}
                        className={`p-6 rounded-2xl border flex flex-col items-center text-center transition-all ${item.bg} ${item.border} hover:bg-slate-800 hover:border-white/20`}
                      >
                          <div className={`w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center mb-4 border border-slate-800 shadow-lg`}>
                              <item.icon className={`w-8 h-8 ${item.color}`} />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">{item.l}</h3>
                          <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                      </motion.button>
                  ))}
              </div>
          </div>
      )
  }

  // LOADING STATE
  if (loading && !state) {
      return (
        <div className="h-screen flex flex-col items-center justify-center text-center">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4"/>
            <h2 className="text-2xl font-bold text-white">Initializing {level} Environment...</h2>
            <p className="text-slate-500">Generative AI is building a unique scenario for {topic}.</p>
        </div>
      );
  }

  if (!state) return <div>Error loading state.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-80px)] flex flex-col">
       <div className="flex justify-between items-center mb-4">
            <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 w-fit">
                <ArrowRight className="rotate-180 w-4 h-4"/> Abort Mission
            </button>
            <div className="px-3 py-1 bg-slate-800 rounded-full text-xs font-bold text-slate-300 border border-slate-700">
                Clearance: <span className="text-white">{level}</span>
            </div>
       </div>
       
       <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col flex-1 shadow-2xl">
           {/* Header */}
           <div className="p-6 border-b border-slate-800 bg-slate-950">
               <div className="flex items-center gap-2 text-primary-400 font-bold uppercase text-xs tracking-widest mb-2">
                   <Target className="w-4 h-4"/> Simulation Mode
               </div>
               <h2 className="text-2xl font-bold text-white mb-1">Scenario: {state.topic}</h2>
               <div className="flex flex-col md:flex-row gap-2 md:gap-4 text-sm mt-2">
                   <span className="text-slate-400 flex items-center gap-1"><Bot size={14}/> Opponent: <b className="text-white">{state.role}</b></span>
                   <span className="text-slate-400 flex items-center gap-1"><Target size={14}/> Goal: <b className="text-white">{state.objective}</b></span>
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
                       {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0 border border-red-500/30"><Bot size={16}/></div>}
                       <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${
                           msg.role === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                       }`}>
                           {msg.text}
                       </div>
                       {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 border border-slate-700"><User size={16}/></div>}
                   </motion.div>
               ))}
               
               {state.isComplete && (
                   <div className={`p-6 rounded-xl border text-center my-8 shadow-xl ${state.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                       <h3 className={`text-2xl font-black mb-2 ${state.success ? 'text-green-400' : 'text-red-400'}`}>
                           {state.success ? 'Mission Accomplished' : 'Mission Failed'}
                       </h3>
                       <p className="text-slate-300 italic mb-4">"{state.feedback}"</p>
                       <button onClick={onBack} className="px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition">Return to Base</button>
                   </div>
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
                            placeholder={`Reply to the ${state.role}...`}
                       />
                       <button 
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="p-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl disabled:opacity-50 transition-colors shadow-lg"
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

export default ScenarioChat;