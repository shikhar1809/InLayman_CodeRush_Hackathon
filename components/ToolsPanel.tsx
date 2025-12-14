
import React, { useState } from 'react';
import { GraduationCap, BookOpen, Headphones, Link, Grid, ChevronRight } from 'lucide-react';

interface ToolsPanelProps {
  onTestMe: () => void;
  onRevision: () => void;
  onCommute: () => void;
  onShare: () => void;
  focusMode?: boolean;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({ onTestMe, onRevision, onCommute, onShare, focusMode }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (focusMode) return null;

  return (
    <div className="fixed right-0 top-[30rem] z-30 flex pointer-events-none">
        {/* Toggle Tab */}
        <div className={`pointer-events-auto transition-transform duration-300 flex flex-col items-end ${isOpen ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
            <button 
                onClick={() => setIsOpen(true)}
                className="bg-white/80 backdrop-blur-md border border-r-0 border-stone-200 text-stone-500 p-2 py-3 rounded-l-xl shadow-sm hover:bg-white transition-all flex flex-col items-center gap-2 mr-0"
            >
                <Grid size={16} className="text-stone-600" />
                <span className="writing-vertical-rl text-[10px] font-bold uppercase tracking-widest mt-1">Tools</span>
            </button>
        </div>

        {/* Main Panel */}
        <div className={`pointer-events-auto bg-white/90 backdrop-blur-xl w-64 flex flex-col rounded-l-xl border border-stone-200 border-r-0 shadow-xl overflow-hidden transition-transform duration-300 ease-spring ${isOpen ? 'translate-x-0 mr-4 rounded-r-xl border-r' : 'translate-x-full'}`}>
             
             {/* Header */}
             <div className="p-3 border-b border-stone-100 bg-white/50 flex justify-between items-center shrink-0">
                <h3 className="text-xs font-bold text-stone-600 uppercase tracking-widest flex items-center gap-2">
                    <Grid size={14} /> Workbench
                </h3>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-stone-100 rounded-md text-stone-400 hover:text-stone-700 transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
             </div>

             <div className="p-2 grid grid-cols-1 gap-1">
                 
                 <button onClick={() => { onTestMe(); setIsOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors text-left group">
                     <div className="p-2 bg-stone-100 text-stone-600 rounded-md group-hover:bg-stone-200 transition-colors"><GraduationCap size={16} /></div>
                     <div>
                         <span className="text-xs font-bold text-stone-700 block">Test Me</span>
                         <span className="text-[10px] text-stone-400">Generate Quiz</span>
                     </div>
                 </button>

                 <button onClick={() => { onRevision(); setIsOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors text-left group">
                     <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md group-hover:bg-indigo-100 transition-colors"><BookOpen size={16} /></div>
                     <div>
                         <span className="text-xs font-bold text-stone-700 block">Revision Sheet</span>
                         <span className="text-[10px] text-stone-400">Cheat Sheet</span>
                     </div>
                 </button>

                 <div className="h-px bg-stone-100 my-1 mx-2"></div>

                 <button onClick={() => { onCommute(); setIsOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors text-left group">
                     <div className="p-2 bg-stone-800 text-white rounded-md group-hover:bg-stone-700 transition-colors"><Headphones size={16} /></div>
                     <div>
                         <span className="text-xs font-bold text-stone-700 block">Commute</span>
                         <span className="text-[10px] text-stone-400">Audio Mode</span>
                     </div>
                 </button>

                 <button onClick={() => { onShare(); setIsOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors text-left group">
                     <div className="p-2 bg-stone-100 text-stone-500 rounded-md group-hover:bg-stone-200 transition-colors"><Link size={16} /></div>
                     <div>
                         <span className="text-xs font-bold text-stone-700 block">Share</span>
                         <span className="text-[10px] text-stone-400">Public Link</span>
                     </div>
                 </button>

             </div>

        </div>
    </div>
  );
};

export default ToolsPanel;
