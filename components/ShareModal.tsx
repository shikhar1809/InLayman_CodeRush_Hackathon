
import React, { useState } from 'react';
import { Copy, Globe, Lock, Mail, Check, X, Link as LinkIcon } from 'lucide-react';

interface ShareModalProps {
  notebookTitle: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ notebookTitle, onClose }) => {
  const [accessType, setAccessType] = useState<'public' | 'restricted'>('public');
  const [email, setEmail] = useState('');
  const [invited, setInvited] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Fix: Generate link once per mount, not every render
  const [shareLink] = useState(() => 
    `https://layman.ai/n/${notebookTitle.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 5)}`
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setInvited([...invited, email]);
      setEmail('');
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#fdfbf7] w-full max-w-md rounded-xl shadow-2xl border border-stone-200 overflow-hidden animate-pop-in">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-white/50">
          <div className="flex items-center gap-2">
             <div className="bg-stone-200 p-2 rounded-full text-stone-600">
                <LinkIcon size={18} />
             </div>
             <div>
                <h3 className="font-serif font-bold text-lg text-stone-800">Share Notebook</h3>
                <p className="text-xs text-stone-400 font-sans">"{notebookTitle}"</p>
             </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Access Toggle */}
          <div className="flex bg-stone-100 p-1 rounded-lg">
             <button 
                onClick={() => setAccessType('public')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${accessType === 'public' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
             >
                <Globe size={14} /> Anyone with link
             </button>
             <button 
                onClick={() => setAccessType('restricted')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${accessType === 'restricted' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
             >
                <Lock size={14} /> Restricted
             </button>
          </div>

          {/* Dynamic Content based on Access Type */}
          {accessType === 'public' ? (
             <div className="space-y-3 animate-pop-in">
                 <p className="text-xs text-stone-500 ml-1">Anyone on the internet with this link can view.</p>
                 <div className="flex gap-2">
                     <div className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-600 font-mono truncate select-all">
                         {shareLink}
                     </div>
                     <button 
                        onClick={handleCopy}
                        className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-stone-800 text-white hover:bg-stone-700'}`}
                     >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied' : 'Copy'}
                     </button>
                 </div>
             </div>
          ) : (
             <div className="space-y-4 animate-pop-in">
                 <p className="text-xs text-stone-500 ml-1">Only people added below can access.</p>
                 
                 <form onSubmit={handleInvite} className="flex gap-2">
                    <div className="flex-1 relative">
                        <Mail size={16} className="absolute left-3 top-3 text-stone-400" />
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Add email address..."
                            className="w-full bg-white border border-stone-200 rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:border-stone-400"
                        />
                    </div>
                    <button type="submit" className="bg-stone-200 text-stone-700 font-bold text-xs px-4 rounded-lg hover:bg-stone-300">
                        Invite
                    </button>
                 </form>

                 {invited.length > 0 && (
                     <div className="border-t border-stone-100 pt-3">
                         <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Access List</p>
                         <ul className="space-y-2">
                             {invited.map((inv, i) => (
                                 <li key={i} className="flex items-center justify-between text-sm text-stone-600 bg-stone-50 p-2 rounded">
                                     <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                            {inv[0].toUpperCase()}
                                        </div>
                                        {inv}
                                     </div>
                                     <span className="text-xs text-stone-400">Viewer</span>
                                 </li>
                             ))}
                         </ul>
                     </div>
                 )}
                 
                 <div className="flex gap-2 opacity-50 pointer-events-none grayscale">
                      {/* Disabled link copy for restricted mode UI demo */}
                      <div className="flex-1 bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-400 font-mono truncate">
                         {shareLink}
                     </div>
                     <button className="bg-stone-200 text-stone-400 px-4 py-2 rounded-lg font-bold text-sm">Copy</button>
                 </div>
             </div>
          )}

        </div>
        
        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
            <button onClick={onClose} className="text-stone-500 font-bold text-sm hover:text-stone-800">Done</button>
        </div>

      </div>
    </div>
  );
};

export default ShareModal;
