
import React, { useState } from 'react';
import { NoteSession } from '../../types';

interface DeskViewProps {
  session: NoteSession;
  onOpenBook: () => void;
}

const DeskView: React.FC<DeskViewProps> = ({ session, onOpenBook }) => {
  const [phase, setPhase] = useState<'IDLE' | 'OPENING' | 'FLIPPING' | 'ZOOMING'>('IDLE');

  const handleClick = () => {
      if (phase !== 'IDLE') return;

      // 1. Open Cover (Centers the spine)
      setPhase('OPENING');

      // 2. Flip Pages (Start shortly after cover opens)
      setTimeout(() => {
          setPhase('FLIPPING');
      }, 500);

      // 3. Zoom In (Focus on the Right Page)
      setTimeout(() => {
          setPhase('ZOOMING');
      }, 1400);

      // 4. Trigger App Load (When zoom fills screen)
      setTimeout(() => {
          onOpenBook();
      }, 2000);
  };

  return (
      <div className="min-h-screen bg-desktop bg-desktop-texture flex items-center justify-center p-8 overflow-hidden perspective-[2000px]">
          
          {/* Label */}
          <div className={`absolute top-8 left-8 text-stone-500 font-serif tracking-widest text-sm uppercase font-bold bg-white/50 backdrop-blur px-4 py-2 rounded-lg border border-white/40 transition-all duration-500 ${phase !== 'IDLE' ? 'opacity-0 -translate-y-4' : 'opacity-100'}`}>
              Workspace
          </div>

          {/* Book Container (This acts as the Right Page / Back Cover Base) */}
          <div 
            onClick={handleClick}
            className={`
                relative w-80 h-[450px] cursor-pointer transition-transform duration-[1000ms] ease-in-out [transform-style:preserve-3d]
                ${phase === 'IDLE' ? 'hover:[transform:rotateX(20deg)_rotateZ(-2deg)_scale(1.05)_translateY(-10px)]' : ''}
            `}
            style={{ 
                transform: phase === 'IDLE' 
                    ? 'rotateX(30deg) rotateZ(-5deg)' 
                    : phase === 'OPENING' || phase === 'FLIPPING' 
                        ? 'rotateX(0deg) rotateZ(0deg) translateX(50%)' // Shift right to center the spine
                        : 'rotateX(0deg) rotateZ(0deg) translateX(0%) scale(15)' // Shift back to center the right page and zoom
            }}
          >
              {/* SHADOW (Static base shadow) */}
              <div className={`absolute top-4 left-4 w-full h-full bg-black/20 blur-xl rounded-lg transition-all duration-1000 ${phase !== 'IDLE' ? 'opacity-0' : 'opacity-100'}`}></div>


              {/* 1. BACK COVER / RIGHT PAGE CONTENT (The Base) */}
              <div className="absolute inset-0 bg-[#fdfbf7] rounded-r-md border border-stone-200 shadow-xl flex items-center justify-center overflow-hidden">
                   {/* Paper Texture & Lines */}
                   <div className="absolute inset-0 bg-[linear-gradient(#e5e7eb_1px,transparent_1px)] bg-[length:100%_32px] bg-[position:0_24px]"></div>
                   <div className="absolute left-8 top-0 bottom-0 w-px bg-red-200/50"></div> {/* Margin line */}
                   
                   {/* Dummy Content (To simulate the app view) */}
                   <div className="p-12 pl-16 w-full h-full opacity-60">
                        <h2 className="font-serif font-bold text-3xl text-stone-800 mb-6 border-b-2 border-stone-800 pb-2">{session.title}</h2>
                        <div className="space-y-6">
                            <div className="h-4 bg-stone-200/50 rounded w-3/4"></div>
                            <div className="h-4 bg-stone-200/50 rounded w-full"></div>
                            <div className="h-4 bg-stone-200/50 rounded w-5/6"></div>
                            <div className="h-4 bg-stone-200/50 rounded w-4/5"></div>
                            <div className="h-32 border-2 border-dashed border-stone-200 rounded-lg mt-8 flex items-center justify-center">
                                <span className="text-stone-300 font-bold uppercase tracking-widest text-xs">Notes</span>
                            </div>
                        </div>
                   </div>
              </div>


              {/* 2. DYNAMIC PAGES (Flip from Right to Left) */}
              
              {/* Page 2 (Flips second) */}
              <div 
                  className={`absolute inset-0 bg-[#fdfbf7] rounded-r-md border-l border-stone-200 origin-left transition-transform duration-700 ease-in-out shadow-sm [transform-style:preserve-3d] z-20`}
                  style={{ 
                      transform: phase === 'FLIPPING' || phase === 'ZOOMING' ? 'rotateY(-176deg)' : 'rotateY(0deg)',
                      transitionDelay: '150ms'
                  }}
              >
                  <div className="absolute inset-0 [backface-visibility:hidden] bg-[#fdfbf7]">
                      <div className="absolute inset-0 bg-[linear-gradient(#e5e7eb_1px,transparent_1px)] bg-[length:100%_32px] bg-[position:0_24px]"></div>
                      <div className="absolute left-8 top-0 bottom-0 w-px bg-red-200/50"></div>
                  </div>
                  <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#f4ece0] shadow-inner"></div>
              </div>

              {/* Page 1 (Flips first) */}
              <div 
                  className={`absolute inset-0 bg-[#fdfbf7] rounded-r-md border-l border-stone-200 origin-left transition-transform duration-700 ease-in-out shadow-sm [transform-style:preserve-3d] z-30`}
                  style={{ 
                      transform: phase === 'FLIPPING' || phase === 'ZOOMING' ? 'rotateY(-178deg)' : 'rotateY(0deg)' 
                  }}
              >
                  <div className="absolute inset-0 [backface-visibility:hidden] bg-[#fdfbf7] flex items-center justify-center">
                       <div className="text-center opacity-30 rotate-3">
                           <div className="w-20 h-20 border-4 border-stone-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                               <span className="font-serif font-bold text-2xl text-stone-300">L</span>
                           </div>
                           <p className="font-serif font-bold text-stone-400 uppercase tracking-widest text-xs">Ex Libris</p>
                       </div>
                  </div>
                  <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#f4ece0] shadow-inner"></div>
              </div>


              {/* 3. FRONT COVER (Opens first) */}
              <div 
                  className={`absolute inset-0 bg-[#8c3b3b] rounded-r-xl rounded-l-md origin-left transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] [transform-style:preserve-3d] z-40 border-l-4 border-[#5a2626]`}
                  style={{ 
                      transform: phase !== 'IDLE' ? 'rotateY(-180deg)' : 'rotateY(0deg)' 
                  }}
              >
                  {/* Outer Cover (Front) */}
                  <div className="absolute inset-0 [backface-visibility:hidden] flex flex-col items-center p-8 border-r-4 border-[#5a2626]">
                        {/* Leather Texture */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-30 mix-blend-multiply pointer-events-none"></div>
                        
                        {/* Title Box */}
                        <div className="relative w-full bg-[#2d1b1b] mt-12 p-6 rounded-sm border-2 border-[#a66a6a] shadow-inner flex flex-col items-center justify-center">
                            <h1 className="text-[#fdfbf7] font-serif text-3xl font-bold tracking-widest uppercase drop-shadow-md text-center">{session.title}</h1>
                            <span className="text-[#8c3b3b] text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Vol. 1</span>
                        </div>
                        
                        <div className="mt-auto relative z-10">
                            <span className="text-[#5a2626] text-xs font-bold uppercase tracking-[0.3em] drop-shadow-sm border-t border-b border-[#5a2626]/30 py-1">Layman Notes</span>
                        </div>
                  </div>

                  {/* Inner Cover (Back) */}
                  <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#f4ece0] shadow-inner border-l-4 border-[#5a2626] flex items-end p-6">
                      <div className="opacity-40">
                          <p className="font-serif italic text-xs text-stone-500">Property of Student</p>
                          <div className="w-32 h-px bg-stone-400 mt-1"></div>
                      </div>
                  </div>
              </div>


              {/* 4. SPINE (Visual Only) */}
              <div className={`absolute top-0 bottom-0 left-0 w-8 bg-[#5a2626] -translate-x-full rounded-l-sm origin-right transition-transform duration-1000 ${phase !== 'IDLE' ? '[transform:rotateY(-90deg)]' : ''}`}></div>

          </div>
      </div>
  );
};

export default DeskView;
