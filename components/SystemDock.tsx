
import React from 'react';
import { StickyNote, GraduationCap, BookOpen, Headphones, Link as LinkIcon, Sparkles } from 'lucide-react';

interface SystemDockProps {
  onAction: (action: 'autopilot' | 'insights' | 'test' | 'revision' | 'commute' | 'share') => void;
  stagingCount: number;
}

const SystemDock: React.FC<SystemDockProps> = ({ onAction, stagingCount }) => {
  const tools = [
    { id: 'autopilot', icon: Sparkles, label: 'Autopilot', color: 'text-indigo-600' },
    { id: 'insights', icon: StickyNote, label: 'Staging Area', color: 'text-yellow-600', badge: stagingCount },
    { divider: true },
    { id: 'test', icon: GraduationCap, label: 'Test Me', color: 'text-stone-600' },
    { id: 'revision', icon: BookOpen, label: 'Revision', color: 'text-indigo-500' },
    { id: 'commute', icon: Headphones, label: 'Commute', color: 'text-stone-600' },
    { divider: true },
    { id: 'share', icon: LinkIcon, label: 'Share', color: 'text-stone-400' },
  ];

  return (
    <div className={`
        fixed z-40 flex gap-3 bg-white/95 border border-white/40 shadow-xl p-2 transition-all animate-pop-in
        
        /* Desktop & Tablet: Vertical on Right */
        md:flex-col md:top-32 md:right-4 md:left-auto md:bottom-auto md:translate-x-0 md:rounded-2xl md:w-auto md:max-w-none md:overflow-visible
        xl:right-auto xl:left-[calc(50%+440px)]
        
        /* Mobile: Horizontal at Bottom, Scrollable container */
        flex-row bottom-6 left-4 right-4 rounded-2xl overflow-x-auto justify-between md:justify-start
        no-scrollbar
    `}>
      {tools.map((item, idx) => {
        if (item.divider) return <div key={`div-${idx}`} className="bg-stone-300/50 md:h-px md:w-full md:my-1 w-px h-6 mx-1 self-center shrink-0" />;
        
        const Icon = item.icon as any;
        return (
          <button
            key={item.id}
            onClick={() => onAction(item.id as any)}
            className="relative group p-3 rounded-xl hover:bg-white hover:shadow-md transition-all flex items-center justify-center shrink-0"
          >
            <Icon size={20} className={item.color} />
            
            {/* Tooltip: Responsive Placement */}
            <div className={`
                absolute bg-stone-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity border border-stone-700 z-50
                
                /* Desktop/Tablet: Left of button */
                md:right-full md:mr-4 md:top-1/2 md:-translate-y-1/2 md:left-auto md:bottom-auto md:mb-0 md:translate-x-0
                
                /* Mobile: Above button */
                bottom-full mb-3 left-1/2 -translate-x-1/2
            `}>
              <div className="px-2 py-1">{item.label}</div>
              
              {/* Arrow */}
              <div className={`
                  absolute w-2 h-2 bg-stone-800 rotate-45
                  
                  /* Desktop/Tablet: Pointing Right */
                  md:-right-1 md:top-1/2 md:-translate-y-1/2 md:bottom-auto md:left-auto md:translate-x-0
                  
                  /* Mobile: Pointing Down */
                  -bottom-1 left-1/2 -translate-x-1/2
              `}></div>
            </div>

            {/* Badge */}
            {item.badge ? (
               <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full shadow-sm border border-white">
                   {item.badge}
               </span>
            ) : null}
          </button>
        );
      })}
      
      {/* Inline Styles for hiding scrollbar */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default SystemDock;
