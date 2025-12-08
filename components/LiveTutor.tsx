import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Settings, X, Power, WifiOff, Wifi, Loader2, RefreshCw } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';
import { LiveSession } from '../services/gemini';
import { LiveConfig, AnalogyContent, TranscriptItem, AvatarConfig, TeachingStyle } from '../types';

const motion = motionBase as any;

interface Props {
  contextTopic?: string;
  documentContext?: string; // New: Full text of document/note
  analogyContent?: AnalogyContent | null;
  standalone?: boolean; 
  onClose?: () => void;
}

// --- CONFIGURATION CONSTANTS ---
const HAIR_COLORS = ['#09090b', '#3f2818', '#b45309', '#facc15', '#a1a1aa', '#f43f5e', '#6366f1'];
const SKIN_TONES = ['#fecaca', '#fca5a5', '#d6d3d1', '#a8a29e', '#78716c', '#57534e'];

const PRESETS: Record<string, { avatar: AvatarConfig, teaching: TeachingStyle, name: string }> = {
    'professor': {
        name: 'Professor',
        avatar: { skinTone: '#fecaca', hairColor: '#a1a1aa', hairStyle: 'short', accessory: 'glasses', shirtColor: '#2563eb' },
        teaching: { memeLevel: 0, strictness: 80, verbosity: 70, useAnalogies: true },
    },
    'bro': {
        name: 'Chill Bro',
        avatar: { skinTone: '#d6d3d1', hairColor: '#facc15', hairStyle: 'spiked', accessory: 'headphones', shirtColor: '#dc2626' },
        teaching: { memeLevel: 90, strictness: 10, verbosity: 30, useAnalogies: true },
    },
    'socrates': {
        name: 'Socrates',
        avatar: { skinTone: '#a8a29e', hairColor: '#ffffff', hairStyle: 'bun', accessory: 'none', shirtColor: '#16a34a' },
        teaching: { memeLevel: 10, strictness: 40, verbosity: 80, useAnalogies: true },
    }
};

// --- DYNAMIC AVATAR COMPONENT ---
const DigitalHumanAvatar = ({ config, audioLevel, inputVolume, isStarted, isVideoOn, mousePos }: { config: AvatarConfig, audioLevel: number, inputVolume: number, isStarted: boolean, isVideoOn: boolean, mousePos: {x: number, y: number} }) => {
    const [blink, setBlink] = useState(false);
    
    useEffect(() => {
        const blinkLoop = () => {
            setBlink(true);
            setTimeout(() => setBlink(false), 150);
            setTimeout(blinkLoop, Math.random() * 4000 + 2000);
        };
        const timer = setTimeout(blinkLoop, 2000);
        return () => clearTimeout(timer);
    }, []);

    const normalizedVol = Math.min(1, audioLevel / 50); 
    const mouthOpen = normalizedVol * 25; 
    
    const mouthPath = isStarted 
        ? `M 85,145 Q 100,${145 + mouthOpen} 115,145 Q 100,${145 - (mouthOpen * 0.3)} 85,145`
        : "M 85,145 Q 100,155 115,145"; 

    const lookX = (mousePos.x / window.innerWidth - 0.5) * 8;
    const lookY = (mousePos.y / window.innerHeight - 0.5) * 8;

    return (
        <div className={`relative w-80 h-80 transition-all duration-500 pointer-events-auto ${isVideoOn ? 'scale-50 translate-y-32 translate-x-20' : ''}`}>
             <motion.div 
                className="absolute inset-0 rounded-full blur-3xl"
                animate={{ 
                    scale: 1 + normalizedVol * 0.5,
                    opacity: 0.2 + normalizedVol * 0.4
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{ 
                    background: `radial-gradient(circle, ${config.shirtColor} 0%, transparent 70%)`
                }}
             ></motion.div>

             {isStarted && normalizedVol < 0.1 && (
                 <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-2"
                 >
                     <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-white/50"/>
                     <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-white/50"/>
                     <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-white/50"/>
                 </motion.div>
             )}

            <motion.div 
                animate={{ y: [0, -4, 0] }} 
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-full h-full relative z-10 filter drop-shadow-2xl"
            >
                <svg viewBox="0 0 200 220" className="w-full h-full">
                    <defs>
                        <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                        <linearGradient id="skinGrad" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={config.skinTone} />
                            <stop offset="100%" stopColor={config.skinTone} style={{filter: 'brightness(0.8)'}} />
                        </linearGradient>
                    </defs>

                    <path d="M 80,150 L 80,190 Q 100,200 120,190 L 120,150" fill="url(#skinGrad)" />
                    <path d="M 50,190 Q 100,210 150,190 L 150,220 L 50,220 Z" fill={config.shirtColor} />
                    <rect x="60" y="50" width="80" height="110" rx="35" fill="url(#skinGrad)" />

                    {config.hairStyle === 'long' && <path d="M 50,80 Q 40,150 50,180 L 150,180 Q 160,150 150,80" fill={config.hairColor} />}
                    {config.hairStyle === 'bun' && <circle cx="100" cy="40" r="25" fill={config.hairColor} />}

                    <circle cx="58" cy="110" r="8" fill={config.skinTone} />
                    <circle cx="142" cy="110" r="8" fill={config.skinTone} />

                    {!config.accessory.includes('glasses') && (
                        <g style={{ transform: `translate(${lookX}px, ${lookY}px)`, transition: 'transform 0.1s' }}>
                            <ellipse cx="80" cy="100" rx="10" ry={blink ? 1 : 8} fill="white" />
                            <ellipse cx="120" cy="100" rx="10" ry={blink ? 1 : 8} fill="white" />
                            {!blink && (
                                <>
                                    <circle cx="80" cy="100" r="4" fill="#1e293b" />
                                    <circle cx="120" cy="100" r="4" fill="#1e293b" />
                                    <circle cx="82" cy="98" r="1.5" fill="white" opacity="0.6" />
                                </>
                            )}
                            <path d="M 70,88 Q 80,85 90,88" fill="none" stroke={config.hairColor} strokeWidth="2.5" strokeLinecap="round" style={{ transform: `translateY(${normalizedVol * -2}px)` }} />
                            <path d="M 110,88 Q 120,85 130,88" fill="none" stroke={config.hairColor} strokeWidth="2.5" strokeLinecap="round" style={{ transform: `translateY(${normalizedVol * -2}px)` }} />
                        </g>
                    )}

                    <path d={mouthPath} fill="#3f1a1a" stroke="#7f1d1d" strokeWidth="0" />
                    {mouthOpen > 5 && <path d={`M 90,145 Q 100,${145 + (mouthOpen * 0.2)} 110,145`} fill="white" opacity="0.8" />}

                    <path d="M 95,115 Q 100,125 105,115" fill="none" stroke="#000" strokeOpacity="0.1" strokeWidth="2" />

                    {config.hairStyle === 'short' && <path d="M 60,80 Q 100,50 140,80 L 140,60 Q 100,20 60,60 Z" fill={config.hairColor} />}
                    {config.hairStyle === 'spiked' && <path d="M 55,70 L 70,40 L 85,70 L 100,30 L 115,70 L 130,40 L 145,70 L 140,90 Q 100,60 60,90 Z" fill={config.hairColor} />}
                    {config.hairStyle === 'long' && <path d="M 60,60 Q 100,30 140,60" fill="none" stroke={config.hairColor} strokeWidth="15" />}
                    {config.hairStyle === 'bun' && <path d="M 60,60 Q 100,40 140,60" fill="none" stroke={config.hairColor} strokeWidth="10" />}

                    {config.accessory === 'glasses' && (
                         <g stroke="#1e293b" strokeWidth="3" fill="rgba(255,255,255,0.1)">
                            <circle cx="80" cy="100" r="14" />
                            <circle cx="120" cy="100" r="14" />
                            <line x1="94" y1="100" x2="106" y2="100" />
                            <line x1="58" y1="100" x2="66" y2="100" />
                            <line x1="134" y1="100" x2="142" y2="100" />
                         </g>
                    )}
                    {config.accessory === 'headphones' && (
                        <g>
                            <rect x="35" y="85" width="20" height="50" rx="8" fill="#334155" />
                            <rect x="145" y="85" width="20" height="50" rx="8" fill="#334155" />
                            <path d="M 45,90 Q 100,10 155,90" fill="none" stroke="#334155" strokeWidth="8" />
                        </g>
                    )}
                    {config.accessory === 'hat' && (
                         <g>
                             <path d="M 50,70 Q 100,30 150,70 L 150,60 Q 100,5 50,60 Z" fill="#ef4444" />
                             <rect x="40" y="65" width="120" height="12" rx="4" fill="#b91c1c" />
                         </g>
                    )}

                    {inputVolume > 0.1 && (
                         <g opacity={Math.min(0.8, inputVolume * 3)}>
                             <circle cx="70" cy="125" r="8" fill="#f43f5e" filter="url(#glow)" />
                             <circle cx="130" cy="125" r="8" fill="#f43f5e" filter="url(#glow)" />
                         </g>
                    )}
                </svg>
            </motion.div>
        </div>
    );
};

const LiveTutor: React.FC<Props> = ({ contextTopic, documentContext, analogyContent, standalone = false, onClose }) => {
  const [activePreset, setActivePreset] = useState<string>('professor');
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(PRESETS['professor'].avatar);
  const [teachingStyle, setTeachingStyle] = useState<TeachingStyle>(PRESETS['professor'].teaching);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED'>('DISCONNECTED');
  const [isMuted, setIsMuted] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputVolume, setInputVolume] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0); 
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [mousePos, setMousePos] = useState({x: 0, y: 0});
  
  const sessionRef = useRef<LiveSession | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({x: e.clientX, y: e.clientY});
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const togglePreset = (key: string) => {
      setActivePreset(key);
      setAvatarConfig(PRESETS[key].avatar);
      setTeachingStyle(PRESETS[key].teaching);
  };

  const getSystemPrompt = () => {
      let prompt = `You are a personalized AI tutor named ${PRESETS[activePreset]?.name || 'Tutor'}. `;
      if (teachingStyle.strictness > 80) prompt += "You are strict, academic, and precise. Correct any minor mistake instantly. ";
      else if (teachingStyle.strictness < 30) prompt += "You are extremely chill, casual, and supportive. Don't worry about technicalities, focus on the vibe. ";
      else prompt += "You are balanced and helpful. ";

      if (teachingStyle.memeLevel > 70) prompt += "Use internet slang (Gen Z), memes, and pop culture references constantly. Be funny. ";
      else if (teachingStyle.memeLevel > 30) prompt += "Occasionally use a lighthearted joke or reference. ";
      
      if (teachingStyle.verbosity < 40) prompt += "Be extremely concise. Short sentences only. ";
      else if (teachingStyle.verbosity > 80) prompt += "Be very detailed and lecture-like. ";

      if (documentContext) {
          prompt += `\n\nCONTEXT DOCUMENT:\n"${documentContext.substring(0, 5000)}"\n\nThe user is looking at this document. Base your answers on it.`;
      }

      if (analogyContent) {
          prompt += ` The user is focusing on "${contextTopic}". Explain this using the analogy: "${analogyContent.analogyTitle}" - "${analogyContent.analogyContent}".`;
      } else if (contextTopic) {
          prompt += ` The user is currently studying "${contextTopic}".`;
      } else {
          prompt += " Ask the user what they want to learn today. ";
      }
      prompt += " If the user shows you something on camera, analyze it visually.";
      return prompt;
  };

  const connect = async () => {
      try {
          // Clean up old session first if needed
          if (sessionRef.current) {
              sessionRef.current.disconnect();
          }

          const config: LiveConfig = {
              voiceName: activePreset === 'bro' ? 'Kore' : activePreset === 'socrates' ? 'Fenrir' : 'Puck',
              systemInstruction: getSystemPrompt()
          };
          
          // Re-init audio context if needed
          const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
          if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
              audioContextRef.current = new AudioContextClass();
          }
          await audioContextRef.current.resume();
          
          // Audio Graph Setup
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256; 
          gainNodeRef.current = audioContextRef.current.createGain();
          gainNodeRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
          
          nextStartTimeRef.current = audioContextRef.current.currentTime;

          const session = new LiveSession(
            config,
            (data) => queueAudio(data),
            (vol) => setInputVolume(vol),
            () => handleInterruption(),
            (role, text) => setTranscript(prev => [...prev, { role, text, timestamp: Date.now() }]),
            (err) => {
                // Ignore transient close errors if we are auto-reconnecting
                if (!err.message.includes('Connection lost')) {
                    setError(err.message);
                }
                if (err.message.includes('Connection lost')) {
                    // Let the LiveSession auto reconnect logic handle visuals via onConnectionChange
                }
            },
            (state) => {
                setConnectionState(state);
                setIsConnected(state === 'CONNECTED');
            }
          );
          
          await session.connect();
          sessionRef.current = session;
          startVisualizerLoop();
      } catch (e: any) {
          setError("Failed to connect: " + e.message);
          setIsConnected(false);
          setConnectionState('DISCONNECTED');
          setIsStarted(false);
      }
  };

  const disconnect = () => {
      sessionRef.current?.disconnect();
      setIsConnected(false);
      setConnectionState('DISCONNECTED');
      setInputVolume(0);
      setOutputLevel(0);
      activeSourcesRef.current.forEach(src => { try { src.stop(); } catch(e){} });
      activeSourcesRef.current = [];
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
          audioContextRef.current = null;
      }
  };

  const handleInterruption = () => {
      activeSourcesRef.current.forEach(src => { try { src.stop(); } catch(e){} });
      activeSourcesRef.current = [];
      if (audioContextRef.current) {
          nextStartTimeRef.current = audioContextRef.current.currentTime;
      }
      setOutputLevel(0); 
  };

  const queueAudio = (data: ArrayBuffer) => {
      if (!audioContextRef.current || !gainNodeRef.current) return;
      const ctx = audioContextRef.current;
      const float32Data = new Float32Array(new Int16Array(data).length);
      const int16 = new Int16Array(data);
      for(let i=0; i<int16.length; i++) float32Data[i] = int16[i]/32768.0;
      
      const buffer = ctx.createBuffer(1, float32Data.length, 24000);
      buffer.copyToChannel(float32Data, 0);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(gainNodeRef.current);

      const now = ctx.currentTime;
      const scheduleTime = Math.max(now, nextStartTimeRef.current);
      
      source.start(scheduleTime);
      nextStartTimeRef.current = scheduleTime + buffer.duration;
      activeSourcesRef.current.push(source);
      
      source.onended = () => {
          activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
      };
  };

  const startVisualizerLoop = () => {
      const loop = () => {
          if (!analyserRef.current || !audioContextRef.current) return;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for(let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          setOutputLevel(sum / dataArray.length); 
          requestAnimationFrame(loop);
      };
      loop();
  };

  const startSession = () => {
      setIsStarted(true);
      setError(null);
      connect();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        if (isConnected && !isConfiguring && sessionRef.current) {
             // Just update the session config if possible, but currently we need to reconnect to change sys prompt
             // To be safe, we disconnect and reconnect
             disconnect();
             connect();
        }
    }, 1500);
    return () => clearTimeout(timer);
  }, [teachingStyle, avatarConfig, activePreset, documentContext]);

  useEffect(() => { return () => disconnect(); }, []);

  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center">
        
        {/* --- ERROR TOAST --- */}
        <AnimatePresence>
            {error && (
                <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="absolute top-4 left-0 right-0 z-[100] flex justify-center">
                    <div className="bg-red-500/90 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm flex items-center gap-2">
                       <span>{error}</span>
                       <button onClick={() => { setError(null); disconnect(); }}><X size={12}/></button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- SETTINGS SIDEBAR (COLLAPSIBLE) --- */}
        <AnimatePresence>
            {isConfiguring && (
                <motion.div 
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    className="absolute top-4 right-4 bottom-24 w-72 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl z-[80] shadow-2xl flex flex-col pointer-events-auto"
                >
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Tutor Config</span>
                        <button onClick={() => setIsConfiguring(false)} className="text-slate-400 hover:text-white"><X size={16}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                        <div>
                             <label className="text-[10px] text-slate-400 uppercase font-bold mb-2 block">Presets</label>
                             <div className="flex gap-2 mb-4">
                                 {Object.keys(PRESETS).map(key => (
                                     <button key={key} onClick={() => togglePreset(key)} className={`px-2 py-1 rounded-md text-[10px] font-bold border ${activePreset === key ? 'bg-white text-slate-900 border-white' : 'border-slate-700 text-slate-400'}`}>
                                         {PRESETS[key].name}
                                     </button>
                                 ))}
                             </div>
                             
                             <label className="text-[10px] text-slate-400 uppercase font-bold mb-2 block">Avatar Style</label>
                             <div className="flex gap-2 mb-3">
                                 {SKIN_TONES.slice(0, 5).map(c => <button key={c} onClick={() => setAvatarConfig({...avatarConfig, skinTone: c})} className="w-6 h-6 rounded-full border border-white/10" style={{background: c}}/>)}
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                 {['glasses', 'headphones', 'hat', 'none'].map(s => (
                                     <button key={s} onClick={() => setAvatarConfig({...avatarConfig, accessory: s as any})} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border ${avatarConfig.accessory === s ? 'bg-primary-600 border-primary-500 text-white' : 'border-slate-700 text-slate-400'}`}>{s}</button>
                                 ))}
                             </div>
                        </div>
                        <div>
                             <label className="text-[10px] text-slate-400 uppercase font-bold mb-2 block">Personality</label>
                             <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>Strict</span><span>Chill</span></div>
                                    <input type="range" min="0" max="100" value={100 - teachingStyle.strictness} onChange={e => setTeachingStyle({...teachingStyle, strictness: 100 - parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-800 rounded-lg accent-primary-500"/>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>Academic</span><span>Memelord</span></div>
                                    <input type="range" min="0" max="100" value={teachingStyle.memeLevel} onChange={e => setTeachingStyle({...teachingStyle, memeLevel: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-800 rounded-lg accent-purple-500"/>
                                </div>
                             </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- MAIN AVATAR AREA --- */}
        <div className="relative z-10" onClick={() => !isStarted && startSession()}>
             <DigitalHumanAvatar 
                config={avatarConfig} 
                audioLevel={outputLevel} 
                inputVolume={inputVolume} 
                isStarted={isStarted} 
                isVideoOn={isVideoOn} 
                mousePos={mousePos}
             />
             
             {/* Status Badge */}
             {isStarted && (
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-max">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-lg backdrop-blur-md flex items-center gap-2 ${
                             connectionState === 'RECONNECTING' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                             connectionState === 'DISCONNECTED' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                             outputLevel > 10 ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                             inputVolume > 0.05 ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 
                             'bg-slate-900/50 text-slate-400 border-slate-700'
                         }`}
                    >
                        {connectionState === 'RECONNECTING' ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin"/> Attempting Reconnect...
                            </>
                        ) : connectionState === 'DISCONNECTED' ? (
                            <>
                                <WifiOff className="w-3 h-3"/> Offline
                            </>
                        ) : (
                            <>
                                <div className={`w-1.5 h-1.5 rounded-full ${outputLevel > 10 ? 'bg-green-400 animate-ping' : inputVolume > 0.05 ? 'bg-blue-400' : 'bg-slate-500'}`}></div>
                                {outputLevel > 10 ? 'Speaking' : inputVolume > 0.05 ? 'Listening' : 'Ready'}
                            </>
                        )}
                    </motion.div>
                 </div>
             )}

             {!isStarted && (
                 <motion.button 
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-slate-900 px-6 py-3 rounded-full font-bold shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] flex items-center gap-2 z-50 pointer-events-auto"
                 >
                     <Mic size={18}/> Start Session
                 </motion.button>
             )}

             {isStarted && connectionState === 'DISCONNECTED' && (
                 <motion.button 
                    onClick={() => connect()}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 z-50 pointer-events-auto"
                 >
                     <RefreshCw size={18}/> Reconnect
                 </motion.button>
             )}
        </div>

        {/* --- FLOATING CONTROL DOCK --- */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
             <motion.div 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl"
             >
                 {standalone && <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"><X size={18}/></button>}
                 
                 <div className="w-px h-6 bg-white/10 mx-1"></div>

                 <button onClick={() => setIsConfiguring(!isConfiguring)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isConfiguring ? 'bg-white text-slate-900' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                     <Settings size={18}/>
                 </button>

                 <button onClick={() => setIsMuted(!isMuted)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                     {isMuted ? <MicOff size={18}/> : <Mic size={18}/>}
                 </button>
                 
                 <button onClick={() => setIsVideoOn(!isVideoOn)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isVideoOn ? 'bg-green-500/20 text-green-400' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                     {isVideoOn ? <Video size={18}/> : <VideoOff size={18}/>}
                 </button>

                 <button onClick={() => { disconnect(); setIsStarted(false); onClose && onClose(); }} className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-900/20 ml-2">
                     <Power size={18}/>
                 </button>
             </motion.div>
        </div>
    </div>
  );
};

export default LiveTutor;