
import React, { useState } from 'react';
import { Music2, Play, Pause, SkipForward, SkipBack, X, Link as LinkIcon, Wifi, Volume2, Disc } from 'lucide-react';

const MusicPlayer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState('https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn'); // Default Lofi
  const [isPlaying, setIsPlaying] = useState(false); // Simulated state
  
  // Extract Spotify Embed URL
  const getSpotifyEmbedUrl = (url: string) => {
      try {
        const urlObj = new URL(url);
        // Ensure embed format
        if (urlObj.pathname.includes('/embed')) return url;
        return `https://open.spotify.com/embed${urlObj.pathname}${urlObj.search}`;
      } catch (e) {
          return url;
      }
  };

  const handleConnect = (e: React.FormEvent) => {
      e.preventDefault();
      if (spotifyUrl.includes('spotify.com')) {
          setIsConnected(true);
          setIsPlaying(true); // Simulate auto-play on connect
      } else {
          alert("Please enter a valid Spotify URL");
      }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <div className={`fixed bottom-4 left-4 z-50 transition-all duration-500 ease-spring ${isOpen ? 'w-80' : 'w-12'} h-auto`}>
      
      {/* Closed State (Compact Pill) */}
      {!isOpen && (
          <button 
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-stone-600 hover:scale-110 transition-transform border border-stone-200 group"
          >
              <Music2 size={20} className={`group-hover:text-stone-900 transition-colors ${isConnected ? 'animate-pulse' : ''}`} />
          </button>
      )}

      {/* Open State (Modern Player UI) */}
      {isOpen && (
          <div className="bg-stone-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-pop-in text-white border border-stone-800">
             
             {/* Header */}
             <div className="bg-black/30 p-3 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Disc size={14} className={isPlaying ? "animate-spin-slow" : ""} />
                    <span className="font-bold text-[10px] tracking-widest text-stone-400">AUDIO ENGINE</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                    <X size={14} />
                </button>
             </div>

             {/* Content Area */}
             <div className="p-0">
                {!isConnected ? (
                    <div className="p-4 flex flex-col items-center text-center">
                         <div className="w-12 h-12 bg-stone-800 rounded-full flex items-center justify-center mb-3 shadow-inner">
                             <Wifi size={20} className="text-stone-500" />
                         </div>
                         <p className="text-[10px] text-stone-400 mb-4">Paste Spotify URL for study vibes.</p>
                         
                         <form onSubmit={handleConnect} className="w-full space-y-2">
                             <div className="relative">
                                 <LinkIcon size={12} className="absolute left-3 top-2.5 text-stone-500"/>
                                 <input 
                                    type="text" 
                                    value={spotifyUrl}
                                    onChange={(e) => setSpotifyUrl(e.target.value)}
                                    placeholder="https://open.spotify.com/..."
                                    className="w-full bg-stone-800 border border-stone-700 rounded pl-8 pr-2 py-1.5 text-[10px] text-white focus:border-stone-500 outline-none transition-colors font-mono"
                                 />
                             </div>
                             <button type="submit" className="w-full bg-white text-black font-bold text-[10px] py-2 rounded hover:bg-stone-200 transition-colors uppercase tracking-wide">
                                 Connect
                             </button>
                         </form>
                    </div>
                ) : (
                    <div className="animate-pop-in">
                        {/* The Actual Embed */}
                        <div className="w-full h-[80px] bg-black">
                             <iframe 
                                src={getSpotifyEmbedUrl(spotifyUrl)} 
                                width="100%" 
                                height="80" 
                                frameBorder="0" 
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                                loading="lazy"
                                title="Spotify"
                            ></iframe>
                        </div>

                        {/* Custom Control Bar */}
                        <div className="bg-stone-900 p-3 flex items-center justify-between gap-2 border-t border-white/5">
                             <div className="flex items-center gap-3">
                                 <button onClick={togglePlay} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform">
                                     {isPlaying ? <Pause size={12} fill="black" /> : <Play size={12} fill="black" className="ml-0.5"/>}
                                 </button>
                                 <div className="flex flex-col">
                                     <span className="text-[10px] font-bold text-white leading-tight">Study Mix</span>
                                     <span className="text-[9px] text-stone-500">Connected</span>
                                 </div>
                             </div>
                             
                             <button 
                                onClick={() => setIsConnected(false)}
                                className="text-[9px] text-stone-500 hover:text-stone-300 transition-colors uppercase tracking-wider"
                            >
                                Eject
                            </button>
                        </div>
                    </div>
                )}
             </div>

          </div>
      )}
    </div>
  );
};

export default MusicPlayer;
