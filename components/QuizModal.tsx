
import React, { useState } from 'react';
import { QuizQuestion, DiagnosticResult, QuizInsight } from '../types';
import { generateQuizInsights } from '../services/geminiService';
import { CheckCircle2, XCircle, Loader2, BookOpen, AlertCircle, ArrowRight, Book, Stamp, Award, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';

interface QuizModalProps {
  title: string;
  context?: string;
  questions: QuizQuestion[] | DiagnosticResult['prerequisites'];
  onClose: () => void;
  onComplete: (failed: boolean, remedial?: string) => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ title, context = "General Knowledge", questions, onClose, onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // Open Question State
  const [openAnswerRevealed, setOpenAnswerRevealed] = useState(false);
  const [openSelfGrade, setOpenSelfGrade] = useState<'pass' | 'fail' | null>(null);

  const [history, setHistory] = useState<Array<{question: string, selected: string, correct: string, isCorrect: boolean}>>([]);
  
  // Insights State
  const [isFinished, setIsFinished] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightData, setInsightData] = useState<QuizInsight | null>(null);

  // Guard Clause for Empty Data
  if (!questions || questions.length === 0) return null;

  // Normalize structure between the two types of quizzes
  const currentQ = questions[currentIdx] as any;
  
  // Guard Clause for Malformed Question
  if (!currentQ) return null;

  const isDiagnostic = 'topic' in currentQ;
  const isMCQ = currentQ.type === 'MCQ' || !currentQ.type; // Default to MCQ if undefined

  const handleMCQAnswer = (idx: number) => {
    setSelectedOpt(idx);
    setShowResult(true);
    
    let isCorrect = false;
    let correctAnsText = "";
    let selectedText = currentQ.options[idx];

    if (isDiagnostic) {
        isCorrect = currentQ.options[idx] === currentQ.answer;
        correctAnsText = currentQ.answer;
    } else {
        isCorrect = idx === currentQ.correctIndex;
        correctAnsText = currentQ.options[currentQ.correctIndex];
    }

    const newEntry = {
        question: currentQ.question,
        selected: selectedText,
        correct: correctAnsText,
        isCorrect
    };

    setHistory([...history, newEntry]);
  };

  const handleOpenGrade = (grade: 'pass' | 'fail') => {
      setOpenSelfGrade(grade);
      const newEntry = {
          question: currentQ.question,
          selected: grade === 'pass' ? "Self-Reported: Understood" : "Self-Reported: Missed",
          correct: currentQ.answer || "Conceptual Understanding",
          isCorrect: grade === 'pass'
      };
      setHistory([...history, newEntry]);
  };

  const next = async () => {
    if (currentIdx < questions.length - 1) {
        setCurrentIdx(c => c + 1);
        setSelectedOpt(null);
        setShowResult(false);
        setOpenAnswerRevealed(false);
        setOpenSelfGrade(null);
    } else {
        finishQuiz();
    }
  };

  const finishQuiz = async () => {
      setIsFinished(true);
      const wrongAnswers = history.filter(h => !h.isCorrect);
      
      if (wrongAnswers.length === 0) {
          setInsightData({
              score_summary: "Perfect Score! You've mastered this topic.",
              weak_areas: [],
              next_steps: ["Advance to next topic", "Try a harder quiz"],
              remedial_note: "No remedial actions needed."
          });
          return;
      }

      // If mistakes, generate insights
      setLoadingInsights(true);
      try {
          const result = await generateQuizInsights(context, wrongAnswers);
          setInsightData(result);
      } catch (e) {
          console.error("Failed to generate insights", e);
      } finally {
          setLoadingInsights(false);
      }
  };

  const score = history.filter(h => h.isCorrect).length;
  const isPerfect = score === questions.length;

  const BOOK_COVER_COLOR = "bg-blue-900";
  const BOOK_BORDER_COLOR = "border-blue-950";
  const PAPER_LINES = { 
      backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px)', 
      backgroundSize: '100% 32px',
      backgroundPosition: '0 8px' 
  };

  // --- RENDERING RESULTS ---
  if (isFinished) {
      return (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className={`w-full max-w-lg rounded-r-lg shadow-2xl border-l-8 ${BOOK_BORDER_COLOR} overflow-hidden animate-pop-in flex flex-col max-h-[90vh] bg-white`}>
                {/* Grading Header */}
                <div className="p-6 border-b-2 border-double border-stone-300 flex items-center justify-between relative bg-[#fdfbf7]">
                     <div>
                        <h2 className="font-serif font-bold text-3xl text-stone-800 tracking-tight">Report Card</h2>
                        <p className="font-serif italic text-stone-500 text-xs mt-1 uppercase tracking-widest">Official Assessment</p>
                     </div>
                     
                     {/* Score Stamp */}
                     <div className={`text-4xl font-handwriting w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 ${isPerfect ? 'border-green-500 text-green-700 bg-green-50' : 'border-red-500 text-red-700 bg-red-50'} rotate-12 shadow-inner`}>
                         <span className="font-bold leading-none">{Math.round((score / questions.length) * 100)}%</span>
                         <span className="text-[10px] font-sans font-bold uppercase tracking-widest mt-1 opacity-70">{isPerfect ? 'PASS' : 'REVIEW'}</span>
                     </div>
                </div>

                <div className="p-8 overflow-y-auto bg-[#fdfbf7]" style={PAPER_LINES}>
                    {loadingInsights ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4 text-stone-400">
                             <Loader2 size={32} className="animate-spin text-stone-800" />
                             <p className="font-handwriting text-xl animate-pulse text-stone-600">The Professor is grading...</p>
                        </div>
                    ) : insightData ? (
                        <div className="space-y-8 animate-pop-in">
                            
                            {/* Summary Note */}
                            <div className="relative">
                                <div className="absolute -left-6 top-1 text-stone-300"><Stamp size={20} /></div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Instructor's Note</h3>
                                <p className="font-handwriting text-2xl text-stone-800 leading-normal">
                                    "{insightData.score_summary || "Quiz completed."}"
                                </p>
                            </div>

                            {/* Weak Areas */}
                            <div>
                                <h3 className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-widest mb-3 font-sans border-b border-red-100 pb-1">
                                    <AlertCircle size={14}/> Needs Improvement
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {(insightData.weak_areas && insightData.weak_areas.length > 0) ? (
                                        insightData.weak_areas.map((area, i) => (
                                            <span key={i} className="bg-red-50 text-red-900 px-3 py-1.5 rounded text-sm font-serif border border-red-100 shadow-sm">
                                                {area}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-sm text-stone-500 italic">No specific weak areas detected. Excellent work!</p>
                                    )}
                                </div>
                            </div>

                            {/* Next Steps / Plan */}
                            <div>
                                <h3 className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 font-sans border-b border-blue-100 pb-1">
                                    <ArrowRight size={14}/> Action Plan
                                </h3>
                                <ul className="space-y-3">
                                    {(insightData.next_steps && insightData.next_steps.length > 0) ? (
                                        insightData.next_steps.map((step, i) => (
                                            <li key={i} className="flex gap-3 text-lg font-handwriting text-stone-700 items-start">
                                                <div className="w-5 h-5 rounded-full border border-blue-200 text-blue-400 flex items-center justify-center text-[10px] mt-1 font-sans font-bold shrink-0">{i+1}</div>
                                                <span className="leading-tight">{step}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-sm text-stone-500 italic">No further actions required.</li>
                                    )}
                                </ul>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 flex flex-col gap-3">
                                {insightData.remedial_note && !isPerfect && (
                                    <button 
                                        onClick={() => onComplete(true, insightData.remedial_note)}
                                        className="w-full bg-stone-800 text-white p-4 rounded-xl shadow-lg hover:bg-stone-700 transition-all flex items-center justify-center gap-2 font-serif group"
                                    >
                                        <BookOpen size={18} className="group-hover:scale-110 transition-transform" />
                                        <span>Add Remedial Note to Notebook</span>
                                    </button>
                                )}
                                
                                <button onClick={onClose} className="w-full text-center text-xs text-stone-400 hover:text-stone-600 font-sans uppercase tracking-widest py-2">
                                    Dismiss Report
                                </button>
                            </div>
                        </div>
                    ) : (
                         <div className="text-center text-red-400 py-12 flex flex-col items-center">
                             <XCircle size={32} className="mb-2" />
                             <p>Grading data unavailable.</p>
                             <button onClick={onClose} className="mt-4 text-xs underline">Close</button>
                         </div>
                    )}
                </div>
            </div>
        </div>
      );
  }

  // --- RENDERING QUESTIONS ---
  return (
    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="flex w-full max-w-4xl h-[600px] shadow-2xl animate-pop-in">
          
          {/* Left Cover */}
          <div className={`hidden md:flex w-1/3 ${BOOK_COVER_COLOR} p-8 flex-col justify-between text-white border-l-4 border-blue-950 rounded-l-lg relative overflow-hidden`}>
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')] pointer-events-none"></div>
              
              <div className="z-10 text-center mt-12">
                  <Book size={48} className="mx-auto mb-4 opacity-80" />
                  <h1 className="font-serif font-bold text-3xl uppercase tracking-widest mb-2 border-b-2 border-white/20 pb-4">Examination</h1>
                  <h2 className="font-mono text-sm opacity-60 uppercase">Blue Book Vol. 1</h2>
              </div>

              <div className="z-10 space-y-4 font-serif text-sm opacity-80">
                  <div>
                      <p className="uppercase text-xs font-bold opacity-50">Subject</p>
                      <p className="text-lg">{title}</p>
                  </div>
              </div>
          </div>

          {/* Right Page */}
          <div className="flex-1 bg-[#fdfbf7] p-12 rounded-r-lg flex flex-col relative" style={PAPER_LINES}>
                <div className="flex justify-between items-center mb-8 border-b-2 border-red-300 pb-2">
                    <span className="font-handwriting text-2xl text-stone-500">Question {currentIdx + 1} of {questions.length}</span>
                    <button onClick={onClose} className="text-red-400 hover:text-red-600 font-bold font-sans text-xs uppercase">Walk Out</button>
                </div>

                <h4 className="font-serif text-2xl text-stone-800 mb-8 leading-relaxed">
                    {currentQ.question}
                </h4>

                <div className="space-y-4 flex-grow overflow-y-auto">
                    {isMCQ ? (
                        // --- MCQ RENDERING ---
                        (currentQ.options || []).map((opt: string, idx: number) => {
                            let stateClass = "border-stone-300 hover:border-stone-500 text-stone-600";
                            if (showResult) {
                                const isCorrect = isDiagnostic ? opt === currentQ.answer : idx === currentQ.correctIndex;
                                if (isCorrect) stateClass = "bg-green-100/80 border-green-600 text-green-900 shadow-sm";
                                else if (selectedOpt === idx) stateClass = "bg-red-100/80 border-red-600 text-red-900 line-through";
                                else stateClass = "opacity-40 border-stone-200";
                            } else if (selectedOpt === idx) {
                                stateClass = "bg-blue-50 border-blue-500 text-blue-900";
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => !showResult && handleMCQAnswer(idx)}
                                    className={`w-full text-left p-4 rounded font-handwriting text-xl transition-all flex justify-between items-center border-b-2 ${stateClass}`}
                                    style={{ transform: selectedOpt === idx && !showResult ? 'scale(1.02)' : 'none' }}
                                >
                                    <span>{String.fromCharCode(65 + idx)}. {opt}</span>
                                    {showResult && (isDiagnostic ? opt === currentQ.answer : idx === currentQ.correctIndex) && <CheckCircle2 size={24} className="text-green-700"/>}
                                    {showResult && selectedOpt === idx && !(isDiagnostic ? opt === currentQ.answer : idx === currentQ.correctIndex) && <XCircle size={24} className="text-red-700"/>}
                                </button>
                            )
                        })
                    ) : (
                        // --- OPEN ENDED RENDERING ---
                        <div className="flex flex-col gap-4">
                            <p className="text-stone-500 text-sm font-sans italic">Explain this concept in your own words, then compare with the answer.</p>
                            
                            {!openAnswerRevealed ? (
                                <button 
                                    onClick={() => setOpenAnswerRevealed(true)}
                                    className="h-32 bg-stone-100 border-2 border-dashed border-stone-300 rounded-lg flex flex-col items-center justify-center text-stone-400 hover:text-stone-600 hover:border-stone-400 transition-all gap-2 group"
                                >
                                    <Eye size={24} className="group-hover:scale-110 transition-transform"/>
                                    <span className="font-bold uppercase text-xs tracking-widest">Reveal Answer</span>
                                </button>
                            ) : (
                                <div className="space-y-4 animate-pop-in">
                                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                                        <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-2">Ideal Explanation</p>
                                        <p className="font-handwriting text-xl text-stone-800 leading-relaxed">{currentQ.answer}</p>
                                    </div>
                                    
                                    {!openSelfGrade && (
                                        <div className="flex gap-4 justify-center pt-4">
                                            <button 
                                                onClick={() => handleOpenGrade('pass')}
                                                className="flex-1 bg-white border border-stone-200 p-4 rounded-xl shadow-sm hover:bg-green-50 hover:border-green-200 flex flex-col items-center gap-2 transition-all group"
                                            >
                                                <ThumbsUp size={24} className="text-green-500 group-hover:scale-110 transition-transform" />
                                                <span className="text-xs font-bold text-stone-600 uppercase">I got it</span>
                                            </button>
                                            <button 
                                                onClick={() => handleOpenGrade('fail')}
                                                className="flex-1 bg-white border border-stone-200 p-4 rounded-xl shadow-sm hover:bg-red-50 hover:border-red-200 flex flex-col items-center gap-2 transition-all group"
                                            >
                                                <ThumbsDown size={24} className="text-red-500 group-hover:scale-110 transition-transform" />
                                                <span className="text-xs font-bold text-stone-600 uppercase">I missed it</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end h-16 items-end">
                    {(showResult || openSelfGrade) && (
                        <button 
                            onClick={next}
                            className="bg-stone-800 text-white px-8 py-3 rounded shadow-lg font-serif hover:bg-stone-700 transition-colors flex items-center gap-2"
                        >
                            <span>{currentIdx === questions.length - 1 ? 'Finish' : 'Turn Page'}</span>
                            <ArrowRight size={16} />
                        </button>
                    )}
                </div>

          </div>
      </div>
    </div>
  );
};

export default QuizModal;
