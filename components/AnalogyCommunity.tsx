import React, { useEffect, useState } from 'react';
import { libraryService } from '../services/libraryService';
import { CommunityAnalogy, AvatarConfig, TeachingStyle } from '../types';
import { ArrowLeft, ThumbsUp, PlusCircle, Share2, Loader2, Search, Filter, Hash, Palette, Brain, Mic, Save, X, Sparkles } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

interface Props {
    onBack: () => void;
}

const CATEGORIES = ["All", "Tech", "Science", "Math", "History", "Coding", "Philosophy", "Life"];

// --- Mock Avatar Preview Component ---
const AvatarPreview = ({ config }: { config: AvatarConfig }) => (
    <div className="w-32 h-32 mx-auto rounded-full border-4 border-slate-700 overflow-hidden bg-slate-800 relative shadow-xl">
        <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
                 <linearGradient id="skin" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={config.skinTone}/><stop offset="1" stopColor={config.skinTone} style={{filter:'brightness(0.9)'}}/></linearGradient>
            </defs>
            <rect x="50" y="60" width="100" height="120" rx="40" fill="url(#skin)" />
            <path d="M 40,180 Q 100,210 160,180 L 160,220 L 40,220 Z" fill={config.shirtColor} />
            {config.hairStyle === 'short' && <path d="M 50,80 Q 100,50 150,80 L 150,60 Q 100,20 50,60 Z" fill={config.hairColor} />}
            {config.hairStyle === 'long' && <path d="M 50,60 Q 100,20 150,60 L 160,180 L 40,180 Z" fill={config.hairColor} />}
            {config.hairStyle === 'spiked' && <path d="M 50,70 L 60,40 L 70,70 L 80,30 L 90,70 L 100,40 L 110,70 L 120,30 L 130,70 L 140,40 L 150,70 Z" fill={config.hairColor} />}
            <circle cx="80" cy="100" r="4" fill="#333" /><circle cx="120" cy="100" r="4" fill="#333" />
            <path d="M 85,130 Q 100,140 115,130" fill="none" stroke="#333" strokeWidth="2" />
            {config.accessory === 'glasses' && <g stroke="#333" strokeWidth="2" fill="none"><circle cx="80" cy="100" r="12"/><circle cx="120" cy="100" r="12"/><line x1="92" y1="100" x2="108" y2="100"/></g>}
            {config.accessory === 'headphones' && <path d="M 40,100 Q 100,20 160,100" fill="none" stroke="#333" strokeWidth="6" />}
        </svg>
    </div>
);

const AnalogyCommunity: React.FC<Props> = ({ onBack }) => {
    const [analogies, setAnalogies] = useState<CommunityAnalogy[]>([]);
    const [filter, setFilter] = useState('');
    const [selectedCategory, setSelectedCategory] = useState("All");
    
    // View State
    const [viewMode, setViewMode] = useState<'LIST' | 'CREATE'>('LIST');

    // CREATE FORM STATE
    const [newTopic, setNewTopic] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newTag, setNewTag] = useState('');
    
    // AI Persona Config State
    const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>({ skinTone: '#fca5a5', hairColor: '#3f2818', hairStyle: 'short', accessory: 'none', shirtColor: '#2563eb' });
    const [teachingStyle, setTeachingStyle] = useState<TeachingStyle>({ memeLevel: 20, strictness: 50, verbosity: 50, useAnalogies: true });
    const [voiceName, setVoiceName] = useState('Puck');

    useEffect(() => {
        setAnalogies(libraryService.getCommunityAnalogies());
    }, []);

    const handleVote = (id: string) => {
        libraryService.voteCommunityAnalogy(id, 1);
        setAnalogies(libraryService.getCommunityAnalogies()); // Refresh
    };

    const handleSubmit = () => {
        if(!newTopic || !newTitle || !newContent) return;
        
        // Custom logic to include Persona data which libraryService needs to support or we mock it here
        const all = libraryService.getCommunityAnalogies();
        const newItem: CommunityAnalogy = {
            id: Date.now().toString(),
            topic: newTopic,
            title: newTitle,
            content: newContent,
            author: "You",
            votes: 0,
            tags: ['User Submitted', newTag].filter(Boolean),
            datePosted: Date.now(),
            avatarConfig,
            teachingStyle,
            voiceName
        };
        all.unshift(newItem);
        localStorage.setItem('inlayman_community_mock', JSON.stringify(all));
        
        setAnalogies(all);
        setViewMode('LIST');
        setNewTopic(''); setNewTitle(''); setNewContent(''); setNewTag('');
    };

    if (viewMode === 'CREATE') {
        return (
            <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
                <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                    <button onClick={() => setViewMode('LIST')} className="flex items-center gap-2 text-slate-400 hover:text-white transition"><ArrowLeft size={18}/> Cancel</button>
                    <div className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2"><Sparkles className="text-purple-400"/> Analogy Studio</div>
                    <button onClick={handleSubmit} disabled={!newTopic || !newTitle || !newContent} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg shadow-green-900/20 disabled:opacity-50 transition-all flex items-center gap-2">
                        <Save size={18}/> Publish
                    </button>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT: Content */}
                    <div className="w-1/2 p-8 overflow-y-auto border-r border-slate-800">
                        <h2 className="text-2xl font-bold text-white mb-6">The Content</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Topic Concept</label>
                                <input value={newTopic} onChange={e => setNewTopic(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:border-green-500 focus:outline-none text-lg font-bold" placeholder="e.g. DNS Propagation" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Catchy Title</label>
                                    <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-green-500 focus:outline-none" placeholder="e.g. The Town Crier" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Tag</label>
                                    <select value={newTag} onChange={e => setNewTag(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-green-500 focus:outline-none">
                                        <option value="">Select Category...</option>
                                        {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">The Analogy Explanation</label>
                                <textarea value={newContent} onChange={e => setNewContent(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white h-64 resize-none focus:border-green-500 focus:outline-none text-lg leading-relaxed font-serif" placeholder="Explain the concept simply..." />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: AI Persona Config */}
                    <div className="w-1/2 bg-slate-900/30 p-8 overflow-y-auto">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><BotIcon/> The Tutor Persona</h2>
                        <p className="text-slate-400 mb-8">Design the AI agent that will deliver this analogy to other users.</p>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="flex flex-col items-center">
                                <AvatarPreview config={avatarConfig} />
                                <div className="mt-4 text-xs font-bold text-slate-500 uppercase">Visual Identity</div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Voice</label>
                                    <div className="flex gap-2">
                                        {['Puck', 'Kore', 'Fenrir', 'Charon'].map(v => (
                                            <button key={v} onClick={() => setVoiceName(v)} className={`px-3 py-1 rounded-md text-xs font-bold border transition ${voiceName === v ? 'bg-primary-600 border-primary-500 text-white' : 'border-slate-700 text-slate-400'}`}>{v}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Hair Style</label>
                                    <select value={avatarConfig.hairStyle} onChange={e => setAvatarConfig({...avatarConfig, hairStyle: e.target.value as any})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-sm">
                                        <option value="short">Short</option><option value="long">Long</option><option value="spiked">Spiked</option><option value="bun">Bun</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Accessory</label>
                                    <select value={avatarConfig.accessory} onChange={e => setAvatarConfig({...avatarConfig, accessory: e.target.value as any})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-sm">
                                        <option value="none">None</option><option value="glasses">Glasses</option><option value="headphones">Headphones</option><option value="hat">Hat</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-6 bg-slate-950 p-6 rounded-2xl border border-slate-800">
                             <h3 className="text-sm font-bold text-white flex items-center gap-2"><Brain size={16}/> Personality Matrix</h3>
                             
                             <div>
                                <div className="flex justify-between text-xs font-bold text-slate-400 mb-2"><span>Strictness (Professionalism)</span><span>{teachingStyle.strictness}%</span></div>
                                <input type="range" min="0" max="100" value={teachingStyle.strictness} onChange={e => setTeachingStyle({...teachingStyle, strictness: parseInt(e.target.value)})} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                             </div>

                             <div>
                                <div className="flex justify-between text-xs font-bold text-slate-400 mb-2"><span>Meme / Humor Level</span><span>{teachingStyle.memeLevel}%</span></div>
                                <input type="range" min="0" max="100" value={teachingStyle.memeLevel} onChange={e => setTeachingStyle({...teachingStyle, memeLevel: parseInt(e.target.value)})} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                             </div>
                             
                             <div>
                                <div className="flex justify-between text-xs font-bold text-slate-400 mb-2"><span>Verbosity (Detail)</span><span>{teachingStyle.verbosity}%</span></div>
                                <input type="range" min="0" max="100" value={teachingStyle.verbosity} onChange={e => setTeachingStyle({...teachingStyle, verbosity: parseInt(e.target.value)})} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-green-500" />
                             </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="text-slate-400 hover:text-white transition flex items-center gap-2">
                    <ArrowLeft size={18} /> Back to Home
                </button>
                <div className="flex items-center gap-2">
                     <span className="text-sm font-bold text-green-400 uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 shadow-green-900/20 shadow-lg">
                         Global Mind
                     </span>
                </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 mb-8 text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-10 opacity-5"><Share2 className="w-64 h-64 text-green-500"/></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-extrabold text-white mb-3">Analogy Marketplace</h1>
                    <p className="text-slate-400 max-w-2xl mx-auto mb-8 text-lg">
                        Discover how other minds explain complex ideas. <br/>Browse the library or contribute your own "Aha!" moments.
                    </p>
                    
                    <div className="flex flex-col md:flex-row justify-center gap-4 max-w-3xl mx-auto">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                            <input 
                                type="text" 
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                placeholder="Search concepts (e.g. Redux, Entropy)..."
                                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/50 shadow-inner"
                            />
                        </div>
                        <button 
                            onClick={() => setViewMode('CREATE')}
                            className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-green-900/40 hover:scale-105 transform duration-200"
                        >
                            <PlusCircle size={20} /> Creator Studio
                        </button>
                    </div>

                    <div className="mt-8 flex flex-wrap justify-center gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
                                    selectedCategory === cat 
                                        ? 'bg-green-500 text-slate-900 border-green-500' 
                                        : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analogies.filter(a => {
                    const matchesText = a.topic.toLowerCase().includes(filter.toLowerCase()) || a.title.toLowerCase().includes(filter.toLowerCase());
                    const matchesCategory = selectedCategory === "All" || a.tags.some(t => t.toLowerCase() === selectedCategory.toLowerCase());
                    return matchesText && matchesCategory;
                }).map((item) => (
                    <motion.div 
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-green-500/30 transition-all flex flex-col group hover:bg-slate-900/80 shadow-lg hover:shadow-green-900/10"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                     <span className="text-[10px] font-bold text-slate-900 bg-green-400 px-1.5 py-0.5 rounded uppercase tracking-wider">{item.topic}</span>
                                     <span className="text-[10px] text-slate-500">{new Date(item.datePosted).toLocaleDateString()}</span>
                                </div>
                                <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors line-clamp-1">{item.title}</h3>
                            </div>
                            {item.avatarConfig && <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 shadow-sm"><AvatarPreview config={item.avatarConfig} /></div>}
                        </div>
                        
                        <p className="text-slate-300 italic mb-6 flex-1 leading-relaxed text-sm line-clamp-4">"{item.content}"</p>
                        
                        <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-auto">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                                    {item.author.charAt(0)}
                                </div>
                                <span className="text-xs text-slate-400 font-medium">@{item.author}</span>
                            </div>
                            
                            <button 
                                onClick={() => handleVote(item.id)}
                                className="flex items-center gap-1.5 text-slate-400 hover:text-green-400 transition bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-green-500/30"
                            >
                                <ThumbsUp size={14} /> <span className="font-bold text-sm">{item.votes}</span>
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
            
            {analogies.length === 0 && (
                <div className="text-center py-20">
                    <Hash className="w-12 h-12 text-slate-700 mx-auto mb-4"/>
                    <h3 className="text-slate-500 font-bold">No analogies found.</h3>
                    <p className="text-slate-600 text-sm">Be the first to contribute to this category!</p>
                </div>
            )}
        </div>
    );
};

const BotIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>;

export default AnalogyCommunity;