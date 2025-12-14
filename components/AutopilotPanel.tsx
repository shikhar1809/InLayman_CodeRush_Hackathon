
import React, { useState } from 'react';
import { StyleProfile, StylePreset } from '../types';
import { analyzeStyleFingerprint } from '../services/geminiService';
import { Upload, Sparkles, FileText, PenTool, GraduationCap, Terminal, User, Loader2, ChevronRight, Zap } from 'lucide-react';

interface AutopilotPanelProps {
  onGenerate: (text: string, style: StyleProfile) => void;
  onUploadContext: (file: File) => Promise<string>;
  focusMode?: boolean;
}

// Define presets
const PRESET_STYLES: Array<{ 
    id: StylePreset, 
    name: string, 
    Icon: React.ElementType, 
    desc: string, 
    fontId: StyleProfile['detected_font'],
    fontClass: string 
}> = [
    { id: 'IVY_LEAGUER', name: 'Ivy', Icon: GraduationCap, desc: 'Cornell', fontId: 'ivy', fontClass: 'font-ivy' },
    { id: 'DOODLER', name: 'Doodle', Icon: PenTool, desc: 'Mindmaps', fontId: 'doodler', fontClass: 'font-doodler' },
    { id: 'HACKER', name: 'Hacker', Icon: Terminal, desc: 'Markdown', fontId: 'hacker', fontClass: 'font-hacker' },
    { id: 'INFLUENCER', name: 'Vibe', Icon: Sparkles, desc: 'Aesthetic', fontId: 'influencer', fontClass: 'font-influencer' },
];

const AutopilotPanel: React.FC<AutopilotPanelProps> = ({ onGenerate, onUploadContext, focusMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sourceText, setSourceText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<StyleProfile | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setLoading(true);
          const file = e.target.files[0];
          try {
             const text = await onUploadContext(file);
             setSourceText(text);
          } catch (err) {
              alert("Failed to read file.");
          } finally {
              setLoading(false);
          }
      }
  };

  const handleGenerate = () => {
      if (!sourceText) return alert("No source material found!");
      if (!selectedStyle) return alert("Select a style!");
      setIsOpen(false);
      onGenerate(sourceText, selectedStyle);
  };

  if (focusMode) return null;

  return (
    <div className="fixed right-0 top-[22rem] h-[30vh] z-30 flex pointer-events-none">
        {/* Toggle Tab */}
        <div className={`pointer-events-auto transition-transform duration-300 flex flex-col items-end ${isOpen ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
            <button 
                onClick={() => setIsOpen(true)}
                className="bg-white/80 backdrop-blur-md border border-r-0 border-indigo-100 text-indigo-500 p-2 py-3 rounded-l-xl shadow-sm hover:bg-white transition-all flex flex-col items-center gap-2 mr-0"
            >
                <Zap size={16} className="fill-indigo-500" />
                <span className="writing-vertical-rl text-[10px] font-bold uppercase tracking-widest mt-1">Autopilot</span>
            </button>
        </div>

        {/* Main Panel */}
        <div className={`pointer-events-auto bg-white/90 backdrop-blur-xl w-72 flex flex-col rounded-l-xl border border-indigo-100 border-r-0 shadow-xl overflow-hidden transition-transform duration-300 ease-spring ${isOpen ? 'translate-x-0 mr-4 rounded-r-xl border-r' : 'translate-x-full'}`}>
             
             {/* Header */}
             <div className="p-3 border-b border-indigo-50 bg-indigo-50/30 flex justify-between items-center shrink-0">
                <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={14} className="fill-indigo-700" /> Autopilot
                </h3>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-indigo-50 rounded-md text-indigo-400 hover:text-indigo-700 transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
             </div>

             <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                 
                 {/* 1. Input Source */}
                 <div>
                     <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-2 block">1. Source</label>
                     <div className="grid grid-cols-2 gap-2">
                         <div className={`border rounded-lg p-2 text-center transition-all flex flex-col items-center justify-center min-h-[60px] ${sourceText ? 'bg-green-50/50 border-green-200' : 'bg-stone-50/50 border-stone-200'}`}>
                             <FileText size={16} className={`mb-1 ${sourceText ? 'text-green-600' : 'text-stone-300'}`} />
                             <span className="text-[9px] font-bold text-stone-500 leading-tight">{sourceText ? 'Loaded' : 'No Text'}</span>
                         </div>
                         <label className="border border-dashed border-stone-300 rounded-lg p-2 text-center cursor-pointer hover:bg-white hover:border-stone-400 transition-all flex flex-col items-center justify-center min-h-[60px]">
                             {loading ? <Loader2 size={16} className="animate-spin text-stone-400"/> : <Upload size={16} className="text-stone-400"/>}
                             <span className="text-[9px] font-bold text-stone-500 mt-1">Upload</span>
                             <input type="file" className="hidden" onChange={handleFileUpload} disabled={loading}/>
                         </label>
                     </div>
                 </div>

                 {/* 2. Style Grid */}
                 <div>
                     <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-2 block">2. Style & Visuals</label>
                     <div className="grid grid-cols-2 gap-2">
                        {PRESET_STYLES.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedStyle({
                                    id: s.id,
                                    name: s.name,
                                    preset_id: s.id,
                                    detected_font: s.fontId,
                                    tone: s.desc,
                                    structure_preference: 'Preset',
                                    shorthand_rules: [],
                                    system_instruction: 'Preset'
                                })}
                                className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all ${selectedStyle?.preset_id === s.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-stone-200 hover:border-stone-300 hover:bg-white'}`}
                            >
                                <div className="flex items-center gap-1.5">
                                    <s.Icon size={12} className="text-stone-600"/>
                                    <span className={`text-[10px] font-bold text-stone-800 ${s.fontClass}`}>{s.name}</span>
                                </div>
                            </button>
                        ))}
                     </div>
                 </div>

                 <button 
                    onClick={handleGenerate}
                    disabled={!sourceText || !selectedStyle}
                    className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest mt-2"
                 >
                    <Sparkles size={12} /> Generate Notes
                 </button>
             </div>

        </div>
    </div>
  );
};

export default AutopilotPanel;
