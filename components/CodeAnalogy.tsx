import React, { useState } from 'react';
import { analyzeCodeDeep, evaluateCodeReconstruction } from '../services/gemini';
import { CodeDeepAnalysis, LearningPath, CodeReconstructionResult } from '../types';
import { Code, ArrowRight, Loader2, Sparkles, Play, Terminal, Trash2, Dna, ArrowLeft, CheckCircle2, Lock, Unlock, Zap, BookOpen, XCircle } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';
import LearningPathGraph from './LearningPathGraph';
import ContentPlayer from './ContentPlayer';
import confetti from 'canvas-confetti';

const motion = motionBase as any;

interface Props {
  onBack: () => void;
}

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
  };

  const runCode = () => {
      setConsoleOutput([]);
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
          
          setConsoleOutput(logs.length > 0 ? logs : ["Code executed successfully (No Output)"]);
      } catch (e: any) {
          setConsoleOutput([`Runtime Error: ${e.message}`]);
      } finally {
          console.log = originalLog;
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
          </div>
      )
  }

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
              </div>
          </div>
      )
  }

  return null;
};

export default CodeAnalogy;