
import React, { useState } from 'react';
import { VisualStyle, StyleProfile, StylePreset } from '../types';
import { Palette, ScanFace, Loader2, Upload, PenTool, Terminal, Sparkles, GraduationCap } from 'lucide-react';
import { analyzeStyleFingerprint } from '../services/geminiService';

interface StyleCustomizerProps {
  currentStyle: VisualStyle;
  onUpdate: (style: VisualStyle) => void;
  onTrainAutopilot: (profile: StyleProfile) => void;
  currentProfile?: StyleProfile;
}

const StyleCustomizer: React.FC<StyleCustomizerProps> = ({ currentStyle, onUpdate, onTrainAutopilot, currentProfile }) => {
  const [training, setTraining] = useState(false);

  const presets: Array<{ id: StylePreset, name: string, icon: React.ReactNode, font: string, desc: string, texture: string, fontId: any }> = [
      { id: 'IVY_LEAGUER', name: 'The Ivy Leaguer', icon: <GraduationCap size={16}/>, font: 'font-ivy', desc: 'Cornell structure. Serious.', texture: 'lined', fontId: 'ivy' },
      { id: 'DOODLER', name: 'The Doodler', icon: <PenTool size={16}/>, font: 'font-doodler', desc: 'Visual flow. Mindmaps.', texture: 'grid', fontId: 'doodler' },
      { id: 'HACKER', name: 'The Hacker', icon: <Terminal size={16}/>, font: 'font-hacker', desc: 'Markdown. Dark Mode.', texture: 'dark_terminal', fontId: 'hacker' },
      { id: 'INFLUENCER', name: 'The Influencer', icon: <Sparkles size={16}/>, font: 'font-influencer', desc: 'Aesthetic. Emojis.', texture: 'white_smooth', fontId: 'influencer' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setTraining(true);
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = async () => {
              try {
                  const base64 = (reader.result as string).split(',')[1];
                  const profile = await analyzeStyleFingerprint(base64, file.type);
                  onTrainAutopilot(profile);
                  // Auto-apply visual style
                  onUpdate({ ...currentStyle, font: profile.detected_font, paper_texture: 'cream_rough' });
              } catch (err) {
                  alert("Failed to analyze style. Try a clearer image.");
              } finally {
                  setTraining(false);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const selectPreset = (p: typeof presets[0]) => {
      const profile: StyleProfile = {
          id: p.id,
          name: p.name,
          preset_id: p.id,
          detected_font: p.fontId,
          tone: p.desc,
          structure_preference: 'Preset',
          shorthand_rules: [],
          system_instruction: 'Preset'
      };
      onTrainAutopilot(profile);
      onUpdate({ paper_texture: p.texture, font: p.fontId });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-stone-400">
        <Palette size={16} />
        <span className="text-xs font-bold uppercase tracking-widest">The Stationery Shop</span>
      </div>

      <div className="space-y-6">
        
        {/* Style Gallery (The Pen Case) */}
        <div>
            <label className="block text-xs font-medium text-stone-500 mb-3">Choose your Archetype</label>
            <div className="grid grid-cols-2 gap-3">
                {presets.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => selectPreset(p)}
                        className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden group ${
                            currentProfile?.preset_id === p.id 
                            ? 'border-stone-800 bg-stone-50 ring-1 ring-stone-800' 
                            : 'border-stone-200 hover:border-stone-400 hover:shadow-md'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1 text-stone-800">
                            {p.icon}
                            <span className={`text-sm font-bold ${p.font}`}>{p.name}</span>
                        </div>
                        <p className="text-[10px] text-stone-500 leading-tight">{p.desc}</p>
                        {/* Active Indicator */}
                        {currentProfile?.preset_id === p.id && (
                            <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Custom Trainer */}
        <div className="pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-2 text-stone-400">
                    <ScanFace size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Custom Clone</span>
                 </div>
                 {currentProfile?.preset_id === 'CUSTOM' && (
                     <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">Active</span>
                 )}
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
                <p className="text-xs text-blue-800 font-serif mb-3 leading-relaxed">
                    Upload 3 images of your real notes. We will clone your handwriting & formatting.
                </p>
                <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-2 shadow-lg hover:scale-105 transform">
                    {training ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    {training ? "Analyzing..." : "Train on Me"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={training} />
                </label>
            </div>
        </div>

      </div>
    </div>
  );
};

export default StyleCustomizer;
