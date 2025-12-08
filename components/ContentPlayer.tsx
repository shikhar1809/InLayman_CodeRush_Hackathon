import React, { useState, useEffect, useRef } from 'react';
import { generateAnalogyContent, evaluateExplanation, generateAnalogyImage } from '../services/gemini';
import { libraryService } from '../services/libraryService';
import { AnalogyContent, ComplexityLevel } from '../types';
import { BookOpen, ArrowRight, MessageSquare, HelpCircle, CheckCircle2, RefreshCw, ThumbsUp, ThumbsDown, Share2, ImageIcon, Mic, Loader2, RotateCcw, Award, Send, Lightbulb, Brain, Zap, Sliders, Network, Split, Briefcase, GraduationCap } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';
import LiveTutor from './LiveTutor';
import confetti from 'canvas-confetti';

const motion = motionBase as any;

interface Props {
  concept: string;
  context: string;
  previousDomain?: string | null;
  onComplete: (domain: string) => void;
  onPractice: () => void;
}

const loadingQuotes = [
    "Did you know? Analogies increase retention by up to 20x compared to standard rote memorization.",
    "Your brain creates stronger neural connections when linking new concepts to things you already know.",
    "Short, focused learning sessions are proven to be 50% more effective than hour-long lectures.",
    "InLayman uses 'Elaborative Rehearsal' to lock knowledge into your long-term memory.",
    "Albert Einstein once said, 'If you can't explain it simply, you don't understand it well enough.'"
];

const ContentPlayer: React.FC<Props> = ({ concept, context, previousDomain, onComplete, onPractice }) => {
  const [content, setContent] = useState<AnalogyContent | null>(null);
  const [analogyImage, setAnalogyImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingImage, setLoadingImage] = useState(false);
  const [remixing, setRemixing] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ score: number; feedback: string; isMastered: boolean } | null>(null);
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [complexity, setComplexity] = useState<ComplexityLevel>('5yo');
  const [compareMode, setCompareMode] = useState(false);
  const [altContent, setAltContent] = useState<AnalogyContent | null>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
      if ('webkitSpeechRecognition' in window) {
          const SpeechRecognition = (window as any).webkitSpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript;
              setExplanation(prev => prev + " " + transcript);
              setIsListening(false);
          };
          recognitionRef.current.onerror = () => setIsListening(false);
          recognitionRef.current.onend = () => setIsListening(false);
      }
  }, []);

  useEffect(() => {
      if (loading) {
          const interval = setInterval(() => {
              setQuoteIndex(prev => (prev + 1) % loadingQuotes.length);
          }, 3000);
          return () => clearInterval(interval);
      }
  }, [loading]);

  const toggleListening = () => {
      if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
      } else {
          recognitionRef.current?.start();
          setIsListening(true);
      }
  };

  const loadContent = async (variation: boolean = false, isCompare: boolean = false) => {
      if (variation && !isCompare) setRemixing(true);
      else if (!isCompare) setLoading(true);
      
      const prefs = libraryService.getPreferences();
      const data = await generateAnalogyContent(
          concept, context, variation || isCompare, 
          prefs.dislikedDomains, prefs.likedDomains, 
          complexity, 
          previousDomain
      );
      
      if (isCompare) {
          setAltContent(data);
      } else {
          setContent(data);
          setAnalogyImage(null);
          setVoted(null);
          setLoading(false);
          setRemixing(false);
          
          if (data) {
              setLoadingImage(true);
              const img = await generateAnalogyImage(data.concept, data.analogyTitle, data.analogyContent);
              setAnalogyImage(img);
              setLoadingImage(false);
          }
      }
  };

  useEffect(() => { loadContent(false); }, [concept, complexity]);

  useEffect(() => {
      if (compareMode && !altContent) {
          loadContent(true, true);
      }
  }, [compareMode]);

  const handleVote = (type: 'up' | 'down') => {
      if (!content || voted) return;
      setVoted(type);
      if (type === 'up') {
          libraryService.likeDomain(content.domain);
          libraryService.saveAnalogy(content);
      } else {
          libraryService.dislikeDomain(content.domain);
          setTimeout(() => loadContent(true), 1000); 
      }
  };

  const handleShare = () => {
      if (content) {
          libraryService.shareToCommunity(concept, content.analogyTitle, content.analogyContent, "Guest User");
          alert("Shared to Community!");
      }
  }

  const handleSubmitExplanation = async () => {
    if (!explanation.trim() || !content) return;
    setEvaluating(true);
    const result = await evaluateExplanation(concept, content.microTestQuestion, explanation);
    setFeedback(result);
    setEvaluating(false);

    if (result.isMastered) {
        const duration = 3000;
        const end = Date.now() + duration;
        (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#06b6d4', '#ffffff'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#06b6d4', '#ffffff'] });
        if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }
  };

  const completeStep = () => {
      if (content) onComplete(content.domain);
  }

  const encodeBase64 = (str: string) => {
      try { return btoa(unescape(encodeURIComponent(str))); } catch (e) { return ""; }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] gap-8 p-6 text-center">
        <div className="relative">
            <div className="absolute inset-0 bg-primary-500 blur-3xl opacity-20 animate-pulse rounded-full"></div>
            <div className="relative z-10 grid grid-cols-3 gap-4 opacity-80">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="p-4 bg-slate-900 border border-slate-700 rounded-2xl">
                    <Brain className="w-8 h-8 text-primary-400" />
                </motion.div>
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, delay: 0.3, repeat: Infinity }} className="p-4 bg-slate-900 border border-slate-700 rounded-2xl mt-8">
                    <Zap className="w-8 h-8 text-yellow-400" />
                </motion.div>
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, delay: 0.6, repeat: Infinity }} className="p-4 bg-slate-900 border border-slate-700 rounded-2xl">
                    <Lightbulb className="w-8 h-8 text-green-400" />
                </motion.div>
            </div>
        </div>
        <div className="max-w-md space-y-4">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
            <h3 className="text-xl font-bold text-white">Constructing Analogy...</h3>
            <AnimatePresence mode="wait">
                <motion.p key={quoteIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-slate-400 italic font-medium leading-relaxed">"{loadingQuotes[quoteIndex]}"</motion.p>
            </AnimatePresence>
        </div>
      </div>
    );
  }

  if (!content) return <div className="p-8 text-center text-red-400">Failed to load content.</div>;
  const mapping = Array.isArray(content.analogyMapping) ? content.analogyMapping : [];
  const takeaways = Array.isArray(content.keyTakeaways) ? content.keyTakeaways : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 h-full pb-6 overflow-hidden">
      {/* Left Panel: Content */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 flex flex-col h-full overflow-hidden order-2 lg:order-1 relative">
        <div className="p-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-start">
          <div className="max-w-[70%]">
             <div className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                 <BookOpen className="w-3 h-3"/> Topic Analysis
             </div>
             <h2 className="text-3xl font-black text-slate-100 leading-none tracking-tight">{content.concept}</h2>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setCompareMode(!compareMode)} className={`p-2 rounded-xl transition-all border ${compareMode ? 'bg-primary-600 text-white border-primary-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`} title="Compare Analogies">
                 <Split className="w-5 h-5" />
             </button>
             <button onClick={() => loadContent(true)} disabled={remixing} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700" title="Remix">
                 {remixing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
             </button>
             <div className="w-px h-10 bg-slate-800 mx-1"></div>
             <button onClick={() => handleVote('up')} className={`p-2 rounded-xl ${voted === 'up' ? 'text-green-400 bg-green-500/10' : 'text-slate-500 hover:text-slate-300'}`}><ThumbsUp className="w-5 h-5" /></button>
             <button onClick={() => handleVote('down')} className={`p-2 rounded-xl ${voted === 'down' ? 'text-red-400 bg-red-500/10' : 'text-slate-500 hover:text-slate-300'}`}><ThumbsDown className="w-5 h-5" /></button>
          </div>
        </div>
        
        {/* Complexity Slider */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-slate-800/90 backdrop-blur-md rounded-full px-4 py-2 border border-slate-700 shadow-xl flex items-center gap-4 hover:scale-105 transition-transform">
             <span className="text-[10px] font-bold text-slate-400 uppercase">Level</span>
             <input type="range" min="0" max="3" step="1" value={['5yo', 'HighSchool', 'Undergrad', 'Professional'].indexOf(complexity)} onChange={(e) => setComplexity(['5yo', 'HighSchool', 'Undergrad', 'Professional'][parseInt(e.target.value)] as ComplexityLevel)} className="w-24 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-primary-400" />
             <span className="text-xs font-bold text-primary-400 uppercase w-16 text-right">{complexity === '5yo' ? '5 Year Old' : complexity}</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex bg-slate-950 pb-20">
            {/* Primary Content */}
            <div className={`p-8 space-y-8 flex-1 ${compareMode ? 'border-r border-slate-800' : ''} max-w-3xl mx-auto`}>
                <div className="relative">
                    <span className="absolute -left-6 top-0 text-6xl text-slate-800 font-serif leading-none opacity-50">“</span>
                    <h3 className="text-2xl font-bold text-white mb-2">{content.analogyTitle}</h3>
                    <p className="font-serif text-xl text-slate-300 leading-relaxed mb-6 pl-2 border-l-2 border-slate-800">
                        {content.analogyContent}
                    </p>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Domain: {content.domain}</span>
                    
                    {!compareMode && (
                        <div className="mt-6 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video flex items-center justify-center relative shadow-inner">
                            {analogyImage ? 
                                <img src={analogyImage} alt="Visual" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" /> : 
                                <div className="text-slate-600 flex flex-col items-center gap-2"><ImageIcon className="w-8 h-8" /><span className="text-xs uppercase tracking-widest">{loadingImage ? 'Rendering Visual...' : 'No Visual'}</span></div>
                            }
                        </div>
                    )}
                </div>
                
                {/* Real World Application Bridge */}
                {content.realWorldApplication && !compareMode && (
                    <div className="bg-indigo-900/20 p-6 rounded-2xl border border-indigo-500/20">
                        <h4 className="text-xs font-bold text-indigo-400 uppercase mb-3 flex items-center gap-2">
                            <Briefcase size={14} /> In The Real World
                        </h4>
                        <p className="text-slate-300 text-base leading-relaxed font-medium mb-4">
                            {content.realWorldApplication}
                        </p>
                        <button 
                            onClick={onPractice}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                        >
                            <GraduationCap size={16} /> Simulate Scenario
                        </button>
                    </div>
                )}
                
                {content.diagram && !compareMode && (
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><Network size={14}/> Logic Flow</h4>
                        <img src={`https://mermaid.ink/img/${encodeBase64(content.diagram)}?bgColor=0f172a&theme=dark`} alt="Diagram" className="w-full rounded-lg" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                )}

                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">The Breakdown</h3>
                    {mapping.map((item, i) => (
                        <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl hover:bg-slate-900/50 transition-colors border border-transparent hover:border-slate-800">
                            <div className="sm:w-1/3 text-primary-400 font-serif text-lg italic">{item.analogyTerm}</div>
                            <div className="hidden sm:flex flex-col justify-center items-center">
                                <ArrowRight className="w-4 h-4 text-slate-700" />
                            </div>
                            <div className="sm:w-1/2">
                                <div className="text-white font-bold text-sm mb-1">{item.technicalTerm}</div>
                                <div className="text-slate-400 text-sm leading-relaxed">{item.explanation}</div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {!compareMode && (
                    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Key Takeaways</h4>
                        <ul className="space-y-3">
                            {takeaways.map((p, i) => (
                                <li key={i} className="flex items-start text-slate-300 text-sm leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 mr-3 shrink-0"></div>
                                    {p}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Compare Panel */}
            {compareMode && (
                <div className="flex-1 p-8 space-y-8 bg-slate-900/30">
                    {!altContent ? (
                        <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-slate-500"/></div>
                    ) : (
                        <>
                            <div className="relative">
                                <h3 className="text-2xl font-bold text-white mb-2">{altContent.analogyTitle}</h3>
                                <p className="font-serif text-xl text-slate-300 leading-relaxed mb-4 pl-2 border-l-2 border-purple-500">
                                    {altContent.analogyContent}
                                </p>
                            </div>
                            <button onClick={() => { setContent(altContent); setCompareMode(false); }} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-purple-900/20">Switch to This Analogy</button>
                        </>
                    )}
                </div>
            )}
        </div>
      </motion.div>

      {/* Right Panel: Interactive */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full bg-slate-950 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden relative order-1 lg:order-2">
        <div className="shrink-0 p-4 border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-2 text-primary-400 font-bold uppercase text-xs mb-1"><MessageSquare className="w-3 h-3" /> Interactive Studio</div>
              <h3 className="text-lg font-bold text-white">Learn & Verify</h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            <div className="shrink-0 p-4 border-b border-slate-900">
                 <LiveTutor contextTopic={concept} analogyContent={content} />
            </div>
            <div className="flex-1 p-6 bg-slate-900/30">
                <div className="mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-500 text-slate-900 font-bold flex items-center justify-center text-xs">2</div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Prove Your Mastery</h4>
                </div>
                <AnimatePresence mode="wait">
                {!feedback ? (
                    <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <HelpCircle className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-slate-200 font-medium text-sm leading-relaxed">{content.microTestQuestion}</p>
                                <p className="text-xs text-slate-500 mt-2 font-mono">Explain in 5 lines or less.</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Type or use voice to explain..." className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 resize-none text-sm leading-relaxed" />
                        <button onClick={toggleListening} className={`absolute bottom-3 right-3 p-2 rounded-full transition-all shadow-lg ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}><Mic className="w-4 h-4" /></button>
                    </div>
                    <button onClick={handleSubmitExplanation} disabled={!explanation.trim() || evaluating} className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-900/20">{evaluating ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />} Submit Explanation</button>
                    </motion.div>
                ) : (
                    <motion.div key="feedback" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
                         <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${feedback.isMastered ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}><Award className="w-8 h-8" /></div>
                         <div className="text-4xl font-black text-white mb-2">{feedback.score}%</div>
                         <p className="text-slate-300 text-sm mb-6 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-800">"{feedback.feedback}"</p>
                         <div className="flex gap-3">
                            <button onClick={() => setFeedback(null)} className="flex-1 py-2.5 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-800 text-sm font-bold flex justify-center gap-2 items-center"><RotateCcw size={14}/> Try Again</button>
                            {feedback.isMastered && <button onClick={completeStep} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-500 text-sm font-bold flex justify-center gap-2 items-center shadow-lg shadow-green-900/20">Next Topic <ArrowRight size={14}/></button>}
                         </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ContentPlayer;