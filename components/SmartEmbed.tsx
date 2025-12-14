import React, { useState } from 'react';
import { Link2, LayoutTemplate, Minimize, Smile } from 'lucide-react';

interface SmartEmbedProps {
  url: string;
  type?: 'sticker' | 'card' | 'embed' | 'emoji';
  emoji?: string;
  onUpdateType: (type: 'sticker' | 'card' | 'embed' | 'emoji') => void;
}

const SmartEmbed: React.FC<SmartEmbedProps> = ({ url, type = 'sticker', emoji = '🔗', onUpdateType }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const domain = new URL(url).hostname.replace('www.', '');
  const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  return (
    <div className="relative group inline-block" onMouseEnter={() => setShowMenu(true)} onMouseLeave={() => setShowMenu(false)}>
      
      {/* 1. Sticker Mode */}
      {type === 'sticker' && (
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-white px-2 py-1 rounded-full border border-stone-200 shadow-sm hover:shadow-md transition-all no-underline mx-1 align-middle">
           <img src={favicon} alt="" className="w-4 h-4 rounded-sm" />
           <span className="text-xs font-bold text-stone-500">{domain}</span>
        </a>
      )}

      {/* 2. Card Mode */}
      {type === 'card' && (
         <div className="w-64 bg-white rounded-lg shadow-md border border-stone-200 overflow-hidden my-2">
            <div className="h-32 bg-stone-100 flex items-center justify-center text-stone-300">
                <LayoutTemplate size={32} />
            </div>
            <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                    <img src={favicon} alt="" className="w-4 h-4" />
                    <span className="text-[10px] uppercase text-stone-400 font-bold">{domain}</span>
                </div>
                <a href={url} target="_blank" rel="noreferrer" className="block text-sm font-bold text-ink leading-tight hover:underline truncate">
                    {url}
                </a>
            </div>
         </div>
      )}

      {/* 3. Embed Mode (Mock) */}
      {type === 'embed' && (
          <div className="w-full aspect-video bg-black rounded-lg overflow-hidden my-2 shadow-lg relative">
              <iframe src={url} className="w-full h-full border-none" title="Embed"></iframe>
              <div className="absolute inset-0 pointer-events-none border-2 border-white/10 rounded-lg"></div>
          </div>
      )}

      {/* 4. Emoji Anchor Mode */}
      {type === 'emoji' && (
          <a 
            href={url} 
            target="_blank" 
            rel="noreferrer" 
            className="text-4xl hover:scale-110 transition-transform no-underline inline-block drop-shadow-md cursor-pointer" 
            title={url}
          >
              {emoji}
          </a>
      )}

      {/* Toggle Menu */}
      {showMenu && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-stone-800 text-white rounded-full p-1 flex gap-1 shadow-xl z-50 animate-pop-in">
              <button onClick={() => onUpdateType('emoji')} className={`p-1.5 rounded-full hover:bg-stone-600 ${type === 'emoji' ? 'bg-stone-600' : ''}`} title="Emoji Anchor">
                  <Smile size={12} />
              </button>
              <button onClick={() => onUpdateType('sticker')} className={`p-1.5 rounded-full hover:bg-stone-600 ${type === 'sticker' ? 'bg-stone-600' : ''}`} title="Sticker">
                  <Minimize size={12} />
              </button>
              <button onClick={() => onUpdateType('card')} className={`p-1.5 rounded-full hover:bg-stone-600 ${type === 'card' ? 'bg-stone-600' : ''}`} title="Card">
                  <LayoutTemplate size={12} />
              </button>
              <button onClick={() => onUpdateType('embed')} className={`p-1.5 rounded-full hover:bg-stone-600 ${type === 'embed' ? 'bg-stone-600' : ''}`} title="Embed">
                  <Link2 size={12} />
              </button>
          </div>
      )}
    </div>
  );
};

export default SmartEmbed;