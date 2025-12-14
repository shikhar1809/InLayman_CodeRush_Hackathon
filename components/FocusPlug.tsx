
import React from 'react';

interface FocusPlugProps {
  connected: boolean;
  onToggle: () => void;
}

const FocusPlug: React.FC<FocusPlugProps> = ({ connected, onToggle }) => {
  return (
    <>
      {/* --- DESKTOP VIEW: The Cord & Plug --- */}
      <div className="hidden lg:block">
          {/* LAYER 1: The Cord - Bottom Position */}
          <div className="fixed bottom-8 right-28 w-14 h-auto pointer-events-none z-10">
            <svg 
              className="absolute overflow-visible" 
              style={{ bottom: 0, left: 0, width: '1px', height: '1px' }}
            >
              <defs>
                <filter id="cord-shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.3"/>
                </filter>
              </defs>
              
              <path 
                  d={connected 
                      ? "M 26 -36 C 26 -150, -100 -400, -600 -900" 
                      : "M 26 -130 C 26 -250, -50 -450, -600 -900" 
                  }
                  fill="none"
                  stroke="#292524" // Stone 800
                  strokeWidth="8"
                  strokeLinecap="round"
                  filter="url(#cord-shadow)"
                  className="transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              />
              
              <path 
                   d={connected 
                      ? "M 26 -36 C 26 -150, -100 -400, -600 -900" 
                      : "M 26 -130 C 26 -250, -50 -450, -600 -900" 
                  }
                  fill="none"
                  stroke="#57534e" // Stone 600
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] opacity-40"
                  style={{ transform: 'translate(-1px, -1px)' }}
              />
            </svg>
          </div>

          {/* LAYER 2: The Socket & Plug */}
          <div className="fixed bottom-8 right-28 w-14 h-auto pointer-events-none z-50">
              
            {/* Wall Socket Plate */}
            <div className="relative w-14 h-20 bg-[#e5e5e5] rounded-lg border border-stone-300 shadow-sm flex flex-col items-center justify-between py-3 select-none pointer-events-auto">
                <div className="w-2 h-2 rounded-full bg-stone-400 border border-stone-500/30 flex items-center justify-center">
                   <div className="w-full h-px bg-stone-500 rotate-45"></div>
                </div>
                
                <div className="w-10 h-10 rounded-full bg-[#d4d4d4] border border-stone-300/50 flex flex-col items-center justify-center gap-1 shadow-inner">
                   <div className="flex gap-1.5">
                      <div className="w-1.5 h-3 bg-stone-800 rounded-sm"></div>
                      <div className="w-1.5 h-3 bg-stone-800 rounded-sm"></div>
                   </div>
                   <div className="w-2 h-2 bg-stone-800 rounded-full mt-0.5 rounded-t-none"></div>
                </div>

                <div className="w-2 h-2 rounded-full bg-stone-400 border border-stone-500/30 flex items-center justify-center">
                    <div className="w-full h-px bg-stone-500 rotate-12"></div>
                </div>
            </div>

            {/* The Plug Head */}
            <div 
              onClick={onToggle}
              className={`absolute left-[2px] w-[52px] h-14 bg-stone-800 rounded-b-md rounded-t-xl cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col-reverse items-center border-b border-stone-600 shadow-2xl pointer-events-auto group
                  ${connected ? 'bottom-3' : 'bottom-32 rotate-[10deg] hover:rotate-[5deg]'}
              `}
              title={connected ? "Unplug to Focus" : "Plug in for Smart Features"}
            >
                <div className={`absolute -bottom-1 right-2 w-1.5 h-1.5 rounded-full z-20 transition-all duration-500 ${connected ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-red-900'}`}></div>

                <div className="w-full flex justify-center gap-2 mb-3 opacity-20">
                   <div className="w-1 h-6 bg-white rounded-full"></div>
                   <div className="w-1 h-6 bg-white rounded-full"></div>
                   <div className="w-1 h-6 bg-white rounded-full"></div>
                </div>

                <div className="absolute -top-2 w-6 h-5 bg-stone-800 rounded-t-lg"></div>

                {!connected && (
                   <div className="absolute right-full mr-4 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                       <span className="bg-stone-800 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl border border-stone-700">
                           Enable Smart Features
                       </span>
                       <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-stone-800"></div>
                   </div>
                )}
            </div>

          </div>
      </div>

      {/* --- TABLET/MOBILE VIEW: The Light Switch --- */}
      <div className="lg:hidden fixed bottom-32 left-6 z-[60]">
         <div 
            onClick={onToggle}
            className="relative w-16 h-24 bg-[#f8f8f8] rounded-lg border border-stone-300 shadow-xl flex flex-col items-center justify-between py-3 cursor-pointer active:scale-95 transition-transform select-none"
         >
             {/* Top Screw */}
             <div className="w-2 h-2 rounded-full bg-stone-300 flex items-center justify-center shadow-inner opacity-70"><div className="w-full h-px bg-stone-400 rotate-45"></div></div>
             
             {/* Switch Mechanism */}
             <div className="relative w-6 h-10 bg-stone-200 rounded border border-stone-300 shadow-inner flex items-center justify-center overflow-hidden">
                <div className={`absolute w-full h-1/2 bg-white border-b border-stone-300 shadow-sm transition-all duration-200 ease-out ${connected ? 'top-0' : 'top-1/2 bg-stone-100 shadow-inner'}`}>
                </div>
             </div>

             {/* Bottom Screw */}
             <div className="w-2 h-2 rounded-full bg-stone-300 flex items-center justify-center shadow-inner opacity-70"><div className="w-full h-px bg-stone-400 rotate-12"></div></div>
             
             {/* Status LED */}
             <div className={`absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full transition-colors duration-500 ${connected ? 'bg-green-400 shadow-[0_0_5px_#4ade80]' : 'bg-red-400/20'}`}></div>
         </div>
         <p className="text-[9px] font-bold text-stone-400 text-center mt-2 uppercase tracking-widest opacity-80">Focus</p>
      </div>
    </>
  );
};

export default FocusPlug;
