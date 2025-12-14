
import React, { useState, useEffect, useRef } from 'react';
import { generateAudioScript } from '../services/geminiService';
import { AudioVibe, AudioPlaylist } from '../types';
import { Headphones, Zap, Coffee, Sparkles, Play, Pause, SkipForward, SkipBack, X, Radio } from 'lucide-react';

interface CommuteModalProps {
  notes: string;
  onClose: () => void;
}

const CommuteModal: React.FC<CommuteModalProps> = ({ notes, onClose }) => {
  const [stage, setStage] = useState<'SELECT' | 'LOADING' | 'PLAYING'>('SELECT');
  const [selectedVibe, setSelectedVibe] = useState<AudioVibe | null>(null);
  const [playlist, setPlaylist] = useState<AudioPlaylist | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop audio on unmount
  useEffect(() => {
      return () => {
          synthRef.current.cancel();
      }
  }, []);

  const handleVibeSelect = async (vibe: AudioVibe) => {
      setSelectedVibe(vibe);
      setStage('LOADING');
      try {
          const result = await generateAudioScript(notes, vibe);
          setPlaylist(result);
          setStage('PLAYING');
      } catch (e) {
          alert("Failed to generate audio script.");
          setStage('SELECT');
      }
  };

  const playTrack = (index: number) => {
      if (!playlist) return;
      
      // Cancel current
      synthRef.current.cancel();
      
      const track = playlist.tracks[index];
      const text = track.script.replace(/\[PAUSE\]/g, '. ').replace(/\[EMPHASIS\]/g, ''); // Simple cleanup for TTS
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Attempt to find a good voice
      const voices = synthRef.current.getVoices();
      const preferred = 
        voices.find(v => v.name.includes('Google UK English Female')) || 
        voices.find(v => v.name.includes('Google US English')) || 
        voices.find(v => v.lang === 'en-US');

      if (preferred) utterance.voice = preferred;
      
      utterance.rate = selectedVibe === 'HYPE_COACH' ? 1.1 : selectedVibe === 'ZEN_MASTER' ? 0.9 : 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => {
          if (index < playlist.tracks.length - 1) {
              setCurrentTrackIndex(index + 1);
              // Auto-play next track with small delay
              setTimeout(() => playTrack(index + 1), 1000);
          } else {
              setIsPlaying(false);
          }
      };

      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
      setIsPlaying(true);
  };

  const togglePlay = () => {
      if (isPlaying) {
          synthRef.current.pause();
          setIsPlaying(false);
      } else {
          if (synthRef.current.paused) {
              synthRef.current.resume();
          } else {
              playTrack(currentTrackIndex);
          }
          setIsPlaying(true);
      }
  };

  const nextTrack = () => {
      if (playlist && currentTrackIndex < playlist.tracks.length - 1) {
          const nextIdx = currentTrackIndex + 1;
          setCurrentTrackIndex(nextIdx);
          playTrack(nextIdx);
      }
  };

  const prevTrack = () => {
      if (currentTrackIndex > 0) {
          const prevIdx = currentTrackIndex - 1;
          setCurrentTrackIndex(prevIdx);
          playTrack(prevIdx);
      }
  };

  // --- VIBE SELECTION SCREEN ---
  if (stage === 'SELECT') {
      return (
          <div className="fixed inset-0 bg-stone-900/95 z-[200] flex flex-col items-center justify-center p-6 text-white animate-pop-in">
              <div className="w-full max-w-md">
                  <div className="flex items-center justify-between mb-8">
                      <div>
                          <h2 className="text-3xl font-bold font-serif tracking-tight flex items-center gap-3">
                              <Radio className="text-red-500 animate-pulse" /> Layman FM
                          </h2>
                          <p className="text-stone-400 text-sm mt-1">Your personal study radio station.</p>
                      </div>
                      <button onClick={onClose} className="p-2 bg-stone-800 rounded-full hover:bg-stone-700 transition-colors">
                          <X size={20} />
                      </button>
                  </div>

                  <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-4">Select your Vibe</h3>
                  
                  <div className="space-y-4">
                      <button 
                        onClick={() => handleVibeSelect('ZEN_MASTER')}
                        className="w-full bg-stone-800 p-6 rounded-2xl flex items-center gap-4 hover:bg-stone-700 hover:scale-[1.02] transition-all group border border-stone-700 hover:border-blue-400"
                      >
                          <div className="w-12 h-12 rounded-full bg-blue-900/50 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                              <Coffee size={24} className="text-blue-300 group-hover:text-white" />
                          </div>
                          <div className="text-left">
                              <h4 className="font-bold text-lg">Zen Master</h4>
                              <p className="text-xs text-stone-400">Deep dive. Calm. Repetitive definitions.</p>
                          </div>
                      </button>

                      <button 
                        onClick={() => handleVibeSelect('HYPE_COACH')}
                        className="w-full bg-stone-800 p-6 rounded-2xl flex items-center gap-4 hover:bg-stone-700 hover:scale-[1.02] transition-all group border border-stone-700 hover:border-yellow-400"
                      >
                          <div className="w-12 h-12 rounded-full bg-yellow-900/50 flex items-center justify-center group-hover:bg-yellow-500 transition-colors">
                              <Zap size={24} className="text-yellow-300 group-hover:text-white" />
                          </div>
                          <div className="text-left">
                              <h4 className="font-bold text-lg">Hype Coach</h4>
                              <p className="text-xs text-stone-400">High energy. Rapid fire. High yield facts only.</p>
                          </div>
                      </button>

                      <button 
                        onClick={() => handleVibeSelect('THE_GOSSIP')}
                        className="w-full bg-stone-800 p-6 rounded-2xl flex items-center gap-4 hover:bg-stone-700 hover:scale-[1.02] transition-all group border border-stone-700 hover:border-pink-400"
                      >
                          <div className="w-12 h-12 rounded-full bg-pink-900/50 flex items-center justify-center group-hover:bg-pink-500 transition-colors">
                              <Sparkles size={24} className="text-pink-300 group-hover:text-white" />
                          </div>
                          <div className="text-left">
                              <h4 className="font-bold text-lg">The Gossip</h4>
                              <p className="text-xs text-stone-400">Conversational. Story-driven. Drama.</p>
                          </div>
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- LOADING SCREEN ---
  if (stage === 'LOADING') {
      return (
          <div className="fixed inset-0 bg-stone-900 z-[200] flex flex-col items-center justify-center text-white">
              <div className="w-24 h-24 border-4 border-stone-800 border-t-white rounded-full animate-spin mb-6"></div>
              <h2 className="text-2xl font-bold font-serif animate-pulse">Producing Show...</h2>
              <p className="text-stone-500 mt-2">Writing script for {selectedVibe?.replace('_', ' ')}</p>
          </div>
      );
  }

  // --- PLAYER SCREEN ---
  return (
      <div className="fixed inset-0 bg-black z-[200] flex flex-col text-white animate-pop-in">
          {/* Header */}
          <div className="p-6 flex justify-between items-center">
              <div className="text-xs font-bold uppercase tracking-widest text-stone-500 bg-stone-900 px-3 py-1 rounded-full">
                  On Air • {playlist?.vibe_used}
              </div>
              <button onClick={() => { synthRef.current.cancel(); onClose(); }} className="p-2 hover:bg-stone-900 rounded-full transition-colors">
                  <X size={24} className="text-stone-400" />
              </button>
          </div>

          {/* Album Art / Visualizer */}
          <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className={`w-64 h-64 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.1)] flex items-center justify-center mb-8 transition-colors duration-1000 ${
                  isPlaying ? 'bg-gradient-to-br from-stone-800 to-black animate-pulse-slow' : 'bg-stone-900'
              }`}>
                  <Headphones size={80} className={`text-stone-700 ${isPlaying ? 'animate-bounce-slight' : ''}`} />
              </div>

              <div className="text-center max-w-md">
                  <h2 className="text-2xl font-bold font-serif mb-2 leading-tight">{playlist?.tracks[currentTrackIndex].title}</h2>
                  <p className="text-stone-500 text-sm font-bold uppercase tracking-widest">{playlist?.playlist_title}</p>
              </div>
          </div>

          {/* Controls */}
          <div className="p-8 pb-12 bg-gradient-to-t from-stone-900 to-transparent">
              {/* Progress Bar (Visual Only) */}
              <div className="w-full h-1 bg-stone-800 rounded-full mb-8 overflow-hidden">
                  <div className={`h-full bg-white transition-all duration-300 ${isPlaying ? 'w-full animate-[width_10s_linear]' : 'w-0'}`}></div>
              </div>

              <div className="flex items-center justify-between max-w-sm mx-auto">
                  <button onClick={prevTrack} disabled={currentTrackIndex === 0} className="text-stone-400 hover:text-white disabled:opacity-30 transition-colors">
                      <SkipBack size={32} />
                  </button>

                  <button 
                    onClick={togglePlay}
                    className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                  >
                      {isPlaying ? <Pause size={32} fill="black" /> : <Play size={32} fill="black" className="ml-2" />}
                  </button>

                  <button onClick={nextTrack} disabled={!playlist || currentTrackIndex === playlist.tracks.length - 1} className="text-stone-400 hover:text-white disabled:opacity-30 transition-colors">
                      <SkipForward size={32} />
                  </button>
              </div>
          </div>
      </div>
  );
};

export default CommuteModal;
    