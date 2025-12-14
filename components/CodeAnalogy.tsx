<<<<<<< HEAD
import React, { useState } from 'react';
import { analyzeCodeDeep, evaluateCodeReconstruction } from '../services/gemini';
import { CodeDeepAnalysis, LearningPath, CodeReconstructionResult } from '../types';
import { Code, ArrowRight, Loader2, Sparkles, Play, Terminal, Trash2, Dna, ArrowLeft, CheckCircle2, Lock, Unlock, Zap, BookOpen, XCircle } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';
import LearningPathGraph from './LearningPathGraph';
import ContentPlayer from './ContentPlayer';
=======


import React, { useState } from 'react';
import { generateLabMission, submitLabMission } from '../services/gemini';
import { LabMission, LabRole, LabFeedback } from '../types';
import { Code, ArrowRight, Loader2, Play, Terminal, Trash2, ArrowLeft, CheckCircle2, Zap, Briefcase, Shield, Crown, Building2, User, AlertCircle } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';
>>>>>>> 2867a5c (Update wire connection visuals)
import confetti from 'canvas-confetti';

const motion = motionBase as any;

interface Props {
  onBack: () => void;
}

<<<<<<< HEAD
type Stage = 'INPUT' | 'ANALYZING' | 'CURRICULUM' | 'LEARNING' | 'TEST' | 'COMPLETE';

const CodeAnalogy: React.FC<Props> = ({ onBack }) => {
  const [stage, setStage] = useState<Stage>('INPUT');
  const [inputCode, setInputCode] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  
  // Deep Analysis State
  const [analysis, setAnalysis] = useState<CodeDeepAnalysis | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  
  // Learning State
  const [isLearning, setIsLearning] = useState(false);
  
  // Reconstruction State
  const [reconstructionCode, setReconstructionCode] = useState('');
  const [testResult, setTestResult] = useState<CodeReconstructionResult | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  const formatLog = (arg: any): string => {
      if (typeof arg === 'object') {
          try {
              return JSON.stringify(arg, null, 2);
          } catch (e) {
              return String(arg);
          }
      }
      return String(arg);
=======
type Stage = 'CLEARANCE' | 'BRIEF' | 'WORKSPACE' | 'REVIEW';

const LabSimulation: React.FC<Props> = ({ onBack }) => {
  const [stage, setStage] = useState<Stage>('CLEARANCE');
  const [topic, setTopic] = useState('');
  const [role, setRole] = useState<LabRole | null>(null);
  
  // Mission State
  const [mission, setMission] = useState<LabMission | null>(null);
  const [userCode, setUserCode] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  
  // Review State
  const [feedback, setFeedback] = useState<LabFeedback | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [generatingMission, setGeneratingMission] = useState(false);

  const handleStartMission = async () => {
      if (!topic.trim() || !role) return;
      setGeneratingMission(true);
      try {
          const m = await generateLabMission(topic, role);
          setMission(m);
          setUserCode(m.boilerplateCode);
          setStage('BRIEF');
      } catch (e) {
          console.error(e);
          alert("Failed to initialize lab simulation.");
      } finally {
          setGeneratingMission(false);
      }
>>>>>>> 2867a5c (Update wire connection visuals)
  };

  const runCode = () => {
      setConsoleOutput([]);
<<<<<<< HEAD
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      const logs: string[] = [];

      try {
          console.log = (...args) => logs.push(args.map(formatLog).join(' '));
          console.error = (...args) => logs.push(`[Error] ${args.map(formatLog).join(' ')}`);
          console.warn = (...args) => logs.push(`[Warn] ${args.map(formatLog).join(' ')}`);
          
          // Basic sandbox to prevent destroying the main app
          const safeFunction = new Function(`
            try {
                ${inputCode}
            } catch(e) {
                console.error(e.message);
            }
          `);
          safeFunction();
          
=======
      const logs: string[] = [];
      const originalLog = console.log;
      try {
          console.log = (...args) => logs.push(args.join(' '));
          // Basic sandbox
          const safeFunction = new Function(`
            try {
                ${userCode}
            } catch(e) {
                console.log("Error: " + e.message);
            }
          `);
          safeFunction();
>>>>>>> 2867a5c (Update wire connection visuals)
          setConsoleOutput(logs.length > 0 ? logs : ["Code executed successfully (No Output)"]);
      } catch (e: any) {
          setConsoleOutput([`Runtime Error: ${e.message}`]);
      } finally {
          console.log = originalLog;
<<<<<<< HEAD
          console.error = originalError;
          console.warn = originalWarn;
      }
  };

  const handleDeepAnalyze = async () => {
      if (!inputCode.trim()) return;
      setStage('ANALYZING');
      try {
          const res = await analyzeCodeDeep(inputCode);
          setAnalysis(res);
          setLearningPath(res.curriculum);
          
          // Set first node as current
          if (res.curriculum.nodes.length > 0) {
              res.curriculum.nodes[0].status = 'available';
              setActiveNodeId(res.curriculum.nodes[0].id);
          }
          
          setStage('CURRICULUM');
      } catch (e) {
          console.error(e);
          alert("Analysis failed. Please try again with shorter code.");
          setStage('INPUT');
      }
  };

  const handleStartLesson = (nodeId: string) => {
      setActiveNodeId(nodeId);
      setIsLearning(true);
  };

  const handleLessonComplete = () => {
      if (!learningPath || !activeNodeId) return;
      
      const newNodes = learningPath.nodes.map(n => n.id === activeNodeId ? { ...n, status: 'completed' as const } : n);
      
      // Unlock next
      const currentIndex = newNodes.findIndex(n => n.id === activeNodeId);
      if (currentIndex < newNodes.length - 1) {
          newNodes[currentIndex + 1].status = 'available';
          setActiveNodeId(newNodes[currentIndex + 1].id);
      }
      
      setLearningPath({ ...learningPath, nodes: newNodes });
      setIsLearning(false);
      
      // Check if all complete
      if (newNodes.every(n => n.status === 'completed')) {
          setTimeout(() => {
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          }, 500);
      }
  };

  const handleStartTest = () => {
      setStage('TEST');
      setReconstructionCode('');
  };

  const handleSubmitTest = async () => {
      if (!reconstructionCode.trim() || !analysis) return;
      setEvaluating(true);
      const res = await evaluateCodeReconstruction(inputCode, reconstructionCode, analysis.challengePrompt);
      setTestResult(res);
      setEvaluating(false);
      if (res.isCorrect) {
           confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
           setStage('COMPLETE');
      }
  };
  
  const getActiveNodeLabel = () => learningPath?.nodes.find(n => n.id === activeNodeId)?.label || "Concept";

  // --- RENDERERS ---

  if (stage === 'INPUT') {
      return (
        <div className="max-w-6xl mx-auto p-6 h-[calc(100vh-80px)] flex flex-col">
            <button onClick={onBack} className="text-slate-400 hover:text-white mb-4 flex items-center gap-2 w-fit">
                <ArrowRight className="rotate-180 w-4 h-4"/> Back
            </button>
            
            <div className="flex-1 grid md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-1 flex flex-col shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-bold text-white flex items-center gap-2"><Code className="text-primary-500"/> Paste Code</h2>
                            <div className="flex gap-2">
                                <button onClick={() => setInputCode('')} className="p-2 text-slate-500 hover:text-red-400 transition" title="Clear"><Trash2 size={16}/></button>
                                <button onClick={runCode} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-lg shadow-green-900/20">
                                    <Play size={12} fill="currentColor"/> Run
                                </button>
                            </div>
                        </div>
                        <textarea 
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value)}
                            className="flex-1 bg-slate-950 font-mono text-sm text-blue-300 p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-primary-500 resize-none"
                            placeholder="// Paste JS code here to analyze..."
                            spellCheck={false}
                        />
                        <div className="mt-4 h-32 bg-black rounded-xl border border-slate-800 p-3 font-mono text-xs overflow-y-auto">
                            <div className="text-slate-500 mb-1 flex items-center gap-2"><Terminal size={12}/> Console Output</div>
                            {consoleOutput.length === 0 && <span className="text-slate-700 italic">Ready to execute...</span>}
                            {consoleOutput.map((log, i) => <div key={i} className="text-green-400 whitespace-pre-wrap font-mono mb-1 border-b border-white/5 pb-1 last:border-0">&gt; {log}</div>)}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center items-center text-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <Dna className="w-10 h-10 text-primary-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Deep Deconstruction</h3>
                    <p className="text-slate-400 mb-8 max-w-md">
                        Our AI will extract the DNA of your code, identifying core fundamentals and creating a personalized curriculum to help you master and rewrite it.
                    </p>
                    <button 
                        onClick={handleDeepAnalyze}
                        disabled={!inputCode}
                        className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl flex items-center gap-3 disabled:opacity-50 shadow-xl shadow-primary-900/30 transition-all hover:scale-105"
                    >
                        <Sparkles className="w-5 h-5"/> Decipher Logic & Fundamentals
                    </button>
                </div>
            </div>
        </div>
      );
  }

  if (stage === 'ANALYZING') {
      return (
          <div className="h-[60vh] flex flex-col items-center justify-center">
              <Loader2 className="w-16 h-16 text-primary-500 animate-spin mb-6"/>
              <h2 className="text-2xl font-bold text-white mb-2">Extracting Logic DNA...</h2>
              <div className="text-slate-400 font-mono text-sm">Identifying Fundamentals • Building Roadmap • Generating Challenge</div>
=======
      }
  };

  const handleSubmit = async () => {
      if (!mission) return;
      setEvaluating(true);
      try {
          const res = await submitLabMission(mission, userCode);
          setFeedback(res);
          if (res.passed) {
              confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          }
          setStage('REVIEW');
      } catch (e) {
          console.error(e);
      } finally {
          setEvaluating(false);
      }
  };

  // --- RENDERERS ---

  if (stage === 'CLEARANCE') {
      return (
          <div className="max-w-5xl mx-auto p-8 min-h-screen flex flex-col justify-center">
              <button onClick={onBack} className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2"><ArrowLeft size={16}/> Exit Lab</button>
              
              <div className="text-center mb-12">
                  <div className="w-20 h-20 bg-slate-900 rounded-3xl border border-slate-800 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/10">
                      <Briefcase className="w-10 h-10 text-blue-400" />
                  </div>
                  <h1 className="text-5xl font-black text-white mb-4 tracking-tight">The Lab</h1>
                  <p className="text-slate-400 text-lg max-w-xl mx-auto">
                      Simulate real-world engineering tasks. Choose your stack, define your seniority, and get to work.
                  </p>
              </div>

              <div className="max-w-md mx-auto w-full mb-10">
                   <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Technology / Stack</label>
                   <input 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. React, Python, SQL, Rust..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-lg focus:border-blue-500 focus:outline-none placeholder:text-slate-600"
                   />
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                  {[
                      { l: 'Intern', icon: User, color: 'text-slate-400', border: 'border-slate-700', bg: 'bg-slate-900', desc: "Simple bug fixes & cleanup." },
                      { l: 'Junior', icon: Zap, color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-900/10', desc: "Feature implementation." },
                      { l: 'Senior', icon: Shield, color: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-900/10', desc: "Optimization & Architecture." },
                      { l: 'Staff', icon: Crown, color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-900/10', desc: "System Critical Crisis." }
                  ].map((item) => (
                      <motion.button 
                        key={item.l}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setRole(item.l as LabRole)}
                        className={`p-6 rounded-2xl border flex flex-col items-center text-center transition-all ${role === item.l ? 'ring-2 ring-white' : ''} ${item.bg} ${item.border} hover:bg-slate-800 hover:border-white/20`}
                      >
                          <div className={`w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center mb-4 border border-slate-800 shadow-lg`}>
                              <item.icon className={`w-6 h-6 ${item.color}`} />
                          </div>
                          <h3 className="text-lg font-bold text-white mb-1">{item.l}</h3>
                          <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                      </motion.button>
                  ))}
              </div>

              <div className="flex justify-center mt-12">
                  <button 
                      onClick={handleStartMission}
                      disabled={!topic || !role || generatingMission}
                      className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl flex items-center gap-3 disabled:opacity-50 shadow-xl shadow-blue-900/30 transition-all hover:scale-105"
                  >
                      {generatingMission ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>} 
                      {generatingMission ? "Generating Mission..." : "Enter Simulation"}
                  </button>
              </div>
>>>>>>> 2867a5c (Update wire connection visuals)
          </div>
      )
  }

<<<<<<< HEAD
  // --- CURRICULUM & LEARNING ---
  if (stage === 'CURRICULUM' && analysis && learningPath) {
      const allComplete = learningPath.nodes.every(n => n.status === 'completed');

      return (
          <div className="max-w-6xl mx-auto p-6 min-h-screen pb-20 relative">
               <button onClick={() => setStage('INPUT')} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2"><ArrowLeft size={16}/> New Code</button>
               
               {/* OVERLAY for Learning Content */}
               <AnimatePresence>
                   {isLearning && (
                       <motion.div initial={{y: '100%'}} animate={{y: 0}} exit={{y: '100%'}} className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
                           <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                               <div className="flex items-center gap-3">
                                   <button onClick={() => setIsLearning(false)} className="text-slate-400 hover:text-white"><ArrowLeft/></button>
                                   <span className="font-bold text-white">Learning: {getActiveNodeLabel()}</span>
                               </div>
                               <div className="text-xs text-slate-500 font-mono">Context: {analysis.fundamentals.join(', ')}</div>
                           </div>
                           <div className="flex-1 overflow-y-auto">
                               <ContentPlayer 
                                   concept={getActiveNodeLabel()}
                                   context={`Teaching how to code: ${inputCode.substring(0, 100)}...`}
                                   previousDomain={null}
                                   onComplete={handleLessonComplete}
                                   onPractice={() => {}} // Could link to practice mode
                               />
                           </div>
                       </motion.div>
                   )}
               </AnimatePresence>

               <div className="text-center pt-10 mb-10">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 mb-4">
                       <Dna size={12} className="text-primary-400"/> Code DNA Extracted
                   </div>
                   <h1 className="text-4xl font-bold text-white mb-6">Mastering the Logic</h1>
                   <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                       {analysis.fundamentals.map((f, i) => (
                           <span key={i} className="px-3 py-1.5 bg-primary-900/30 text-primary-300 border border-primary-500/30 rounded-lg text-sm font-medium">
                               {f}
                           </span>
                       ))}
                   </div>
               </div>

               <LearningPathGraph 
                   data={learningPath}
                   currentNodeId={activeNodeId || ''}
                   onSelectNode={handleStartLesson}
                   onPractice={() => {}} 
                   onSimulate={() => {}}
                   onSelectTopic={() => {}}
               />

               <div className="flex justify-center mt-12">
                   {allComplete ? (
                       <button onClick={handleStartTest} className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl shadow-lg shadow-green-900/40 hover:scale-105 transition-all flex items-center gap-2 animate-bounce">
                           <Unlock size={20}/> Unlock Code Mastery Test
                       </button>
                   ) : (
                       <div className="flex items-center gap-2 text-slate-500 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                           <Lock size={16}/> Complete all modules to unlock the Final Challenge
                       </div>
                   )}
               </div>
          </div>
      )
  }

  // --- TEST STAGE ---
  if (stage === 'TEST' || stage === 'COMPLETE') {
      return (
          <div className="max-w-4xl mx-auto p-6 pt-12 min-h-screen">
              <button onClick={() => setStage('CURRICULUM')} className="text-slate-400 hover:text-white mb-6 flex items-center gap-2"><ArrowLeft size={16}/> Back to Curriculum</button>
              
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                  {stage === 'COMPLETE' && (
                      <div className="absolute inset-0 bg-green-900/90 z-20 flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm animate-fade-in">
                          <CheckCircle2 className="w-24 h-24 text-green-400 mb-6"/>
                          <h2 className="text-4xl font-black text-white mb-4">Logic Mastered!</h2>
                          <p className="text-green-200 text-lg mb-8 max-w-lg">
                              You have successfully deconstructed, learned, and reconstructed the code logic. You truly own this knowledge now.
                          </p>
                          <button onClick={() => setStage('INPUT')} className="px-8 py-3 bg-white text-green-900 font-bold rounded-xl hover:scale-105 transition">
                              Analyze New Code
                          </button>
                      </div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <h2 className="text-2xl font-bold text-white mb-1">Final Challenge: Reconstruction</h2>
                          <p className="text-slate-400">Rewrite the functionality from scratch. Focus on logic.</p>
                      </div>
                      <div className="bg-slate-800 p-2 rounded-lg"><Zap className="text-yellow-400"/></div>
                  </div>

                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 mb-6">
                      <div className="text-xs font-bold text-primary-400 uppercase mb-2">Objective</div>
                      <p className="text-slate-200 leading-relaxed font-medium">"{analysis?.challengePrompt}"</p>
                  </div>

                  <div className="relative">
                      <div className="absolute top-0 right-0 p-2 bg-slate-900 rounded-bl-xl border-l border-b border-slate-800 z-10 text-xs font-mono text-slate-500">JS / TS</div>
                      <textarea 
                          value={reconstructionCode}
                          onChange={(e) => setReconstructionCode(e.target.value)}
                          className="w-full h-80 bg-slate-950 font-mono text-sm text-blue-300 p-6 rounded-xl border border-slate-700 focus:outline-none focus:border-primary-500 resize-none leading-relaxed"
                          placeholder="// Type your solution here..."
                          spellCheck={false}
                      />
                  </div>

                  {testResult && !testResult.isCorrect && (
                      <div className="mt-6 bg-red-900/20 border border-red-500/30 p-4 rounded-xl">
                          <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2"><XCircle size={16}/> Needs Improvement</h4>
                          <p className="text-red-200 text-sm mb-3">"{testResult.feedback}"</p>
                          {testResult.missingConcepts.length > 0 && (
                              <div className="text-xs text-red-300">
                                  <strong>Missing Concepts:</strong> {testResult.missingConcepts.join(', ')}
                              </div>
                          )}
                      </div>
                  )}

                  <div className="mt-8 flex justify-end">
                      <button 
                          onClick={handleSubmitTest}
                          disabled={evaluating || !reconstructionCode.trim()}
                          className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-900/30 flex items-center gap-2 disabled:opacity-50 transition-all"
                      >
                          {evaluating ? <Loader2 className="animate-spin"/> : <BookOpen size={20}/>} Submit Solution
                      </button>
                  </div>
=======
  if (stage === 'BRIEF' && mission) {
      return (
          <div className="max-w-4xl mx-auto p-8 h-screen flex flex-col justify-center">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-5"><Building2 className="w-64 h-64 text-blue-500"/></div>
                   <div className="relative z-10">
                       <div className="flex justify-between items-start mb-6">
                           <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg flex items-center gap-2">
                               <Building2 size={16} className="text-slate-400"/>
                               <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{mission.companyContext.split(' ')[0]} Corp</span>
                           </div>
                           <div className="text-blue-400 font-bold">{mission.role} Engineer</div>
                       </div>
                       
                       <h1 className="text-3xl font-black text-white mb-4">{mission.title}</h1>
                       
                       <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 mb-8">
                           <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Context</h3>
                           <p className="text-slate-300 leading-relaxed italic">"{mission.companyContext}"</p>
                       </div>

                       <div className="mb-8">
                           <h3 className="text-lg font-bold text-white mb-3">Your Assignment</h3>
                           <p className="text-slate-300 text-lg leading-relaxed">{mission.taskDescription}</p>
                       </div>

                       <div className="space-y-3 mb-10">
                           {mission.objectives.map((obj, i) => (
                               <div key={i} className="flex items-center gap-3 text-slate-300">
                                   <div className="w-5 h-5 rounded-full border border-blue-500/50 bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-400">{i+1}</div>
                                   <span>{obj}</span>
                               </div>
                           ))}
                       </div>

                       <button onClick={() => setStage('WORKSPACE')} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all">
                           Accept Mission <ArrowRight/>
                       </button>
                   </div>
              </div>
          </div>
      )
  }

  if (stage === 'WORKSPACE' && mission) {
      return (
          <div className="h-screen flex flex-col bg-slate-950">
               {/* Header */}
               <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900">
                   <div className="flex items-center gap-4">
                       <button onClick={() => setStage('BRIEF')} className="text-slate-400 hover:text-white"><ArrowLeft size={18}/></button>
                       <span className="font-bold text-slate-200">{mission.title}</span>
                   </div>
                   <div className="flex items-center gap-3">
                       <button onClick={runCode} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 border border-slate-700">
                           <Play size={12}/> Run Code
                       </button>
                       <button onClick={handleSubmit} disabled={evaluating} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-green-900/20 disabled:opacity-50">
                           {evaluating ? <Loader2 size={12} className="animate-spin"/> : <CheckCircle2 size={12}/>} Submit PR
                       </button>
                   </div>
               </div>

               <div className="flex-1 flex overflow-hidden">
                   {/* Editor */}
                   <div className="flex-1 flex flex-col border-r border-slate-800 relative">
                       <div className="absolute top-0 right-0 p-2 z-10">
                           <button onClick={() => setUserCode(mission.boilerplateCode)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white" title="Reset Code"><Trash2 size={16}/></button>
                       </div>
                       <textarea 
                           value={userCode}
                           onChange={(e) => setUserCode(e.target.value)}
                           className="flex-1 bg-slate-950 p-6 font-mono text-sm text-blue-100 focus:outline-none resize-none leading-relaxed"
                           spellCheck={false}
                       />
                   </div>

                   {/* Sidebar (Console & AI) */}
                   <div className="w-96 bg-slate-900 flex flex-col">
                       <div className="flex-1 p-4 overflow-y-auto border-b border-slate-800">
                           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-4">
                               <Terminal size={12}/> Console Output
                           </div>
                           <div className="font-mono text-xs space-y-1">
                               {consoleOutput.length === 0 && <span className="text-slate-600 italic">No output yet...</span>}
                               {consoleOutput.map((log, i) => (
                                   <div key={i} className="text-green-400 border-b border-white/5 pb-1">{log}</div>
                               ))}
                           </div>
                       </div>
                       <div className="h-1/2 p-4 bg-slate-950">
                           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-4">
                               <Shield size={12}/> Mission Objectives
                           </div>
                           <ul className="space-y-3">
                               {mission.objectives.map((obj, i) => (
                                   <li key={i} className="text-sm text-slate-300 flex gap-2">
                                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"/>
                                       {obj}
                                   </li>
                               ))}
                           </ul>
                       </div>
                   </div>
               </div>
          </div>
      )
  }

  if (stage === 'REVIEW' && feedback) {
      return (
          <div className="max-w-4xl mx-auto p-8 min-h-screen flex flex-col justify-center">
              <div className={`border rounded-3xl p-10 shadow-2xl ${feedback.passed ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                   <div className="flex items-center gap-4 mb-8">
                       <div className={`w-16 h-16 rounded-full flex items-center justify-center ${feedback.passed ? 'bg-green-500 text-slate-900' : 'bg-red-500 text-white'}`}>
                           {feedback.passed ? <CheckCircle2 size={32}/> : <AlertCircle size={32}/>}
                       </div>
                       <div>
                           <h2 className="text-3xl font-black text-white">{feedback.passed ? "PR Approved" : "PR Rejected"}</h2>
                           <div className={`text-lg font-bold ${feedback.passed ? 'text-green-400' : 'text-red-400'}`}>Score: {feedback.score}/100</div>
                       </div>
                   </div>

                   <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 mb-8">
                       <div className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><User size={12}/> Senior Dev Comments</div>
                       <div className="prose prose-invert prose-sm max-w-none">
                           <p className="whitespace-pre-wrap leading-relaxed text-slate-300">{feedback.codeReview}</p>
                       </div>
                   </div>
                   
                   {!feedback.passed && (
                       <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 mb-8">
                            <div className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Code size={12}/> Recommended Implementation</div>
                            <pre className="text-xs text-blue-200 bg-slate-950 p-4 rounded-lg overflow-x-auto">
                                {feedback.optimizedCode}
                            </pre>
                       </div>
                   )}

                   <div className="flex gap-4">
                       <button onClick={() => setStage('WORKSPACE')} className="flex-1 py-4 border border-slate-700 rounded-xl text-slate-300 hover:text-white font-bold">Keep working on this</button>
                       <button onClick={() => setStage('CLEARANCE')} className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20">New Mission</button>
                   </div>
>>>>>>> 2867a5c (Update wire connection visuals)
              </div>
          </div>
      )
  }

  return null;
};

<<<<<<< HEAD
export default CodeAnalogy;
=======
export default LabSimulation;
>>>>>>> 2867a5c (Update wire connection visuals)
