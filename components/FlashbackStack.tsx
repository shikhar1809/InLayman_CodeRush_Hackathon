
import React, { useState, useEffect } from 'react';
import { ContentBlock } from '../types';
import { RotateCw, Check, X, Layers } from 'lucide-react';

interface FlashbackStackProps {
    blocks: ContentBlock[];
    onReview: (blockId: string, remembered: boolean) => void;
}

const FlashbackStack: React.FC<FlashbackStackProps> = ({ blocks, onReview }) => {
    // Filter for reviewable text blocks
    const [queue, setQueue] = useState<ContentBlock[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);

    useEffect(() => {
        // Simple logic: Pick 5 random blocks that are text based
        const textBlocks = blocks.filter(b => b.type === 'text' && b.content.length > 30);
        const shuffled = [...textBlocks].sort(() => 0.5 - Math.random());
        setQueue(shuffled.slice(0, 5));
    }, [blocks]);

    const handleSwipe = (dir: 'left' | 'right') => {
        setSwipeDir(dir);
        setTimeout(() => {
            if (queue[activeIdx]) {
                onReview(queue[activeIdx].id, dir === 'right');
            }
            setActiveIdx(prev => prev + 1);
            setSwipeDir(null);
        }, 300); // Wait for animation
    };

    if (queue.length === 0 || activeIdx >= queue.length) {
        return (
            <div className="absolute top-32 left-8 w-64 h-64 border-4 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center text-stone-400 opacity-50 rotate-[-5deg]">
                 <Check size={48} />
                 <p className="font-bold uppercase tracking-widest mt-2">All Caught Up</p>
            </div>
        );
    }

    const current = queue[activeIdx];

    return (
        <div className="absolute top-24 left-12 z-20 w-72 h-80 group perspective-1000">
            <div className="absolute -top-8 left-0 flex items-center gap-2 text-stone-500 font-bold uppercase text-xs tracking-widest">
                <Layers size={14} /> Flashback Stack
            </div>

            {/* Stack Effect (Cards behind) */}
            <div className="absolute inset-0 bg-white shadow-xl border border-stone-200 rounded-xl rotate-3 scale-95 opacity-60"></div>
            <div className="absolute inset-0 bg-white shadow-xl border border-stone-200 rounded-xl -rotate-2 scale-95 opacity-40"></div>

            {/* Active Card */}
            <div 
                className={`absolute inset-0 bg-white shadow-2xl border-4 border-white rounded-xl flex flex-col transition-all duration-300 ease-out transform ${swipeDir === 'left' ? '-translate-x-full rotate-[-20deg] opacity-0' : ''} ${swipeDir === 'right' ? 'translate-x-full rotate-[20deg] opacity-0' : ''}`}
            >
                {/* Polaroid Image Area (Mocked with text snippet) */}
                <div className="flex-1 bg-stone-100 p-6 flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dust.png')] opacity-20"></div>
                    <p className="font-handwriting text-xl text-stone-800 text-center leading-relaxed line-clamp-6">
                        {current.content}
                    </p>
                </div>
                
                {/* Polaroid Footer */}
                <div className="h-20 bg-white flex justify-between items-center px-6">
                    <button 
                        onClick={() => handleSwipe('left')}
                        className="p-3 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                        title="Forgot"
                    >
                        <X size={20} />
                    </button>
                    <span className="text-xs font-bold text-stone-300 uppercase tracking-widest">Do you recall?</span>
                    <button 
                        onClick={() => handleSwipe('right')}
                        className="p-3 rounded-full bg-green-50 text-green-500 hover:bg-green-100 transition-colors"
                        title="Remembered"
                    >
                        <Check size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FlashbackStack;
