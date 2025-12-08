<<<<<<< HEAD


import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, BookOpen, ArrowRight, CheckCircle2, UploadCloud, Lightbulb, Code, Target, BrainCircuit, Flame, AlertTriangle, Loader2, FileText, Image as ImageIcon, Youtube, XCircle, Brain, RefreshCw } from 'lucide-react';
=======
import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, BookOpen, ArrowRight, CheckCircle2, UploadCloud, Lightbulb, Code, Target, BrainCircuit, Flame, AlertTriangle, Loader2, FileText, Image as ImageIcon, Youtube, XCircle, RefreshCw, Beaker, Brain } from 'lucide-react';
>>>>>>> 2867a5c (Update wire connection visuals)
import { motion as motionBase, AnimatePresence } from 'framer-motion';
import ChaosReductionBackground from './ChaosReductionBackground';
import { classifyIntent, analyzeImageInput } from '../services/gemini';
import { authService } from '../services/authService';
import { knowledgeGraphService } from '../services/knowledgeGraphService';
import * as d3Base from 'd3';
import GoalWidget from './GoalWidget';
import { DayPlan } from '../types';

const d3 = d3Base as any;
const motion = motionBase as any;

interface TopicSearchProps {
  onSearch: (topic: string) => void;
  onFileAnalyze: (fileBase64: string, mimeType: string) => void;
  onVoiceStart: () => void;
  onTestStart: (topic: string) => void;
<<<<<<< HEAD
  onOpenCommunity: () => void;
=======
>>>>>>> 2867a5c (Update wire connection visuals)
  onPracticeStart: (topic: string) => void;
  onScenarioStart: (topic: string) => void;
  onCodeStart: () => void;
  onOpenGraph: () => void;
  onVideoStart: (url: string) => void;
  onOpenNotebook: () => void;
  lastActiveTopic?: string | null;
  onGoalTaskStart?: (task: DayPlan) => void;
  isAnalyzingDocument?: boolean; 
}

<<<<<<< HEAD
type SearchMode = 'LEARN' | 'TEST' | 'PRACTICE' | 'APPLY' | 'CODE';

const TopicSearch: React.FC<TopicSearchProps> = ({ onSearch, onFileAnalyze, onVoiceStart, onTestStart, onOpenCommunity, onPracticeStart, onScenarioStart, onCodeStart, onOpenGraph, onVideoStart, onOpenNotebook, lastActiveTopic, onGoalTaskStart, isAnalyzingDocument = false }) => {
=======
type SearchMode = 'LEARN' | 'PRACTICE' | 'APPLY' | 'TEST' | 'CODE';

const TopicSearch: React.FC<TopicSearchProps> = ({ onSearch, onFileAnalyze, onVoiceStart, onTestStart, onPracticeStart, onScenarioStart, onCodeStart, onOpenGraph, onVideoStart, onOpenNotebook, lastActiveTopic, onGoalTaskStart, isAnalyzingDocument = false }) => {
>>>>>>> 2867a5c (Update wire connection visuals)
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<SearchMode>('LEARN');
  const [detectedIntent, setDetectedIntent] = useState<string | null>(null);
  const [isInvalidIntent, setIsInvalidIntent] = useState(false);
  const [shake, setShake] = useState(false); 
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isValidating, setIsValidating] = useState(false); 
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [user, setUser] = useState(authService.getCurrentUser());
  const [autoSwitchMessage, setAutoSwitchMessage] = useState<string | null>(null);
  const graphRef = useRef<SVGSVGElement>(null);
  
  const [progressStep, setProgressStep] = useState(0);
  const steps = ["Reading Document...", "Deconstructing Logic...", "Generating Analogies...", "Identifying Concepts...", "Finalizing Notebook..."];

  useEffect(() => {
      if (isAnalyzingDocument) {
          setProgressStep(0);
          const interval = setInterval(() => {
              setProgressStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
          }, 3500); 
          return () => clearInterval(interval);
      }
  }, [isAnalyzingDocument]);

  useEffect(() => {
      let isCancelled = false;
      const checkIntent = async () => {
          setIsInvalidIntent(false);
          setSuggestion(null);
          setRejectionReason(null);
          setDetectedIntent(null);
          setAutoSwitchMessage(null);
          
          if (input.length < 3) return;
          const result = await classifyIntent(input);
          if (isCancelled) return;
          
          const intent = result.type;
          
          if (result.correctedTopic && result.correctedTopic.toLowerCase() !== input.toLowerCase()) {
              setSuggestion(result.correctedTopic);
          }

          // INTELLIGENT MODE SWITCHING LOGIC
<<<<<<< HEAD
          if (intent === 'CODE' && mode !== 'CODE') {
               setMode('CODE');
               setAutoSwitchMessage("Switching to Code Mode");
          } else if (intent === 'TEST' && mode !== 'TEST') {
               setMode('TEST');
               setAutoSwitchMessage("Switching to Quiz Mode");
=======
          if (intent === 'CODE') {
               setDetectedIntent('Code Analysis');
               setAutoSwitchMessage("Code Detected - Ready to Run");
>>>>>>> 2867a5c (Update wire connection visuals)
          } else if (intent === 'PRACTICE' && mode !== 'PRACTICE') {
               setMode('PRACTICE');
               setAutoSwitchMessage("Switching to Practice Mode");
          } else if ((intent === 'APPLY' || intent === 'SCENARIO') && mode !== 'APPLY') {
               setMode('APPLY');
               setAutoSwitchMessage("Switching to Simulation Mode");
          } else if (intent === 'VIDEO') {
              setDetectedIntent('Video Link');
          } else if (intent === 'INVALID') { 
              setDetectedIntent('Invalid Query'); 
              setIsInvalidIntent(true); 
              setRejectionReason(result.reason || "We don't teach about specific private individuals or non-educational topics.");
              setShake(true); 
              setTimeout(() => setShake(false), 500);
          } else {
              setDetectedIntent(null); // Clear if back to normal learn intent
          }
      };
      const timer = setTimeout(checkIntent, 700); 
      return () => { isCancelled = true; clearTimeout(timer); };
  }, [input]);

  useEffect(() => {
      const data = knowledgeGraphService.getGraph();
      if (!graphRef.current || data.nodes.length === 0) return;
      const width = 120;
      const height = 120;
      d3.select(graphRef.current).selectAll("*").remove();
      const svg = d3.select(graphRef.current).attr("viewBox", [0, 0, width, height]).attr("width", width).attr("height", height);
      const simulation = d3.forceSimulation(data.nodes as any).force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(30)).force("charge", d3.forceManyBody().strength(-20)).force("center", d3.forceCenter(width / 2, height / 2));
      const link = svg.append("g").selectAll("line").data(data.links).join("line").attr("stroke", "#475569").attr("stroke-width", 1);
      const node = svg.append("g").selectAll("circle").data(data.nodes).join("circle").attr("r", 3).attr("fill", "#06b6d4");
      simulation.on("tick", () => {
          link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y).attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
          node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
      });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isValidating) return;
    if (isInvalidIntent) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return; 
    }
    setIsValidating(true);
    try {
        const validation = await classifyIntent(input);
        if (validation.type === 'INVALID') {
            setIsInvalidIntent(true);
            setDetectedIntent('Invalid Query');
            setRejectionReason(validation.reason || "This topic is not suitable for our learning engine.");
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setIsValidating(false);
            return;
        }
        
        // Final Intent Override check on submission
        let submitMode = mode;
        if (validation.type === 'CODE') submitMode = 'CODE';
        if (validation.type === 'TEST') submitMode = 'TEST';
        if (validation.type === 'PRACTICE') submitMode = 'PRACTICE';
        if (validation.type === 'APPLY' || validation.type === 'SCENARIO') submitMode = 'APPLY';

        const finalQuery = validation.correctedTopic || input.trim();
        const finalIntent = validation.type;

        if (finalIntent === 'VIDEO') { onVideoStart(input.trim()); return; }
        
        if (submitMode === 'LEARN') onSearch(finalQuery);
        else if (submitMode === 'TEST') onTestStart(finalQuery);
        else if (submitMode === 'PRACTICE') onPracticeStart(finalQuery);
        else if (submitMode === 'APPLY') onScenarioStart(finalQuery);
        else if (submitMode === 'CODE') onCodeStart();
    } catch (error) {
        // Fallback
        if (mode === 'LEARN') onSearch(input.trim());
    } finally {
        setIsValidating(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) processFile(e.target.files[0]);
  }
  const processFile = (file: File) => {
      const allowedExtensions = ['.pdf', '.txt', '.md'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const isValidExt = allowedExtensions.includes(fileExt);
      if (!isValidExt) { alert(`Invalid file format.`); return; }
      const reader = new FileReader();
      reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          let finalMimeType = file.type;
          if (!finalMimeType) {
              if (fileExt === '.pdf') finalMimeType = 'application/pdf';
              if (fileExt === '.txt') finalMimeType = 'text/plain';
              if (fileExt === '.md') finalMimeType = 'text/plain';
          }
          onFileAnalyze(base64, finalMimeType); 
      };
      reader.readAsDataURL(file);
  }

  const handleImageSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
          setIsAnalyzingImage(true);
          const base64 = (reader.result as string).split(',')[1];
          const query = await analyzeImageInput(base64);
          if (query) { setInput(query); setIsFocused(true); } 
          else { alert("Could not extract topic from image."); }
          setIsAnalyzingImage(false);
      };
      reader.readAsDataURL(file);
  }

<<<<<<< HEAD
=======
  // --- NEON WIRE CALCULATIONS ---
  const getWirePath = () => {
      // Use brighter Teal-400 (#2dd4bf) for Practice to match the neon intensity of others
      const color = mode === 'LEARN' ? '#22d3ee' : mode === 'PRACTICE' ? '#2dd4bf' : '#3b82f6';
      
      const startX = mode === 'LEARN' ? 400 : mode === 'PRACTICE' ? 500 : 600;
      
      // Card Centers (Grid Cols 3)
      let targetX = 500;
      if (mode === 'LEARN') targetX = 167;
      else if (mode === 'PRACTICE') targetX = 500;
      else targetX = 833;

      const startY = 10;
      const endY = 130; 

      const cp1y = startY + 60;
      const cp2y = endY - 60;

      // Add a curve offset for the straight line (Practice) so it looks like a loose wire 
      // and isn't hidden behind the card center.
      // We'll curve it to the right slightly (+60px).
      const curveOffset = startX === targetX ? 60 : 0; 
      
      const cp1x = startX + curveOffset;
      const cp2x = targetX + curveOffset;

      const dPath = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${endY}`;

      return (
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 150" preserveAspectRatio="none">
             <defs>
                 <filter id="wire-glow" x="-50%" y="-50%" width="200%" height="200%">
                     <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                     <feMerge>
                         <feMergeNode in="coloredBlur"/>
                         <feMergeNode in="SourceGraphic"/>
                     </feMerge>
                 </filter>
             </defs>
             
             {/* Wire Shadow */}
             <path d={dPath} fill="none" stroke="#020617" strokeWidth="8" strokeLinecap="round" />
             
             {/* Main Wire */}
             <path d={dPath} fill="none" stroke="#334155" strokeWidth="4" strokeLinecap="round" />

             {/* Energy Pulse */}
             <path d={dPath} fill="none" stroke={color} strokeWidth="2" strokeDasharray="10 10" filter="url(#wire-glow)">
                <animate attributeName="stroke-dashoffset" from="100" to="0" dur="0.8s" repeatCount="indefinite" />
             </path>

             {/* Plug Head */}
             <g transform={`translate(${targetX}, ${endY})`}>
                 <rect x="-16" y="-24" width="32" height="24" rx="4" fill="#1e293b" stroke={color} strokeWidth="2" filter="url(#wire-glow)" />
                 <circle cx="0" cy="-12" r="4" fill={color}>
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
                 </circle>
                 {/* Pins */}
                 <rect x="-10" y="0" width="6" height="8" fill="#94a3b8" />
                 <rect x="4" y="0" width="6" height="8" fill="#94a3b8" />
             </g>
          </svg>
      );
  }

  // Helper for Card Styling
  const getCardStyle = (cardMode: SearchMode) => {
      const isActive = mode === cardMode;
      let baseStyle = "p-6 bg-slate-900 border rounded-2xl flex flex-col items-center justify-center gap-4 group transition-all relative overflow-hidden h-full z-20 ";
      
      if (isActive) {
          if (cardMode === 'LEARN') baseStyle += "border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)] bg-slate-900";
          else if (cardMode === 'PRACTICE') baseStyle += "border-teal-400 shadow-[0_0_30px_rgba(45,212,191,0.3)] bg-slate-900";
          else if (cardMode === 'APPLY') baseStyle += "border-blue-400 shadow-[0_0_30px_rgba(96,165,250,0.3)] bg-slate-900";
      } else {
          baseStyle += "border-slate-800 hover:border-slate-700 opacity-50 hover:opacity-80 scale-95";
      }
      return baseStyle;
  }

  const getSocketStyle = (cardMode: SearchMode) => {
      const isActive = mode === cardMode;
      return (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-3 bg-slate-800 rounded-b-lg border-b border-x border-slate-700 z-30 flex justify-center gap-2 pt-1">
             <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white shadow-[0_0_5px_#fff]' : 'bg-slate-950'}`}></div>
             <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white shadow-[0_0_5px_#fff]' : 'bg-slate-950'}`}></div>
          </div>
      );
  }

>>>>>>> 2867a5c (Update wire connection visuals)
  return (
    <div className="relative bg-slate-950 w-full selection:bg-primary-500/30 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
          <ChaosReductionBackground />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-slate-950/90"></div>
      </div>

      <div className="relative z-20 min-h-screen flex flex-col items-center w-full max-w-6xl px-4 md:px-6 text-center mx-auto py-12">
<<<<<<< HEAD
=======
        {/* Top Header Stats */}
>>>>>>> 2867a5c (Update wire connection visuals)
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 h-[140px]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg h-full">
                <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Pulse</span>
                    </div>
                    <div className="text-xl font-bold text-white">{user?.streak || 0} Day Streak</div>
                    <div className="text-xs text-slate-500">Keep it up! Review 1 topic today.</div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-slate-800 flex items-center justify-center bg-orange-500/10 text-orange-500">
                    <span className="font-bold">{user?.streak || 0}</span>
                </div>
            </motion.div>
            <div className="h-full">
                <GoalWidget onTaskStart={(task) => onGoalTaskStart && onGoalTaskStart(task)} />
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg cursor-pointer hover:border-purple-500/30 transition-colors h-full" onClick={onOpenGraph}>
                <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                        <BrainCircuit className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Brain</span>
                    </div>
                    <div className="text-xl font-bold text-white">{(knowledgeGraphService.getGraph().nodes || []).length} Concepts</div>
                    <div className="text-xs text-slate-500">Mapped & Connected</div>
                </div>
                <svg ref={graphRef} className="w-[80px] h-[60px] opacity-70"></svg>
            </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-6 inline-flex items-center px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-700/50 text-slate-300 text-xs font-semibold backdrop-blur-md shadow-lg">
            <Sparkles className="w-3 h-3 mr-2 text-primary-400" /> <span>AI-Powered Adaptive Learning Engine</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8 max-w-4xl leading-[1.1]">
            Complex Ideas.<br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-cyan-300 to-primary-500">Simply Understood.</span>
        </motion.h1>

<<<<<<< HEAD
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="w-full max-w-2xl space-y-6">
=======
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="w-full max-w-2xl space-y-6 relative mb-12">
            
            {/* Search / Upload Zone */}
>>>>>>> 2867a5c (Update wire connection visuals)
            <div className="relative z-30 min-h-[80px]" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <AnimatePresence mode="wait">
                    {isAnalyzingDocument ? (
                        <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative flex flex-col items-center justify-center p-6 rounded-2xl border border-primary-500/30 bg-slate-900/90 shadow-2xl h-[88px] overflow-hidden">
                            <div className="absolute inset-0 bg-primary-500/5"></div>
                            <div className="relative z-10 w-full flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700"><Brain className="w-5 h-5 text-primary-400 animate-pulse"/></div>
                                <div className="flex-1 text-left">
                                    <div className="flex justify-between items-center mb-1"><span className="text-sm font-bold text-white uppercase tracking-wider animate-pulse">{steps[progressStep] || "Processing..."}</span><span className="text-xs text-primary-400 font-mono">{(progressStep + 1) / steps.length * 100}%</span></div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(progressStep + 1) / steps.length * 100}%` }} transition={{ duration: 0.5 }} className="h-full bg-gradient-to-r from-primary-600 to-cyan-400"/></div>
                                </div>
                            </div>
                        </motion.div>
                    ) : isDragging ? (
                         <motion.div key="dropzone" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-primary-500 bg-primary-500/20 shadow-xl backdrop-blur-md cursor-pointer h-[88px]">
                             <div className="flex items-center gap-3 text-white font-bold text-lg"><UploadCloud className="w-8 h-8 text-primary-200 animate-bounce" /><span>Drop File to Simplify</span></div>
                         </motion.div>
                    ) : (
<<<<<<< HEAD
                        <motion.form key="search" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1, x: shake ? [0, -10, 10, -10, 10, 0] : 0 }} exit={{ opacity: 0, scale: 0.95 }} onSubmit={handleSubmit} className="relative group">
=======
                        <motion.form key="search" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1, x: shake ? [0, -10, 10, -10, 10, 0] : 0 }} exit={{ opacity: 0, scale: 0.95 }} onSubmit={handleSubmit} className="relative group z-30">
>>>>>>> 2867a5c (Update wire connection visuals)
                            <motion.div animate={{ boxShadow: isFocused ? "0 0 50px -10px rgba(6, 182, 212, 0.25)" : "0 0 0px 0px rgba(0,0,0,0)", borderColor: isInvalidIntent ? "rgba(239, 68, 68, 0.6)" : isFocused ? "rgba(6, 182, 212, 0.5)" : "rgba(30, 41, 59, 1)", scale: isFocused ? 1.02 : 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className={`relative flex items-center bg-slate-900/90 backdrop-blur-xl rounded-2xl border transition-colors duration-300 overflow-hidden ${isInvalidIntent ? 'border-red-500/50' : isFocused ? 'border-primary-500/50' : 'border-slate-800'}`}>
                                <div className={`absolute inset-0 bg-gradient-to-r pointer-events-none transition-opacity duration-500 ${isInvalidIntent ? 'from-red-500/20 via-orange-500/10' : 'from-primary-500/20 via-cyan-500/10 to-primary-500/5'} ${isFocused || isInvalidIntent ? 'opacity-100' : 'opacity-0'}`}></div>
                                <div className="pl-6 transition-colors duration-300 relative z-10">
                                    {isAnalyzingImage ? <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" /> : detectedIntent === 'Video Link' ? <Youtube className="w-6 h-6 text-red-500" /> : isInvalidIntent ? <AlertTriangle className="w-6 h-6 text-red-500 animate-bounce" /> : mode === 'LEARN' ? <Search className={`w-6 h-6 ${isFocused ? 'text-primary-400' : 'text-slate-500'}`} /> : mode === 'TEST' ? <CheckCircle2 className={`w-6 h-6 ${isFocused ? 'text-primary-400' : 'text-slate-500'}`} /> : mode === 'PRACTICE' ? <BookOpen className={`w-6 h-6 ${isFocused ? 'text-primary-400' : 'text-slate-500'}`} /> : mode === 'APPLY' ? <Target className={`w-6 h-6 ${isFocused ? 'text-primary-400' : 'text-slate-500'}`} /> : <Code className={`w-6 h-6 ${isFocused ? 'text-primary-400' : 'text-slate-500'}`} />}
                                </div>
                                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} placeholder={isAnalyzingImage ? "Analyzing image..." : isInvalidIntent ? "Please enter a valid learning topic..." : mode === 'LEARN' ? "What concept do you want to master?" : mode === 'TEST' ? "Enter a topic to start a quiz..." : mode === 'PRACTICE' ? "Learn by teaching..." : mode === 'APPLY' ? "Apply your knowledge in real-world scenarios..." : "Paste code or topic..."} className={`w-full p-5 bg-transparent text-lg placeholder:text-slate-400 focus:outline-none relative z-10 font-medium transition-colors ${isInvalidIntent ? 'text-red-200' : 'text-white'}`} />
                                <AnimatePresence>{detectedIntent && (<motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className={`absolute right-40 z-20 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${detectedIntent === 'Invalid Query' ? 'bg-red-500/20 border-red-500/30 text-red-300' : 'bg-primary-500/20 border-primary-500/30 text-primary-300'}`}>{detectedIntent === 'Invalid Query' ? <XCircle size={10} /> : <Sparkles size={10} />} {detectedIntent}</motion.div>)}</AnimatePresence>
                                <div className="pr-2 relative z-10 flex gap-2 items-center">
                                    <div className="relative"><input type="file" onChange={handleImageSearch} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-20" title="Search with Image" /><button type="button" className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all" ><ImageIcon className="w-5 h-5" /></button></div>
                                    <div className="relative"><input type="file" onChange={handleFileSelect} accept=".pdf,.txt,.md" className="absolute inset-0 opacity-0 cursor-pointer z-20" title="Upload Document for Simplification" /><button type="button" className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all" ><FileText className="w-5 h-5" /></button></div>
                                    <button type="submit" disabled={!input.trim() || isInvalidIntent || isValidating} className="p-3 bg-slate-800 text-white rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50 disabled:scale-95 shadow-lg w-12 flex items-center justify-center">{isValidating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}</button>
                                </div>
                            </motion.div>
                            
                            {/* Auto-Switch Notification */}
                            <AnimatePresence>
                                {autoSwitchMessage && (
                                    <motion.div initial={{opacity:0, y: -10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="absolute left-0 right-0 top-full mt-2 z-30 pointer-events-none">
                                        <div className="inline-flex items-center gap-2 bg-primary-900/90 border border-primary-500/30 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md">
                                            <RefreshCw className="w-3 h-3 text-primary-400 animate-spin" />
                                            <span className="text-xs text-white font-medium">{autoSwitchMessage}</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {suggestion && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute left-0 right-0 top-full mt-2 z-30"><div className="bg-slate-800/90 border border-primary-500/30 p-2 rounded-lg backdrop-blur-sm flex items-center justify-between shadow-lg cursor-pointer" onClick={() => { setInput(suggestion); handleSubmit({ preventDefault: () => {} } as any); }}><div className="flex items-center gap-2"><Lightbulb className="w-4 h-4 text-yellow-400" /><span className="text-sm text-white">Auto-redirecting to: <span className="font-bold text-primary-400">{suggestion}</span></span></div><ArrowRight className="w-4 h-4 text-slate-400" /></div></motion.div>)}
                            {isInvalidIntent && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute left-0 right-0 top-full mt-2 z-30"><div className="bg-red-900/90 border border-red-500/30 p-3 rounded-lg backdrop-blur-sm flex items-start gap-2 shadow-lg"><AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" /><div className="text-left"><div className="text-sm font-bold text-red-200">Rejection: Input Invalid</div><div className="text-xs text-red-300/80">{rejectionReason || "Please enter a valid educational topic. We respect privacy."}</div></div></div></motion.div>)}
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>
<<<<<<< HEAD
            <div className="flex justify-center relative z-20">
                 <div className="bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 flex gap-1 relative shadow-lg backdrop-blur-md">
                    <motion.div className="absolute top-1.5 bottom-1.5 bg-primary-600 rounded-lg shadow-md z-0" initial={false as any} animate={{ left: mode === 'LEARN' ? '6px' : mode === 'TEST' ? 'calc(20% + 4px)' : mode === 'PRACTICE' ? 'calc(40% + 2px)' : mode === 'APPLY' ? 'calc(60%)' : 'calc(80% - 2px)', width: 'calc(20% - 4px)' }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                    {['LEARN', 'TEST', 'PRACTICE', 'APPLY', 'CODE'].map((m) => (
                        <button key={m} onClick={() => setMode(m as SearchMode)} className={`px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all relative z-10 w-1/5 ${mode === m ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>{m}</button>
=======
            
            {/* TABS CONTAINER */}
            <div className="flex justify-center relative z-20">
                 <div className="bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 flex gap-1 relative shadow-lg backdrop-blur-md">
                    <motion.div className="absolute top-1.5 bottom-1.5 bg-primary-600 rounded-lg shadow-md z-0" initial={false as any} 
                    animate={{ 
                        left: mode === 'LEARN' ? '6px' : mode === 'PRACTICE' ? 'calc(33.33% + 4px)' : mode === 'APPLY' ? 'calc(66.66% + 2px)' : '6px', 
                        width: 'calc(33.33% - 6px)' 
                    }} 
                    transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                    {['LEARN', 'PRACTICE', 'APPLY'].map((m) => (
                        <button key={m} onClick={() => setMode(m as SearchMode)} className={`px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all relative z-10 w-1/3 ${mode === m ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>{m}</button>
>>>>>>> 2867a5c (Update wire connection visuals)
                    ))}
                 </div>
            </div>

<<<<<<< HEAD
            <div className="mt-8 relative z-20 max-w-5xl mx-auto w-full">
                 <div className="flex flex-col gap-6">
                     <div>
                         <h4 className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Creative Studio</h4>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={onVoiceStart} className="p-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-primary-500/50 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all">
                                 <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-primary-500/20 flex items-center justify-center transition-colors"><Sparkles className="w-5 h-5 text-slate-400 group-hover:text-primary-400" /></div>
                                 <span className="text-sm font-bold text-slate-300 group-hover:text-white">AI Tutor</span>
                             </motion.button>
                             <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => onOpenNotebook()} className="p-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-teal-500/50 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all">
                                 <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-teal-500/20 flex items-center justify-center transition-colors"><BookOpen className="w-5 h-5 text-slate-400 group-hover:text-teal-400" /></div>
                                 <span className="text-sm font-bold text-slate-300 group-hover:text-white">Smart Note</span>
                             </motion.button>
                             <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => onOpenCommunity()} className="p-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-purple-500/50 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all">
                                 <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-purple-500/20 flex items-center justify-center transition-colors"><Target className="w-5 h-5 text-slate-400 group-hover:text-purple-400" /></div>
                                 <span className="text-sm font-bold text-slate-300 group-hover:text-white">Community</span>
                             </motion.button>
                             <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => onCodeStart()} className="p-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all">
                                 <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors"><Code className="w-5 h-5 text-slate-400 group-hover:text-blue-400" /></div>
                                 <span className="text-sm font-bold text-slate-300 group-hover:text-white">Code DNA</span>
                             </motion.button>
                         </div>
=======
            {/* WIRE & CARDS CONTAINER */}
            <div className="relative w-full max-w-5xl mx-auto mt-4">
                 {/* 1. WIRE LAYER */}
                 <div className="absolute top-[-60px] left-0 right-0 h-[160px] z-10 pointer-events-none">
                     {getWirePath()}
                 </div>

                 {/* 2. CARDS LAYER */}
                 <div className="grid grid-cols-3 gap-6 pt-10">
                     {/* Card 1: LEARN -> AI Tutor */}
                     <div className="relative h-40">
                         {getSocketStyle('LEARN')}
                         <motion.button 
                            whileHover={{ scale: 1.02 }} 
                            whileTap={{ scale: 0.95 }} 
                            onClick={onVoiceStart} 
                            className={getCardStyle('LEARN')}
                         >
                             <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                 <Sparkles className={`w-6 h-6 ${mode === 'LEARN' ? 'text-cyan-400' : 'text-slate-400'}`} />
                             </div>
                             <div>
                                 <div className={`text-sm font-bold ${mode === 'LEARN' ? 'text-cyan-400' : 'text-slate-300'}`}>AI Tutor</div>
                                 <div className="text-[10px] text-slate-500 font-medium mt-1">Interactive Voice Mode</div>
                             </div>
                         </motion.button>
                     </div>

                     {/* Card 2: PRACTICE -> Smart Note */}
                     <div className="relative h-40">
                         {getSocketStyle('PRACTICE')}
                         <motion.button 
                            whileHover={{ scale: 1.02 }} 
                            whileTap={{ scale: 0.95 }} 
                            onClick={onOpenNotebook} 
                            className={getCardStyle('PRACTICE')}
                         >
                             <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                 <BookOpen className={`w-6 h-6 ${mode === 'PRACTICE' ? 'text-teal-400' : 'text-slate-400'}`} />
                             </div>
                             <div>
                                 <div className={`text-sm font-bold ${mode === 'PRACTICE' ? 'text-teal-400' : 'text-slate-300'}`}>Smart Note</div>
                                 <div className="text-[10px] text-slate-500 font-medium mt-1">Context-Aware Notebook</div>
                             </div>
                         </motion.button>
                     </div>

                     {/* Card 3: APPLY -> The Lab */}
                     <div className="relative h-40">
                         {getSocketStyle('APPLY')}
                         <motion.button 
                            whileHover={{ scale: 1.02 }} 
                            whileTap={{ scale: 0.95 }} 
                            onClick={onCodeStart} 
                            className={getCardStyle('APPLY')}
                         >
                             <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                 <Beaker className={`w-6 h-6 ${mode === 'APPLY' ? 'text-blue-400' : 'text-slate-400'}`} />
                             </div>
                             <div>
                                 <div className={`text-sm font-bold ${mode === 'APPLY' ? 'text-blue-400' : 'text-slate-300'}`}>The Lab</div>
                                 <div className="text-[10px] text-slate-500 font-medium mt-1">Simulate Real World</div>
                             </div>
                         </motion.button>
>>>>>>> 2867a5c (Update wire connection visuals)
                     </div>
                 </div>
            </div>

            <div className="mt-20 w-full max-w-5xl mx-auto border-t border-slate-800 pt-12">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">The InLayman Method</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[{ step: "01", title: "Input", desc: "Upload docs, images, or type any topic.", color: "text-blue-400" }, { step: "02", title: "Deconstruct", desc: "AI breaks it down into core concepts.", color: "text-purple-400" }, { step: "03", title: "Immerse", desc: "Learn via Analogies & Simulations.", color: "text-primary-400" }, { step: "04", title: "Master", desc: "Prove your knowledge to the AI Tutor.", color: "text-green-400" }].map((s, i) => (
                        <div key={i} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 relative overflow-hidden group hover:bg-slate-900 transition-colors">
                            <div className={`text-4xl font-black ${s.color} opacity-20 absolute top-2 right-4`}>{s.step}</div>
                            <div className="relative z-10 text-left">
                                <h4 className="text-white font-bold mb-2">{s.title}</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
      </div>

      <footer className="relative z-20 w-full bg-slate-950 border-t border-slate-900 py-8 mt-12">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800"><span className="font-bold text-white">IL</span></div>
                   <div className="text-left"><div className="text-sm font-bold text-white">InLayman</div><div className="text-[10px] text-slate-500">Adaptive Learning OS</div></div>
              </div>
              <div className="flex flex-col items-center md:items-end"><div className="text-xs text-slate-400">Created & Maintained By</div><div className="font-bold text-white text-sm">Shikhar Shahi</div></div>
          </div>
      </footer>
    </div>
  );
};

export default TopicSearch;