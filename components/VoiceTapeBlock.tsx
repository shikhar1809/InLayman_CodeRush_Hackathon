
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, AlignLeft, RotateCcw } from 'lucide-react';

interface VoiceTapeBlockProps {
    audioUrl: string;
    duration: string;
    transcript: string;
    styleVariant?: 'yellow' | 'blue' | 'pink' | 'green';
}

const VoiceTapeBlock: React.FC<VoiceTapeBlockProps> = ({ audioUrl, duration, transcript, styleVariant = 'yellow' }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize Audio
    useEffect(() => {
        if (!audioRef.current && audioUrl) {
            audioRef.current = new Audio(audioUrl);
            audioRef.current.onended = () => setIsPlaying(false);
        }
    }, [audioUrl]);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleFlip = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFlipped(!isFlipped);
    };

    const getColors = () => {
        switch(styleVariant) {
            case 'blue': return 'bg-stone-300 border-stone-400 text-stone-800';
            case 'pink': return 'bg-stone-800 border-stone-900 text-stone-100'; // Inverted/Dark
            case 'green': return 'bg-stone-200 border-stone-300 text-stone-700';
            case 'yellow': default: return 'bg-white border-stone-200 text-stone-900';
        }
    };

    const colorClasses = getColors();
    const isDark = styleVariant === 'pink';

    // Tape CSS shape (simulated jagged edges via clip-path)
    const tapeShape = {
        clipPath: 'polygon(2% 0%, 98% 0%, 100% 2%, 98% 5%, 100% 8%, 98% 11%, 100% 14%, 98% 17%, 100% 20%, 98% 23%, 100% 26%, 98% 29%, 100% 32%, 98% 35%, 100% 38%, 98% 41%, 100% 44%, 98% 47%, 100% 50%, 98% 53%, 100% 56%, 98% 59%, 100% 62%, 98% 65%, 100% 68%, 98% 71%, 100% 74%, 98% 77%, 100% 80%, 98% 83%, 100% 86%, 98% 89%, 100% 92%, 98% 95%, 100% 98%, 98% 100%, 2% 100%, 0% 98%, 2% 95%, 0% 92%, 2% 89%, 0% 86%, 2% 83%, 0% 80%, 2% 77%, 0% 74%, 2% 71%, 0% 68%, 2% 65%, 0% 62%, 2% 59%, 0% 56%, 2% 53%, 0% 50%, 2% 47%, 0% 44%, 2% 41%, 0% 38%, 2% 35%, 0% 32%, 2% 29%, 0% 26%, 2% 23%, 0% 20%, 2% 17%, 0% 14%, 2% 11%, 0% 8%, 2% 5%, 0% 2%)'
    };

    return (
        <div className="group w-full h-full perspective-1000 select-none">
            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* Front: The Tape */}
                <div 
                    className={`absolute inset-0 backface-hidden ${colorClasses} shadow-md flex items-center justify-between px-3 cursor-pointer`}
                    style={tapeShape}
                    onClick={togglePlay}
                >
                    <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-white/20' : 'bg-black/10'} ${isPlaying ? (isDark ? 'bg-white/30' : 'bg-black/20') : ''}`}>
                            {isPlaying ? <Pause size={12} fill="currentColor"/> : <Play size={12} fill="currentColor" />}
                        </div>
                        <span className="font-mono text-xs font-bold opacity-80">{duration}</span>
                        {/* Simulated Waveform */}
                        <div className="flex gap-[1px] h-4 items-center">
                            {[...Array(10)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-[2px] rounded-full transition-all duration-300 ${isDark ? 'bg-white/40' : 'bg-black/30'}`}
                                    style={{ 
                                        height: isPlaying ? `${Math.random() * 100}%` : `${20 + Math.random() * 60}%` 
                                    }}
                                ></div>
                            ))}
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleFlip}
                        className={`p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                        title="View Transcript"
                    >
                        <AlignLeft size={14} />
                    </button>
                </div>

                {/* Back: The Transcript */}
                <div 
                    className="absolute inset-0 backface-hidden rotate-y-180 bg-white border border-stone-200 shadow-lg p-2 rounded-sm flex flex-col overflow-hidden"
                >
                     <div className="flex justify-between items-start mb-1">
                         <span className="text-[8px] font-bold uppercase text-stone-400">Transcript</span>
                         <button onClick={handleFlip} className="text-stone-400 hover:text-stone-600"><RotateCcw size={10} /></button>
                     </div>
                     <p className="text-[10px] font-serif leading-tight text-stone-700 line-clamp-3">
                         {transcript || "Transcription pending..."}
                     </p>
                </div>
            </div>
            
            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
            `}</style>
        </div>
    );
};

export default VoiceTapeBlock;
