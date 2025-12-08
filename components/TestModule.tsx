import React, { useState, useEffect } from 'react';
import { generateQuiz, evaluateComprehensiveTest } from '../services/gemini';
import { authService } from '../services/authService';
import { Question, TestResult } from '../types';
import { BrainCircuit, Loader2, ArrowRight, CheckCircle2, XCircle, GraduationCap, ArrowLeft, RefreshCw, Send } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

interface Props {
  topic: string;
  onBack: () => void;
}

type Stage = 'INTRO' | 'QUIZ' | 'WRITTEN' | 'GRADING' | 'RESULTS';

const TestModule: React.FC<Props> = ({ topic, onBack }) => {
  const [stage, setStage] = useState<Stage>('INTRO');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [writtenExplanation, setWrittenExplanation] = useState('');
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startQuiz = async () => {
    setLoading(true);
    setError(null);
    const q = await generateQuiz(topic);
    if (q.length === 0) {
        setError("Could not generate questions. Please check your connection or try a different topic.");
        setLoading(false);
        return;
    }
    setQuestions(q);
    setLoading(false);
    setStage('QUIZ');
  };

  const handleAnswer = (qId: string, optIdx: number) => {
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleNextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      setStage('WRITTEN');
    }
  };

  const handleSubmitTest = async () => {
    setStage('GRADING');
    // Calculate MCQ Score immediately for local use
    let correct = 0;
    questions.forEach(q => {
        if (answers[q.id] === q.correctAnswer) correct++;
    });
    
    // Call API for full evaluation
    const res = await evaluateComprehensiveTest(topic, correct, questions.length, writtenExplanation);
    setResult(res);
    
    // SAVE RESULT TO PROFILE
    authService.saveTestResult(res, topic);

    setStage('RESULTS');
  };

  // --- RENDERING SUB-COMPONENTS ---

  if (loading || stage === 'GRADING') {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="relative mb-6">
                 <div className="absolute inset-0 bg-primary-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                 <Loader2 className="w-12 h-12 text-primary-400 animate-spin relative z-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-200">
                {stage === 'GRADING' ? 'Professor Albus is grading your paper...' : 'Preparing your exam...'}
            </h3>
            <p className="text-slate-500 mt-2">
                {stage === 'GRADING' ? 'Analyzing your logic and clarity.' : 'Generating challenging questions.'}
            </p>
        </div>
    );
  }

  // STAGE 1: INTRO
  if (stage === 'INTRO') {
    return (
        <div className="max-w-2xl mx-auto p-6 text-center pt-20">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl border border-slate-800 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-500/10">
                <GraduationCap className="w-10 h-10 text-primary-400" />
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-4">Knowledge Check: {topic}</h1>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                You are about to take a comprehensive test. 
                It consists of <b>15 Multiple Choice Questions</b> followed by a short written explanation.
                <br /><br />
                Professor Albus will grade your clarity and depth of understanding.
            </p>
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
                    {error}
                </div>
            )}
            <div className="flex justify-center gap-4">
                <button onClick={onBack} className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition">
                    Cancel
                </button>
                <button onClick={startQuiz} className="px-8 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-500 shadow-lg shadow-primary-900/40 transition">
                    Start Exam
                </button>
            </div>
        </div>
    );
  }

  // STAGE 2: QUIZ
  if (stage === 'QUIZ') {
    const q = questions[currentQIndex];
    const progress = ((currentQIndex + 1) / questions.length) * 100;
    const isAnswered = answers[q.id] !== undefined;

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Question {currentQIndex + 1} / {questions.length}</span>
                <div className="w-32 h-1.5 bg-slate-800 rounded-full">
                    <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <motion.div 
                key={q.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl min-h-[400px] flex flex-col"
            >
                <h3 className="text-xl font-bold text-white mb-8 leading-relaxed">{q.text}</h3>
                
                <div className="space-y-3 flex-1">
                    {(q.options || []).map((opt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(q.id, idx)}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                                answers[q.id] === idx 
                                    ? 'bg-primary-500/20 border-primary-500 text-white' 
                                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700'
                            }`}
                        >
                            <span className="mr-3 font-mono opacity-50">{String.fromCharCode(65 + idx)}.</span>
                            {opt}
                        </button>
                    ))}
                </div>

                <div className="mt-8 flex justify-end">
                    <button 
                        onClick={handleNextQuestion}
                        disabled={!isAnswered}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition"
                    >
                        {currentQIndex === questions.length - 1 ? 'Next Step' : 'Next Question'} <ArrowRight size={18} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
  }

  // STAGE 3: WRITTEN
  if (stage === 'WRITTEN') {
    return (
        <div className="max-w-2xl mx-auto p-6 pt-12">
             <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <GraduationCap className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Final Challenge</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Professor Albus is listening</p>
                    </div>
                </div>
                
                <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                    "Alright, put the books away. In exactly <b>5 lines or less</b>, explain the core concept of 
                    <span className="text-primary-400"> {topic} </span> 
                    to me as if I were a bright student. Be crisp."
                </p>

                <textarea 
                    value={writtenExplanation}
                    onChange={(e) => setWrittenExplanation(e.target.value)}
                    placeholder="Type your explanation here..."
                    className="w-full h-40 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none mb-2"
                />
                <div className="flex justify-between items-center text-xs text-slate-500 mb-6">
                    <span>Be concise.</span>
                    <span>{writtenExplanation.length} chars</span>
                </div>

                <button 
                    onClick={handleSubmitTest}
                    disabled={writtenExplanation.length < 10}
                    className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-500 transition shadow-lg shadow-primary-900/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Submit Final Exam <Send size={18} />
                </button>
             </div>
        </div>
    );
  }

  // STAGE 4: RESULTS
  if (stage === 'RESULTS' && result) {
      const topicsToRevisit = result.topicsToRevisit || [];
      
      return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto p-6 pb-20"
        >
            <div className="flex items-center mb-8 gap-4">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-bold text-white">Exam Report</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Score Card */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                    <div className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-2">Total Score</div>
                    <div className={`text-6xl font-black ${result.totalScore >= 80 ? 'text-green-400' : result.totalScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {result.totalScore}
                    </div>
                    <div className="mt-4 flex gap-2 text-xs font-medium text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                        <span>MCQ: {result.mcqScore}</span>
                        <span className="text-slate-700">|</span>
                        <span>Written: {result.explanationScore}</span>
                    </div>
                </div>

                {/* Professor's Feedback */}
                <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <GraduationCap className="w-32 h-32 text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="text-sm font-bold text-blue-400 uppercase tracking-widest">Professor's Verdict</div>
                            <span className={`text-xs px-2 py-0.5 rounded border ${
                                result.clarityRating === 'Crystal Clear' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 
                                result.clarityRating === 'Fuzzy' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 
                                'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}>{result.clarityRating}</span>
                        </div>
                        <p className="text-lg text-slate-200 italic leading-relaxed">
                            "{result.professorFeedback}"
                        </p>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">Suggested Improvements</h3>
                <div className="space-y-4">
                    {topicsToRevisit.length > 0 ? (
                         topicsToRevisit.map((topic, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800/50">
                                <RefreshCw className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-slate-200">Revisit: {topic}</h4>
                                    <p className="text-sm text-slate-500 mt-1">You missed questions related to this concept.</p>
                                </div>
                            </div>
                         ))
                    ) : (
                        <div className="flex items-center gap-4 text-green-400">
                            <CheckCircle2 className="w-6 h-6" />
                            <span className="font-bold">No major gaps identified. Excellent work!</span>
                        </div>
                    )}
                </div>
            </div>

             <div className="mt-8 text-center">
                 <button onClick={onBack} className="text-slate-500 hover:text-white transition underline">
                     Return to Home
                 </button>
             </div>
        </motion.div>
      );
  }

  return null;
};

export default TestModule;