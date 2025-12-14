
import React, { useState } from 'react';
import { NoteSession, ViewState, ContentBlock } from './types';
import Avatar from './components/Avatar';
import MusicPlayer from './components/MusicPlayer';
import DeskView from './components/views/DeskView';
import ShelfView from './components/views/ShelfView';
import NotebookView from './components/views/NotebookView';
import { generateId } from './utils';
import { Loader2, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';

const INITIAL_SESSION: NoteSession = {
  id: generateId(),
  title: 'Layman 101',
  goal_context: { objective: '', status: 'Not Started', deadline: '' },
  content_blocks: [
    { 
      id: generateId(), 
      type: 'text', 
      content: 'Mitochondria are membrane-bound cell organelles that generate most of the chemical energy needed to power the cell\'s biochemical reactions.', 
      ai_generated: false, 
      meta_tags: [],
    }
  ],
  visual_style: { paper_texture: 'cream_rough', font: 'serif_handwriting' },
  sketches: []
};

// Global Loader Component
const GlobalLoader = ({ active, message }: { active: boolean, message: string }) => (
    <div className={`fixed top-0 left-0 w-full z-[9999] transition-all duration-300 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
        <div className="w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient-x"></div>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-stone-900/90 text-white backdrop-blur-md px-6 py-2 rounded-full shadow-lg flex items-center gap-3">
             <Loader2 size={16} className="animate-spin text-white" />
             <span className="text-xs font-bold uppercase tracking-widest">{message}</span>
        </div>
        <style>{`
            @keyframes gradient-x {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            .animate-gradient-x {
                background-size: 200% 200%;
                animation: gradient-x 2s ease infinite;
            }
        `}</style>
    </div>
);

// Toast Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
    <div className={`fixed top-8 left-1/2 -translate-x-1/2 text-white px-6 py-3 rounded-full shadow-2xl z-[200] animate-pop-in flex items-center gap-3 ${type === 'success' ? 'bg-stone-900' : 'bg-red-600'}`}>
        {type === 'success' ? <CheckCircle2 size={16} className="text-green-400" /> : <AlertCircle size={16} className="text-white" />}
        <span className="text-sm font-bold">{message}</span>
    </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('DESK');
  const [session, setSession] = useState<NoteSession>(INITIAL_SESSION);
  const [stagingBlocks, setStagingBlocks] = useState<ContentBlock[]>([]);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [globalLoading, setGlobalLoading] = useState<{ active: boolean, message: string }>({ active: false, message: '' });
  const [wingerMessage, setWingerMessage] = useState<string | null>(null);
  
  // Shelf Groups State (Global)
  const [shelfGroups, setShelfGroups] = useState([
    {
        id: 'g1', title: 'Current Semester',
        notebooks: [
            { id: '1', title: 'Biology 101', color: '#8c3b3b', updated: 'Today' },
            { id: '2', title: 'World History', color: '#3b5c8c', updated: 'Yesterday' },
        ]
    },
    {
        id: 'g2', title: 'Personal Projects',
        notebooks: [
            { id: '3', title: 'React.js Mastery', color: '#2d2a2e', updated: 'Last Week' },
            { id: '4', title: 'French Poetry', color: '#8c3b7a', updated: '2 days ago' },
        ]
    }
  ]);

  // Auth/Splash State
  const [showSplash, setShowSplash] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [splashPhase, setSplashPhase] = useState<'IDLE' | 'ANIMATING' | 'LOADING' | 'AUTH' | 'DONE'>('IDLE');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };
  
  const startLoading = (message: string) => setGlobalLoading({ active: true, message });
  const stopLoading = () => setGlobalLoading({ active: false, message: '' });

  // --- SPLASH LOGIC (Simplified for App.tsx clarity) ---
  const handleOpenBook = () => {
    setShowSplash(true);
    setSplashPhase('LOADING');
    // Fake loading sequence
    let p = 0;
    const interval = setInterval(async () => {
        p += 5;
        setLoadingProgress(p);
        if (p >= 100) {
            clearInterval(interval);
            // Auth check simulation
            if ((window as any).aistudio) {
                const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                if (!hasKey) { setSplashPhase('AUTH'); return; }
            }
            finishLoading();
        }
    }, 50);
  };

  const finishLoading = () => {
      setSplashPhase('DONE');
      setTimeout(() => {
          setView('SHELF');
          setShowSplash(false);
          setSplashPhase('IDLE');
      }, 500);
  };

  const handleSignIn = async () => {
    if ((window as any).aistudio) {
        try { await (window as any).aistudio.openSelectKey(); finishLoading(); } catch(e) { console.error(e); }
    } else { finishLoading(); }
  };

  const handleOpenNotebook = (notebook: { title: string }) => {
      setSession({ ...INITIAL_SESSION, id: generateId(), title: notebook.title, content_blocks: JSON.parse(JSON.stringify(INITIAL_SESSION.content_blocks)).map((b: any) => ({...b, id: generateId()})), goal_context: { ...INITIAL_SESSION.goal_context, objective: '' }, });
      setView('COVER');
      setTimeout(() => setView('NOTEBOOK'), 500);
  };

  // Avatar Context Helpers
  const getAvatarContext = () => {
    if (view === 'DESK') return "User is at their desk workspace. Options: Open Bookshelf.";
    if (view === 'SHELF') return `User is browsing the bookshelf. Active Groups: ${shelfGroups.map(g => g.title).join(', ')}.`;
    return session.grounding_context?.raw_text || "User is working in a notebook.";
  };

  const getAvatarFocus = () => {
     if (view === 'DESK') return "Workspace Overview";
     if (view === 'SHELF') return "Bookshelf Selection";
     return session.title;
  }

  const isNotebookView = view !== 'DESK' && view !== 'SHELF';

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <GlobalLoader active={globalLoading.active} message={globalLoading.message} />

      {/* Splash/Auth Overlay */}
      {showSplash && (
          // Updated: Matches the "Paper Cream" (#fdfbf7) of the zoomed-in notebook page
          <div className={`fixed inset-0 z-[100] bg-[#fdfbf7] flex flex-col items-center justify-center transition-opacity duration-500 ${splashPhase === 'DONE' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              
              {/* Paper Lines Overlay for Texture Matching */}
              <div className="absolute inset-0 bg-[linear-gradient(#e5e7eb_1px,transparent_1px)] bg-[length:100%_32px] bg-[position:0_24px] opacity-100 pointer-events-none"></div>

              <h1 className="font-serif text-6xl font-bold text-stone-800 mb-12 tracking-tighter animate-pop-in relative z-10 drop-shadow-sm">InLayman</h1>
              
              {splashPhase === 'LOADING' && (
                  <div className="w-64 animate-pop-in relative z-10">
                      <div className="h-1 bg-stone-200 rounded-full overflow-hidden border border-stone-300">
                          <div className="h-full bg-stone-800 transition-all duration-300 ease-out" style={{ width: `${loadingProgress}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center mt-3 text-stone-400">
                          <p className="text-[10px] font-mono uppercase tracking-widest">Loading Workspace...</p>
                          <span className="text-[10px] font-bold">{loadingProgress}%</span>
                      </div>
                  </div>
              )}
              {splashPhase === 'AUTH' && (
                  <div className="animate-pop-in text-center p-8 max-w-sm relative z-10 bg-white rounded-xl shadow-2xl border border-stone-200">
                      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6"><LogIn size={24} className="text-stone-400" /></div>
                      <h3 className="text-xl font-bold text-stone-800 mb-2 font-serif">Welcome Back</h3>
                      <button onClick={handleSignIn} className="w-full bg-stone-800 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-stone-700 transition-all text-sm uppercase tracking-wider">Sign In with Google</button>
                  </div>
              )}
          </div>
      )}

      {view === 'DESK' && <DeskView session={session} onOpenBook={handleOpenBook} />}
      
      {view === 'SHELF' && (
          <ShelfView 
            shelfGroups={shelfGroups} 
            setShelfGroups={setShelfGroups}
            onOpenNotebook={handleOpenNotebook} 
            onBackToDesk={() => setView('DESK')} 
            onAddToStaging={(t, c, e) => {
                setStagingBlocks(prev => [...prev, { id: generateId(), type: t, content: c, ai_generated: true, rotation: (Math.random() * 4 - 2), ...e }]);
                showToast("Added to Insights", 'success');
            }}
            startLoading={startLoading} stopLoading={stopLoading} showToast={showToast}
          />
      )}

      {isNotebookView && (
          <>
            <NotebookView 
                session={session} setSession={setSession} 
                stagingBlocks={stagingBlocks} setStagingBlocks={setStagingBlocks}
                onBackToShelf={() => setView('SHELF')}
                startLoading={startLoading} stopLoading={stopLoading} showToast={showToast}
                setWingerMessage={setWingerMessage}
            />
            
            <div className={`fixed bottom-0 right-8 z-[100] w-24 h-24 transition-transform duration-500 ease-spring transform-gpu`}>
                <Avatar systemContext={getAvatarContext()} currentFocus={getAvatarFocus()} incomingMessage={wingerMessage} onMessageComplete={() => setWingerMessage(null)} />
            </div>

            <div className={`transition-opacity opacity-100`}><MusicPlayer /></div>
          </>
      )}
    </>
  );
};

export default App;
