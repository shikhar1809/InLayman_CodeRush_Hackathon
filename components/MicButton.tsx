
import React, { useRef, useState } from 'react';
import { Mic, AudioLines, StopCircle } from 'lucide-react';

interface MicButtonProps {
  isRecording: boolean;
  mode: 'idle' | 'dictation' | 'voice_note';
  onStartDictation: () => void;
  onStopDictation: () => void;
  onStartVoiceNote: () => void;
  onStopVoiceNote: () => void;
}

const MicButton: React.FC<MicButtonProps> = ({ 
  isRecording, 
  mode, 
  onStartDictation,
  onStopDictation,
  onStartVoiceNote, 
  onStopVoiceNote 
}) => {
  const timerRef = useRef<number | null>(null);
  const isLongPress = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Visual feedback states
  const [feedback, setFeedback] = useState<string | null>(null);
  const [flyingOrb, setFlyingOrb] = useState<{x: number, y: number} | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    // If we are already dictating, this click is intended to STOP dictation (via logic below),
    // so we don't start a long press timer.
    if (mode === 'dictation') return;

    e.preventDefault();
    isLongPress.current = false;
    
    // Capture pointer to track release even if cursor moves off button
    (e.target as Element).setPointerCapture(e.pointerId);

    timerRef.current = window.setTimeout(() => {
      isLongPress.current = true;
      setFeedback("Recording Voice Note...");
      if (navigator.vibrate) navigator.vibrate(50);
      onStartVoiceNote();
    }, 200); // 200ms threshold
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if ((e.target as Element).hasPointerCapture(e.pointerId)) {
        (e.target as Element).releasePointerCapture(e.pointerId);
    }

    if (isLongPress.current) {
      // -- END LONG PRESS (Voice Note) --
      onStopVoiceNote();
      setFeedback(null);
      
      // Trigger Fly-to-Tray Animation
      if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setFlyingOrb({ x: rect.left, y: rect.top });
          setTimeout(() => setFlyingOrb(null), 800);
      }

    } else {
      // -- CLICK (Dictation Toggle) --
      if (mode === 'voice_note') {
          // Edge case: Released too quickly after 200ms trigger
          onStopVoiceNote(); 
      } else if (mode === 'dictation') {
          onStopDictation();
      } else {
          onStartDictation();
      }
    }
    isLongPress.current = false;
  };

  // Determine Icon and Style based on Mode
  let icon = <Mic size={20} />;
  let btnClass = "text-stone-600 hover:bg-stone-200/50";
  let title = "Click: Dictate | Hold: Voice Note";
  let pulseClass = "";
  
  if (mode === 'dictation') {
      icon = <AudioLines size={20} className="text-red-500 animate-pulse" />;
      btnClass = "bg-white text-red-600 border border-red-200 shadow-inner";
      title = "Listening... (Click floating button to stop)";
  } else if (mode === 'voice_note') {
      icon = <div className="w-4 h-4 rounded-sm bg-blue-500 animate-pulse" />;
      btnClass = "bg-blue-50 text-blue-600 border border-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110";
      pulseClass = "animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20";
      title = "Recording Voice Note...";
  }

  return (
    <div className="relative group">
        {mode === 'voice_note' && <span className={pulseClass}></span>}
        
        <button
            ref={buttonRef}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            className={`relative z-10 p-2 rounded-full transition-all duration-200 active:scale-95 flex items-center justify-center ${btnClass}`}
            title={title}
        >
            {icon}
        </button>
        
        {/* Helper Tooltip (Only when idle) */}
        {mode === 'idle' && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-max bg-stone-800 text-white text-[10px] font-bold uppercase rounded py-1.5 px-3 text-center shadow-lg">
                Click: Dictate<br/>Hold: Tape
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-800 rotate-45"></div>
            </div>
        )}

        {/* Feedback Label for Voice Note */}
        {mode === 'voice_note' && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-full shadow-xl whitespace-nowrap animate-pop-in z-50">
                Recording...
            </div>
        )}

        {/* Fly-to-Tray Animation Orb */}
        {flyingOrb && (
            <div 
                className="fixed w-4 h-4 bg-blue-500 rounded-full z-[100] pointer-events-none animate-fly-to-tray shadow-lg"
                style={{ 
                    left: flyingOrb.x + 10, 
                    top: flyingOrb.y + 10,
                }}
            />
        )}

        <style>{`
            @keyframes flyToTray {
                0% { transform: translate(0, 0) scale(1); opacity: 1; }
                50% { transform: translate(100px, 100px) scale(0.8); opacity: 0.8; }
                100% { transform: translate(300px, 300px) scale(0); opacity: 0; } 
                /* Note: The final translation ideally targets the actual system dock position, 
                   but a generic down-right motion communicates 'saved to side' effectively without complex ref passing */
            }
            .animate-fly-to-tray {
                animation: flyToTray 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
        `}</style>
    </div>
  );
};

export default MicButton;
