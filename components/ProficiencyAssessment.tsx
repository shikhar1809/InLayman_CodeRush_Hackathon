import React, { useState, useEffect } from 'react';
import { generateProficiencyTest } from '../services/gemini';
import { Question } from '../types';
import { CheckCircle2, XCircle, ArrowRight, Loader2, BrainCircuit, Sparkles } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

interface Props {
  topic: string;
  onComplete: (score: number) => void;
  isGenerating?: boolean;
}

const ProficiencyAssessment: React.FC<Props> = ({ topic, onComplete, isGenerating = false }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loadingText, setLoadingText] = useState("Analyzing Results...");

  // Loading text cycle for roadmap generation
  useEffect(() => {
    if (isGenerating) {
        const texts = [
            "Analyzing your answers...",
            "Identifying knowledge gaps...",
            "Mapping prerequisites...",
            "Personalizing analogies...",
            "Finalizing your curriculum..."
        ];
        let i = 0;
        const interval = setInterval(() => {
            setLoadingText(texts[i % texts.length]);
            i++;
        }, 1500);
        return () => clearInterval(interval);
    }
  }, [isGenerating]);

  useEffect(() => {
    let mounted = true;
    const fetchQuestions = async () => {
      const q = await generateProficiencyTest(topic);
      if (mounted) {
        setQuestions(q);
        setLoading(false);
      }
    };
    fetchQuestions();
    return () => { mounted = false; };
  }, [topic]);

  const handleSelect = (qId: string, optionIdx: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleNext = () => {
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correctCount++;
    });
    const score = Math.round((correctCount / questions.length) * 100);
    onComplete(score);
  };

  if (isGenerating) {
      return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center"
        >
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700">
                     <BrainCircuit className="w-12 h-12 text-primary-400 animate-pulse" />
                </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-100 mb-2">{loadingText}</h3>
            <p className="text-slate-400">This usually takes about 10-15 seconds.</p>
        </motion.div>
      )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary-500 blur-xl opacity-20 animate-pulse"></div>
          <Loader2 className="relative w-12 h-12 text-primary-500 animate-spin" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-100 mb-2">Analyzing Knowledge Graph</h3>
          <p className="text-slate-500">Generating calibrated questions for "{topic}"...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
            <BrainCircuit className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-200">We couldn't generate a test</h3>
            <p className="text-slate-500 mb-6">Our AI is having a moment. You can skip directly to the basics.</p>
            <button 
              onClick={() => onComplete(0)} 
              className="px-6 py-2 bg-slate-100 text-slate-900 rounded-lg hover:bg-white"
            >
              Start as Beginner
            </button>
        </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto p-6"
    >
      <div className="mb-10 text-center">
        <span className="text-xs font-bold text-primary-400 uppercase tracking-widest bg-slate-800 border border-slate-700 px-3 py-1 rounded-full">Assessment</span>
        <h2 className="text-3xl font-bold text-slate-100 mt-4 mb-2">Let's check your baseline</h2>
        <p className="text-slate-400 max-w-lg mx-auto">Answer these quick questions to help us tailor the learning path for <span className="text-slate-200 font-medium">{topic}</span>.</p>
      </div>

      <div className="space-y-8">
        {questions.map((q, idx) => {
          const isCorrect = submitted && answers[q.id] === q.correctAnswer;
          const isWrong = submitted && answers[q.id] !== undefined && answers[q.id] !== q.correctAnswer;
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={q.id} 
              className="bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-800"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-semibold text-xl text-slate-200 leading-snug">
                  <span className="text-slate-600 font-bold mr-3 text-lg">0{idx + 1}</span>
                  {q.text}
                </h3>
                {submitted && (
                  <div className="ml-4 shrink-0">
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : isWrong ? (
                      <XCircle className="w-6 h-6 text-red-500" />
                    ) : null}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {q.options.map((opt, oIdx) => {
                  const isSelected = answers[q.id] === oIdx;
                  let btnClass = "relative w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center group ";
                  
                  if (submitted) {
                    if (oIdx === q.correctAnswer) {
                      btnClass += "border-green-500/50 bg-green-500/10 text-green-400 ring-1 ring-green-500/50";
                    } else if (isSelected && oIdx !== q.correctAnswer) {
                      btnClass += "border-red-500/50 bg-red-500/10 text-red-400";
                    } else {
                      btnClass += "border-slate-800 text-slate-500 opacity-50";
                    }
                  } else {
                    if (isSelected) {
                      btnClass += "border-primary-500 bg-primary-500/10 text-primary-300 ring-1 ring-primary-500 z-10 shadow-sm";
                    } else {
                      btnClass += "border-slate-800 bg-slate-900 hover:border-slate-600 hover:bg-slate-800 text-slate-400";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelect(q.id, oIdx)}
                      disabled={submitted}
                      className={btnClass}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 transition-colors ${
                        isSelected && !submitted ? 'border-primary-500 bg-primary-500' : 'border-slate-600 group-hover:border-slate-500'
                      } ${submitted && oIdx === q.correctAnswer ? '!border-green-500 !bg-green-500' : ''} ${submitted && isSelected && oIdx !== q.correctAnswer ? '!border-red-500 !bg-red-500' : ''}`}>
                        {(isSelected || (submitted && oIdx === q.correctAnswer)) && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="font-medium">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-12 flex justify-end sticky bottom-6 z-20">
        <div className="bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-slate-700 shadow-xl">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length !== questions.length}
              className="px-8 py-3 bg-slate-100 text-slate-900 rounded-lg font-bold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
            >
              Submit Answers
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={isGenerating}
              className="group flex items-center px-8 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-500 transition-all shadow-lg shadow-primary-900/50 disabled:opacity-70 disabled:cursor-wait"
            >
              {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating...
                  </>
              ) : (
                  <>
                     Generate Roadmap <Sparkles className="w-5 h-5 ml-2" />
                  </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProficiencyAssessment;