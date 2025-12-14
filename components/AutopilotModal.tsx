
import React, { useState } from 'react';
import { StyleProfile, StylePreset, GroundingContext } from '../types';
import { analyzeStyleFingerprint, ingestResource } from '../services/geminiService';
import { Upload, Sparkles, FileText, PenTool, GraduationCap, Terminal, User, Loader2, X, Link as LinkIcon, Youtube, AlignLeft } from 'lucide-react';

interface AutopilotModalProps {
  existingContext?: GroundingContext;
  onClose: () => void;
  onGenerate: (sourceText: string, manualTopic: string, style: StyleProfile) => void;
  onUploadContext: (file: File) => Promise<string>; // Returns extracted text
}

// Define presets with explicit font classes for the UI preview
const PRESET_STYLES: Array<{ 
    id: StylePreset, 
    name: string, 
    Icon: React.ElementType, 
    desc: string, 
    fontId: StyleProfile['detected_font'],
    fontClass: string 
}> = [
    { id: 'IVY_LEAGUER', name: 'The Ivy Leaguer', Icon: GraduationCap, desc: 'Cornell Notes. Structured. Academic.', fontId: 'ivy', fontClass: 'font-ivy' },
    { id: 'DOODLER', name: 'The Doodler', Icon: PenTool, desc: 'Mindmaps & Flowcharts. Visual.', fontId: 'doodler', fontClass: 'font-doodler' },
    { id: 'HACKER', name: 'The Hacker', Icon: Terminal, desc: 'Markdown. Dense. Code-heavy.', fontId: 'hacker', fontClass: 'font-hacker' },
    { id: 'INFLUENCER', name: 'The Influencer', Icon: Sparkles, desc: 'Aesthetic. Emojis. Bullet points.', fontId: 'influencer', fontClass: 'font-influencer' },
];

const AutopilotModal: React.FC<AutopilotModalProps> = ({ existingContext, onClose, onGenerate, onUploadContext }) => {
  const [step, setStep] = useState<'SOURCE' | 'STYLE'>('SOURCE');
  const [sourceText, setSourceText] = useState<string>(existingContext?.raw_text || '');
  const [sourceName, setSourceName] = useState<string>(existingContext?.source_summary || '');
  const [loading, setLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<StyleProfile | null>(null);
  
  // New Manual Input State
  const [manualTopic, setManualTopic] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setLoading(true);
          const file = e.target.files[0];
          try {
             const text = await onUploadContext(file);
             setSourceText(text);
             setSourceName(file.name);
          } catch (err) {
              alert("Failed to read file.");
          } finally {
              setLoading(false);
          }
      }
  };

  const handleCustomStyleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setLoading(true);
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = async () => {
              try {
                  const base64 = (reader.result as string).split(',')[1];
                  const profile = await analyzeStyleFingerprint(base64, file.type);
                  setSelectedStyle(profile);
              } catch (err) {
                  alert("Failed to analyze handwriting.");
              } finally {
                  setLoading(false);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleGenerate = () => {
      if (!sourceText && !manualTopic) return alert("Please provide source material OR a topic!");
      if (!selectedStyle) return alert("Select a style!");
      onGenerate(sourceText, manualTopic, selectedStyle);
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-[#fdfbf7] w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-pop-in max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-white/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h2 className="font-serif font-bold text-xl text-stone-800">Autopilot Studio</h2>
                        <p className="text-xs text-stone-400 uppercase tracking-widest">AI Note Generation</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 relative min-h-[400px]">
                
                {/* Step 1: Source */}
                <div className={`transition-all duration-500 absolute inset-0 p-8 flex flex-col ${step === 'SOURCE' ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 -translate-x-10 pointer-events-none z-0'}`}>
                    <h3 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-stone-800 text-white text-xs flex items-center justify-center">1</span>
                        What are we studying?
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-6">
                        
                        {/* Option A: Files */}
                        <div>
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 block">A. Source Material (Optional)</label>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Existing Context Option */}
                                <div 
                                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${sourceText ? 'border-indigo-500 bg-indigo-50' : 'border-stone-200 opacity-60 hover:opacity-100'}`}
                                >
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <FileText size={24} className={sourceText ? "text-indigo-600" : "text-stone-300"} />
                                        <div>
                                            <p className="font-bold text-stone-700 text-sm">{sourceText ? "Context Loaded" : "Current Context"}</p>
                                            <p className="text-[10px] text-stone-500 line-clamp-1">{existingContext?.source_summary || "No file"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Upload New Option */}
                                <label className="border-2 border-dashed border-stone-300 hover:border-stone-500 hover:bg-stone-50 rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2 group">
                                    {loading ? <Loader2 size={24} className="animate-spin text-stone-400"/> : <Upload size={24} className="text-stone-400 group-hover:text-stone-600"/>}
                                    <div>
                                        <p className="font-bold text-stone-700 text-sm">Upload File</p>
                                        <p className="text-[10px] text-stone-500">PDF / IMG</p>
                                    </div>
                                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={loading}/>
                                </label>
                            </div>
                        </div>

                        {/* Option B: Manual Input */}
                        <div>
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 block">B. Topic / Instructions / Web Link</label>
                            <div className={`border-2 rounded-xl p-4 transition-all flex flex-col gap-2 ${manualTopic ? 'border-indigo-500 bg-indigo-50' : 'border-stone-200 hover:border-stone-400'}`}>
                                <div className="flex items-center gap-2 text-stone-500 mb-1">
                                    <AlignLeft size={16} />
                                    <span className="text-xs font-bold uppercase">Manual Entry</span>
                                </div>
                                <textarea 
                                    placeholder="e.g. 'Explain the French Revolution in simple terms' or paste a YouTube Link..."
                                    className="w-full bg-transparent outline-none text-sm text-stone-700 placeholder:text-stone-400 font-serif resize-none h-24"
                                    value={manualTopic}
                                    onChange={(e) => setManualTopic(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {(sourceText || manualTopic) && (
                        <div className="mt-auto pt-6 flex justify-end">
                            <button 
                                onClick={() => setStep('STYLE')}
                                className="bg-stone-800 text-white px-6 py-3 rounded-lg font-serif shadow-lg hover:bg-stone-700 transition-colors flex items-center gap-2"
                            >
                                Next Step <User size={16}/>
                            </button>
                        </div>
                    )}
                </div>

                {/* Step 2: Style */}
                <div className={`transition-all duration-500 absolute inset-0 p-8 flex flex-col ${step === 'STYLE' ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-10 pointer-events-none z-0'}`}>
                    <h3 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
                         <span className="w-6 h-6 rounded-full bg-stone-800 text-white text-xs flex items-center justify-center">2</span>
                         Choose Persona
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-6">
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
                                className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all ${selectedStyle?.preset_id === s.id ? 'border-stone-800 bg-stone-100 ring-1 ring-stone-800' : 'border-stone-200 hover:border-stone-300'}`}
                            >
                                <div className="flex items-center gap-2 text-stone-800 font-bold">
                                    <s.Icon size={20} /> 
                                    <span className={s.fontClass}>{s.name}</span>
                                </div>
                                <p className="text-xs text-stone-500">{s.desc}</p>
                            </button>
                        ))}
                    </div>

                    <div className="border-t border-stone-100 pt-6">
                        <label className="flex items-center justify-between p-4 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <User size={20} className="text-stone-400" />
                                <div>
                                    <p className="font-bold text-stone-700">Clone My Handwriting</p>
                                    <p className="text-xs text-stone-500">Upload a sample of your notes</p>
                                </div>
                            </div>
                            {loading ? <Loader2 size={16} className="animate-spin text-stone-400"/> : <div className="bg-white border border-stone-300 px-3 py-1 rounded text-xs font-bold text-stone-600">Upload</div>}
                            <input type="file" accept="image/*" className="hidden" onChange={handleCustomStyleUpload} disabled={loading}/>
                        </label>
                        {selectedStyle?.preset_id === 'CUSTOM' && (
                             <p className="text-xs text-green-600 font-bold mt-2 text-center">✓ Custom Style Analyzed & Ready</p>
                        )}
                    </div>

                    <div className="mt-8 flex justify-between">
                         <button onClick={() => setStep('SOURCE')} className="text-stone-400 hover:text-stone-600 font-serif">Back</button>
                         <button 
                            onClick={handleGenerate}
                            disabled={!selectedStyle}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-serif shadow-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Sparkles size={16} /> Generate Notes
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export default AutopilotModal;
