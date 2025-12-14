
import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ContentBlock, SnippetData } from '../types';
import { GripVertical, Sparkles, StickyNote, CassetteTape, X, BrainCircuit, Lightbulb, AlertTriangle, Baby, Trash2, Heart, Maximize2, Minimize2 } from 'lucide-react';

// Sub-component for individual draggable item
export const StagingItem: React.FC<{ block: ContentBlock; isOverlay?: boolean; onDelete?: (id: string) => void; className?: string }> = ({ block, isOverlay, onDelete, className }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `staging-${block.id}`,
        data: { block, origin: 'staging' }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
        opacity: isOverlay ? 0.9 : 0, // Hide original when dragging
    } : undefined;

    const baseClass = className || "mb-3";

    // --- COMMUNITY SNIPPET RENDERING ---
    if (block.type === 'community_snippet') {
        const snippet = JSON.parse(block.content) as SnippetData;
        
        let cardStyle = "bg-yellow-100 border-yellow-200 text-yellow-900";
        let Icon = Lightbulb;
        let title = "Analogy";

        if (snippet.type === 'CHEAT_CODE') {
            cardStyle = "bg-red-50 border-red-200 text-red-900";
            Icon = AlertTriangle;
            title = "Cheat Code";
        } else if (snippet.type === 'ELI5') {
            cardStyle = "bg-blue-50 border-blue-200 text-blue-900";
            Icon = Baby;
            title = "ELI5";
        }

        return (
            <div 
                ref={setNodeRef} 
                style={style} 
                {...listeners} 
                {...attributes} 
                className={`
                    relative p-4 rounded-sm shadow-md border cursor-grab active:cursor-grabbing group transition-transform hover:-rotate-1 h-full
                    ${cardStyle}
                    ${baseClass}
                    ${isOverlay ? 'shadow-2xl rotate-3 scale-105' : ''}
                `}
            >
                {/* Pin Effect */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-600 shadow-sm border border-red-800 z-10"></div>

                <div className="flex justify-between items-start mb-2 border-b border-black/10 pb-1">
                    <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider opacity-70">
                        <Icon size={12} /> {title}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-bold opacity-60">
                        <Heart size={8} className="fill-current" /> {snippet.likes}
                    </div>
                </div>

                <p className="font-handwriting text-lg leading-tight mb-3">
                    {snippet.content}
                </p>

                <div className="flex justify-between items-center text-[9px] font-mono opacity-50">
                    <span>@{snippet.author_tag}</span>
                </div>

                {onDelete && (
                    <button 
                        onPointerDown={(e) => { e.stopPropagation(); onDelete(block.id); }}
                        className="absolute -right-2 -bottom-2 bg-white text-stone-400 p-1.5 rounded-full shadow border border-stone-200 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 hover:bg-red-50"
                    >
                        <Trash2 size={12} />
                    </button>
                )}
            </div>
        );
    }

    // --- GENERIC / LEGACY RENDERING ---
    let contentPreview = null;
    if (block.type === 'audio_tape') {
         contentPreview = (
             <div className="bg-stone-50 p-2 rounded border border-stone-100 flex items-center gap-2">
                 <div className="w-6 h-6 bg-stone-200 rounded-full flex items-center justify-center">
                     <CassetteTape size={12} className="text-stone-500"/>
                 </div>
                 <div>
                     <p className="text-[10px] font-mono font-bold text-stone-600">{block.duration}</p>
                     <p className="text-[9px] text-stone-400 truncate w-24">{block.content}</p>
                 </div>
             </div>
         );
    } else if (block.type === 'topic_card') {
         const profile = JSON.parse(block.content);
         contentPreview = (
             <div className="bg-white p-2 border border-stone-200 rounded flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                      <BrainCircuit size={12} className="text-indigo-500" />
                      <span className="font-bold text-xs text-stone-800 truncate">{profile.topic_name}</span>
                  </div>
                  <div className="flex gap-1">
                      <div className={`h-1 rounded-full flex-1 ${profile.stats.toughness_score > 7 ? 'bg-red-400' : 'bg-green-400'}`}></div>
                  </div>
                  <p className="text-[9px] text-stone-400 line-clamp-1">{profile.layman_summary}</p>
             </div>
         );
    } else {
        contentPreview = (
            <div className="text-xs text-stone-600 line-clamp-3 font-serif leading-relaxed">
                {block.content.substring(0, 100)}{block.content.length > 100 ? '...' : ''}
            </div>
        );
    }

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...listeners} 
            {...attributes} 
            className={`
                bg-white p-3 rounded shadow-sm border border-stone-200 cursor-grab active:cursor-grabbing group relative transition-all hover:border-stone-400 hover:shadow-md h-full
                ${baseClass}
                ${isOverlay ? 'shadow-2xl rotate-3 scale-105 border-indigo-400 bg-white' : ''}
            `}
        >
             <div className="absolute top-2 right-2 text-stone-300 group-hover:text-stone-500">
                 <GripVertical size={14} />
             </div>
             
             <p className="text-[9px] font-bold uppercase text-stone-400 mb-1.5 flex items-center gap-1">
                 {block.type === 'audio_tape' ? <CassetteTape size={10} /> : block.type === 'topic_card' ? <BrainCircuit size={10} /> : <Sparkles size={10}/>}
                 {block.type.replace('_', ' ')}
             </p>
             
             {contentPreview}

             {onDelete && (
                <button 
                    onPointerDown={(e) => { e.stopPropagation(); onDelete(block.id); }}
                    className="absolute -right-2 -top-2 bg-stone-100 text-stone-400 p-1 rounded-full shadow border border-stone-200 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 hover:bg-red-50"
                >
                    <X size={12} />
                </button>
             )}
        </div>
    )
}

interface StagingAreaProps {
    blocks: ContentBlock[];
    isOpen: boolean;
    onClose: () => void;
    onRemoveBlock?: (id: string) => void;
}

const StagingArea: React.FC<StagingAreaProps> = ({ blocks, isOpen, onClose, onRemoveBlock }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`fixed right-0 top-24 bottom-24 z-30 flex flex-col pointer-events-none transition-all duration-300 ease-spring ${isOpen ? 'translate-x-0' : 'translate-x-full'} ${expanded ? 'w-full md:w-[800px] max-w-[95vw]' : 'w-80'}`}>
             
             {/* Main Panel */}
             <div className="pointer-events-auto bg-[#e5e5e5] flex-1 flex flex-col rounded-l-md border-l-4 border-stone-300 shadow-2xl overflow-hidden mr-0 my-4 relative">
                 
                 {/* Cork Texture Overlay */}
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cork-1.png')] opacity-60 pointer-events-none mix-blend-multiply"></div>

                {/* Header */}
                <div className="relative p-3 bg-stone-800 text-white flex justify-between items-center shrink-0 z-10 shadow-md">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <Sparkles size={14} className="text-yellow-400 fill-yellow-400" /> Staging Area
                        </h3>
                        <p className="text-[9px] text-stone-400">{blocks.length} Clips</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setExpanded(!expanded)}
                            className="p-1.5 hover:bg-stone-700 rounded-md text-stone-400 hover:text-white transition-colors flex items-center gap-1"
                            title={expanded ? "Collapse View" : "Expand View"}
                        >
                            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            <span className="text-[10px] font-bold uppercase hidden sm:inline">{expanded ? 'Collapse' : 'See All'}</span>
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-1 hover:bg-stone-700 rounded-md text-stone-400 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* The List */}
                <div className="relative flex-1 overflow-y-auto p-4 custom-scrollbar z-10">
                    {blocks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                            <div className="w-16 h-16 border-4 border-dashed border-stone-400 rounded-full flex items-center justify-center mb-3">
                                <StickyNote size={24} className="text-stone-500" />
                            </div>
                            <p className="text-xs text-stone-600 font-bold uppercase tracking-widest">Empty</p>
                            <p className="text-[10px] text-stone-500 mt-1 max-w-[150px] leading-relaxed">
                                Use the lasso tool to find Community Notes.
                            </p>
                        </div>
                    ) : (
                        <div className={`${expanded ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4' : 'flex flex-col'} pb-4`}>
                            {blocks.map(b => (
                                <div key={b.id} className="h-full">
                                    <StagingItem block={b} onDelete={onRemoveBlock} className={expanded ? 'mb-0' : 'mb-3'} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Footer Tip */}
                {blocks.length > 0 && (
                        <div className="relative p-2 bg-stone-200 border-t border-stone-300 text-center shrink-0 z-10 shadow-inner">
                            <p className="text-[9px] text-stone-500 font-bold uppercase tracking-wider">Drag clips to notebook</p>
                        </div>
                )}
             </div>
        </div>
    );
};

export default StagingArea;
