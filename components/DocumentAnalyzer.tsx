import React, { useEffect, useState } from 'react';
import { DocumentAnalysis } from '../types';
import { Printer, ArrowLeft, FileText, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

interface Props {
  data: DocumentAnalysis;
  onBack: () => void;
  isLoading?: boolean;
}

const DocumentAnalyzer: React.FC<Props> = ({ data, onBack, isLoading = false }) => {
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
      "Reading Document Structure...",
      "Identifying Jargon & Concepts...",
      "Generating Analogies...",
      "Rebuilding Document Layout...",
      "Finalizing Visuals & Examples..."
  ];

  useEffect(() => {
      if (isLoading) {
          setLoadingStep(0);
          const interval = setInterval(() => {
              setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
          }, 2500); // Cycle through steps every 2.5s
          return () => clearInterval(interval);
      }
  }, [isLoading]);
  
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-950">
              <div className="relative mb-8">
                  <div className="absolute inset-0 bg-primary-500 blur-3xl opacity-20 animate-pulse rounded-full"></div>
                  <div className="relative w-24 h-32 bg-slate-900 rounded-xl border border-slate-700 flex flex-col p-3 gap-2 shadow-2xl">
                      <div className="w-full h-2 bg-slate-700 rounded animate-pulse"></div>
                      <div className="w-3/4 h-2 bg-slate-700 rounded animate-pulse"></div>
                      <div className="w-full h-px bg-slate-800 my-2"></div>
                      <div className="w-full h-full bg-slate-800/50 rounded flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                      </div>
                  </div>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Rewriting Document...</h2>
              <div className="h-6 overflow-hidden relative">
                  <AnimatePresence mode="wait">
                      <motion.p 
                        key={loadingStep}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="text-primary-400 font-mono text-sm"
                      >
                          {loadingSteps[loadingStep]}
                      </motion.p>
                  </AnimatePresence>
              </div>
              
              <div className="mt-8 w-64 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <motion.div 
                    className="h-full bg-primary-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "95%" }}
                    transition={{ duration: 12, ease: "linear" }}
                  />
              </div>
          </div>
      )
  }

  // Provide robust fallback structure merging with data to ensure arrays exist
  const safeData = {
      title: data?.title || "Untitled Document",
      summary: data?.summary || "No summary available.",
      sections: Array.isArray(data?.sections) ? data.sections : [],
      keyConcepts: Array.isArray(data?.keyConcepts) ? data.keyConcepts : [],
      actionItems: Array.isArray(data?.actionItems) ? data.actionItems : []
  };

  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto p-8 min-h-screen pb-20 print:p-0 print:max-w-none"
    >
      <div className="mb-8 flex justify-between items-center print:hidden">
        <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
            <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <div className="flex gap-3">
            <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
            >
                <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
        </div>
      </div>

      <div className="bg-white text-slate-900 rounded-xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none min-h-[800px]">
        {/* Document Header */}
        <div className="bg-slate-100 p-12 border-b border-slate-200 text-center">
            <div className="flex justify-center items-center gap-2 text-primary-600 font-bold uppercase tracking-widest text-xs mb-4">
                <FileText className="w-4 h-4" /> Simplified Version
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-6">{safeData.title}</h1>
            <div className="max-w-2xl mx-auto">
                <p className="text-lg text-slate-600 leading-relaxed italic border-l-4 border-primary-500 pl-4 text-left">
                    "{safeData.summary}"
                </p>
            </div>
        </div>

        <div className="p-12 space-y-12">
            
            {/* Rewritten Sections */}
            {safeData.sections.length > 0 ? (
                <section>
                    <div className="space-y-8">
                        {safeData.sections.map((section, idx) => (
                            <div key={idx} className="relative group break-inside-avoid">
                                <h3 className="text-2xl font-bold text-slate-900 mb-3 font-serif">{section.title}</h3>
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <p className="text-slate-700 leading-relaxed whitespace-pre-line text-lg">
                                            {section.content}
                                        </p>
                                    </div>
                                    {/* Margin Note Analogy */}
                                    {section.analogyNote && (
                                        <div className="md:w-1/3 shrink-0 print:hidden">
                                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm text-slate-600 italic relative sticky top-4">
                                                <span className="absolute -top-2 -left-2 bg-yellow-200 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded">ANALOGY</span>
                                                {section.analogyNote}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ) : (
                <div className="text-center text-slate-400 italic">No detailed sections generated.</div>
            )}

            <div className="h-px bg-slate-200 w-full"></div>

            {/* Vocabulary / Key Concepts */}
            <section className="break-inside-avoid">
                <h2 className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-6">Vocabulary & Terms</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    {safeData.keyConcepts.map((concept, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                            <h3 className="text-base font-bold text-slate-900 mb-1">{concept.term}</h3>
                            <p className="text-sm text-slate-600 mb-3">{concept.definition}</p>
                            <div className="text-sm text-primary-700 font-medium italic pl-3 border-l-2 border-primary-300">
                                "{concept.analogy}"
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="h-px bg-slate-200 w-full"></div>

            {/* Action Items / Conclusion */}
            <section className="bg-slate-900 text-slate-100 -mx-12 -mb-12 p-12 break-inside-avoid">
                 <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                    Key Takeaways & Next Steps
                </h2>
                <ul className="space-y-4">
                    {safeData.actionItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                            <ArrowRight className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                            <span className="leading-relaxed text-lg text-slate-300">{item}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
      </div>
    </motion.div>
  );
};

export default DocumentAnalyzer;