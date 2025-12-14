
import React, { useState, useEffect, useRef } from 'react';
import { chatWithWinger } from '../services/geminiService';
import { Bell, BellOff } from 'lucide-react';

interface AvatarProps {
  systemContext: string;
  currentFocus: string;
  focusMode?: boolean;
  incomingMessage?: string | null; // For programmatic speech
  onMessageComplete?: () => void;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
    };
    reader.readAsDataURL(blob);
  });
};

const Avatar: React.FC<AvatarProps> = ({ systemContext, currentFocus, focusMode = false, incomingMessage, onMessageComplete }) => {
  const [state, setState] = useState<'peek' | 'hover' | 'listening' | 'speaking' | 'thinking'>('peek');
  const [isMuted, setIsMuted] = useState(false);
  const [speechBubbleText, setSpeechBubbleText] = useState<string | null>(null);
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPressedRef = useRef(false); 
  const [supportedMimeType, setSupportedMimeType] = useState<string>('audio/webm');
  
  // Voice State
  const [wingerVoice, setWingerVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Handle Incoming Message (Programmatic Speech)
  useEffect(() => {
      if (incomingMessage && !isMuted) {
          speakText(incomingMessage);
      } else if (incomingMessage && isMuted) {
          setSpeechBubbleText(incomingMessage);
          setState('speaking');
          setTimeout(() => {
              setSpeechBubbleText(null);
              if (onMessageComplete) onMessageComplete();
              setState('hover');
          }, 4000);
      }
  }, [incomingMessage]);

  useEffect(() => {
    // Detect supported mime type
    if (MediaRecorder.isTypeSupported('audio/webm')) {
      setSupportedMimeType('audio/webm');
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      setSupportedMimeType('audio/mp4');
    } else {
      console.warn('No standard audio mime type supported, defaulting to blank');
      setSupportedMimeType(''); 
    }

    const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const preferred = 
            voices.find(v => v.name.includes('Google UK English Female')) || 
            voices.find(v => v.name === 'Google US English') || 
            voices.find(v => v.name === 'Microsoft Zira Desktop') ||
            voices.find(v => v.name === 'Samantha') ||
            voices.find(v => v.name.includes('Natural') && v.lang.startsWith('en')) ||
            voices.find(v => v.lang === 'en-US');
            
        if (preferred) setWingerVoice(preferred);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    // Cleanup on unmount
    return () => {
        window.speechSynthesis.cancel();
    }
  }, []);

  // Eye Tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (state === 'peek') return; 
      
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth) * 2 - 1;
      const y = (e.clientY / innerHeight) * 2 - 1;
      
      setEyePos({ x: x * 5, y: y * 5 }); 
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [state]);

  // Helper to unlock AudioContext/SpeechSynthesis on iOS/Android
  const unlockAudio = () => {
      // 1. Prime Speech Synthesis
      if (window.speechSynthesis) {
          // Play a tiny silence to unlock the queue
          const utterance = new SpeechSynthesisUtterance('');
          utterance.volume = 0;
          window.speechSynthesis.speak(utterance);
      }
      // 2. Resume Context (if using WebAudio in future features)
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
          const ctx = new AudioContext();
          if (ctx.state === 'suspended') ctx.resume();
          ctx.close(); // Just open/close to trigger permission
      }
  };

  const startListening = async () => {
    try {
        setSpeechBubbleText(null); 
        window.speechSynthesis.cancel();
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (!isPressedRef.current) {
            stream.getTracks().forEach(t => t.stop());
            if (state !== 'speaking' && state !== 'thinking') setState('hover');
            return;
        }

        let options = {};
        if (supportedMimeType) {
          options = { mimeType: supportedMimeType };
        }

        mediaRecorderRef.current = new MediaRecorder(stream, options);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorderRef.current.start();
        setState('listening');
        
        if (navigator.vibrate) navigator.vibrate(50);

    } catch (e) {
        console.error("Mic Error", e);
        setState('hover');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.onstop = async () => {
                    if (audioChunksRef.current.length > 0) {
                        const blob = new Blob(audioChunksRef.current, { type: supportedMimeType });
                        processAudio(blob);
                    } else {
                        setState('hover');
                    }
                    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
                };
            }
        }, 200);
        setState('thinking');
    } else {
        setState('hover');
    }
  };

  const speakText = (text: string) => {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      if (wingerVoice) {
          utterance.voice = wingerVoice;
      }
      
      // Soothing voice settings
      utterance.pitch = 1.0; 
      utterance.rate = 0.9; 

      utterance.onstart = () => {
          setState('speaking');
          setSpeechBubbleText(text);
      };

      utterance.onend = () => {
          setState('hover');
          setSpeechBubbleText(null);
          if(onMessageComplete) onMessageComplete();
      };

      utterance.onerror = () => {
          setState('hover');
          setSpeechBubbleText(null);
          if(onMessageComplete) onMessageComplete();
      }
      
      window.speechSynthesis.speak(utterance);
  }

  const processAudio = async (blob: Blob) => {
      try {
          if (blob.size < 1000) {
              setState('hover');
              return;
          }

          const base64 = await blobToBase64(blob);
          const response = await chatWithWinger(base64, systemContext, currentFocus, supportedMimeType);
          
          if (isMuted) {
              setSpeechBubbleText(response.text);
              setState('speaking'); 
              setTimeout(() => {
                if (state === 'speaking') { 
                    setState('hover');
                    setSpeechBubbleText(null);
                }
              }, Math.min(6000, response.text.length * 50));
          } else {
              speakText(response.text);
          }

      } catch (e) {
          console.error("Audio Processing Error", e);
          setState('hover');
          setSpeechBubbleText("Sorry, I didn't catch that.");
          setTimeout(() => setSpeechBubbleText(null), 2000);
      }
  }

  // --- Interaction Handlers (Push-to-Talk) ---

  const handlePointerDown = (e: React.PointerEvent) => {
      e.preventDefault(); 
      e.stopPropagation();

      isPressedRef.current = true;
      unlockAudio(); // Critical for Mobile Browsers

      if (state === 'speaking') {
          window.speechSynthesis.cancel();
          setState('hover');
          setSpeechBubbleText(null);
          return;
      }
      startListening();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isPressedRef.current = false;
      if (state === 'listening') stopListening();
  };
  
  const handlePointerLeave = (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isPressedRef.current) {
          isPressedRef.current = false;
          if (state === 'listening') stopListening();
      }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
      e.preventDefault();
      isPressedRef.current = false;
      if (state === 'listening') stopListening();
  };

  let transformClass = "translate-y-[70%]"; 
  if (state === 'peek') transformClass = "translate-y-[70%] scale-100";
  else if (state === 'hover') transformClass = "translate-y-[50%] scale-100";
  else if (state === 'speaking') transformClass = "translate-y-[30%] scale-110";
  else if (state === 'listening') transformClass = "translate-y-[10%] scale-125"; 
  else transformClass = "translate-y-[20%] scale-105"; 

  let statusColor = '#ef4444'; 
  if (state === 'listening') statusColor = '#22c55e'; 
  else if (state === 'speaking' || state === 'thinking') statusColor = '#3b82f6'; 

  return (
    <div 
        ref={containerRef}
        className={`w-full h-full transition-all duration-300 ease-spring ${transformClass} cursor-pointer touch-none select-none`}
        style={{ touchAction: 'none' }} 
        onMouseEnter={() => state === 'peek' && setState('hover')}
        onMouseLeave={() => state === 'hover' && setState('peek')}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => e.preventDefault()} 
    >
        {!focusMode && (state === 'hover' || state === 'peek') && (
             <div className="absolute top-1/2 -translate-y-1/2 right-full mr-3 flex items-center animate-pop-in pointer-events-none z-50 transition-opacity duration-300 opacity-100">
                <span className="bg-stone-800 text-white text-[10px] px-3 py-1.5 rounded-lg shadow-xl font-bold uppercase tracking-widest whitespace-nowrap border border-stone-600">
                    Hold to Talk
                </span>
                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[6px] border-l-stone-800 border-b-[6px] border-b-transparent -ml-[1px]"></div>
             </div>
        )}
        
        {state === 'listening' && (
             <div className="absolute -top-24 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-pulse">
                <span className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full shadow-xl font-bold uppercase tracking-widest whitespace-nowrap">
                    Listening...
                </span>
             </div>
        )}

        {speechBubbleText && (
            <div className="absolute bottom-[110%] right-0 w-64 bg-white p-4 rounded-2xl shadow-xl border-2 border-stone-800 animate-pop-in z-50">
                <p className="font-sans text-sm text-stone-800">{speechBubbleText}</p>
                <div className="absolute -bottom-2 right-12 w-4 h-4 bg-white border-r-2 border-b-2 border-stone-800 transform rotate-45"></div>
            </div>
        )}

        <button 
            onPointerDown={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
            className={`absolute -top-4 -right-4 bg-white p-2 rounded-full shadow-md z-50 hover:bg-stone-100 transition-colors ${state === 'peek' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            title={isMuted ? "Unmute Winger" : "Mute Winger"}
        >
            {isMuted ? <BellOff size={14} className="text-stone-400" /> : <Bell size={14} className="text-accent" />}
        </button>

        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-2xl pointer-events-none">
            <path d="M20,120 L80,120 L80,80 C80,50 20,50 20,80 Z" fill="#333" />
            <circle cx="50" cy="50" r="35" fill="#f5f5f5" stroke="#333" strokeWidth="3" />
            <path 
                d="M19,35 Q50,5 81,35" 
                stroke={statusColor} 
                strokeWidth="6" 
                fill="none" 
                strokeLinecap="round"
                className="transition-colors duration-300"
            />
            <g transform={`translate(${eyePos.x}, ${eyePos.y})`}>
                <ellipse cx="38" cy="45" rx="6" ry="8" fill="#333" />
                {state === 'thinking' && <circle cx="38" cy="45" r="3" fill="white" className="animate-ping" />}
                <ellipse cx="62" cy="45" rx="6" ry="8" fill="#333" />
                {state === 'thinking' && <circle cx="62" cy="45" r="3" fill="white" className="animate-ping" />}
            </g>
            {state === 'speaking' ? (
                <ellipse cx="50" cy="70" rx="10" ry="8" fill="#333">
                    <animate attributeName="ry" values="2;8;2" dur="0.25s" repeatCount="indefinite" />
                    <animate attributeName="rx" values="10;8;10" dur="0.25s" repeatCount="indefinite" />
                </ellipse>
            ) : state === 'listening' ? (
                 <path d="M45,70 Q50,75 55,70" stroke="#333" strokeWidth="2" fill="none" />
            ) : (
                <path d="M45,70 Q50,72 55,70" stroke="#333" strokeWidth="2" fill="none" />
            )}
            {state === 'listening' && (
                 <circle cx="50" cy="50" r="45" stroke={statusColor} strokeWidth="2" fill="none" className="animate-ping" opacity="0.5" />
            )}
            {(state === 'thinking' || state === 'speaking') && (
                 <circle cx="50" cy="50" r="40" stroke={statusColor} strokeWidth="1" fill="none" className="animate-pulse" opacity="0.3" />
            )}
        </svg>
    </div>
  );
};

export default Avatar;
    