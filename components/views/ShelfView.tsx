
import React, { useState } from 'react';
import { generateId } from '../../utils';
import { SnippetData } from '../../types';
import { searchCommunitySnippets } from '../../services/geminiService';
import { Library, Globe, FolderPlus, Folder, MoreVertical, Search, Loader2, Heart, Plus, AlertTriangle, Baby, Lightbulb } from 'lucide-react';

interface ShelfViewProps {
  shelfGroups: any[];
  setShelfGroups: React.Dispatch<React.SetStateAction<any[]>>;
  onOpenNotebook: (notebook: any) => void;
  onBackToDesk: () => void;
  onAddToStaging: (type: any, content: string, extra: any) => void;
  startLoading: (msg: string) => void;
  stopLoading: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

const ShelfView: React.FC<ShelfViewProps> = ({ 
    shelfGroups, setShelfGroups, onOpenNotebook, onBackToDesk, onAddToStaging, startLoading, stopLoading, showToast 
}) => {
  const [shelfTab, setShelfTab] = useState<'personal' | 'community'>('personal');
  const [communityQuery, setCommunityQuery] = useState('');
  const [communityResults, setCommunityResults] = useState<SnippetData[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState<{ groupId: string, notebookId: string } | null>(null);

  const handleCreateGroup = () => {
      const name = prompt("Enter group name:");
      if (name) setShelfGroups([...shelfGroups, { id: generateId(), title: name, notebooks: [] }]);
  };

  const handleMoveNotebook = (fromGroupId: string, toGroupId: string, notebookId: string) => {
      const newGroups = [...shelfGroups];
      const fromGroup = newGroups.find(g => g.id === fromGroupId);
      const toGroup = newGroups.find(g => g.id === toGroupId);
      
      if (!fromGroup || !toGroup) return;

      const notebookIndex = fromGroup.notebooks.findIndex((n:any) => n.id === notebookId);
      if (notebookIndex === -1) return;

      const [notebook] = fromGroup.notebooks.splice(notebookIndex, 1);
      toGroup.notebooks.push(notebook);
      
      setShelfGroups(newGroups);
      setActiveMenu(null);
  };

  const handleCommunitySearch = async (term: string) => {
    if (!term.trim()) return;
    setCommunityLoading(true);
    startLoading(`Searching for "${term}"...`);
    try {
        const results = await searchCommunitySnippets(term);
        setCommunityResults(results);
    } catch (e) {
        showToast("Search failed", 'error');
    } finally {
        setCommunityLoading(false);
        stopLoading();
    }
  }

  return (
      <div className="min-h-screen bg-desktop bg-desktop-texture flex flex-col p-8 overflow-y-auto" onClick={() => setActiveMenu(null)}>
          <div className="max-w-6xl mx-auto w-full pb-20">
              {/* Header Navigation */}
              <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-6">
                      <button 
                        onClick={() => setShelfTab('personal')}
                        className={`text-3xl font-serif font-bold flex items-center gap-3 transition-colors ${shelfTab === 'personal' ? 'text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
                      >
                          <Library className={shelfTab === 'personal' ? "text-stone-800" : "text-stone-400"} /> My Bookshelf
                      </button>
                      <span className="text-3xl text-stone-300 font-light">/</span>
                      <button 
                         onClick={() => setShelfTab('community')}
                         className={`text-3xl font-serif font-bold flex items-center gap-3 transition-colors ${shelfTab === 'community' ? 'text-indigo-700' : 'text-stone-400 hover:text-stone-600'}`}
                      >
                          <Globe className={shelfTab === 'community' ? "text-indigo-700" : "text-stone-400"} /> Community Library
                      </button>
                  </div>

                  <div className="flex gap-3">
                    {shelfTab === 'personal' && (
                        <button onClick={handleCreateGroup} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm text-stone-600 text-xs font-bold uppercase tracking-widest hover:bg-stone-50">
                            <FolderPlus size={16} /> New Group
                        </button>
                    )}
                    <button onClick={onBackToDesk} className="text-stone-500 hover:text-stone-800 font-bold uppercase text-xs tracking-widest px-4 py-2">
                        Back to Desk
                    </button>
                  </div>
              </div>

              {/* Content Switching */}
              {shelfTab === 'personal' ? (
                  <div className="space-y-12 animate-pop-in">
                      {shelfGroups.map(group => (
                          <div key={group.id} className="animate-pop-in">
                              <h3 className="flex items-center gap-2 text-stone-600 font-bold uppercase tracking-widest text-sm mb-4 border-b border-stone-400/20 pb-2">
                                  <Folder size={16} /> {group.title}
                                  <span className="text-stone-400 ml-2 text-[10px]">{group.notebooks.length} items</span>
                              </h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                  {group.notebooks.map((notebook: any) => (
                                      <div 
                                        key={notebook.id}
                                        className="aspect-[3/4] rounded-r-2xl rounded-l-md shadow-2xl cursor-pointer hover:-translate-y-2 transition-all border-l-8 flex flex-col relative overflow-visible bg-white group"
                                        style={{ borderLeftColor: notebook.color }}
                                      >
                                          {/* Menu Button */}
                                          <div className="absolute top-2 right-2 z-20">
                                              <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu?.notebookId === notebook.id ? null : { groupId: group.id, notebookId: notebook.id });
                                                }}
                                                className="p-1 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100"
                                              >
                                                  <MoreVertical size={16} />
                                              </button>
                                              
                                              {activeMenu?.notebookId === notebook.id && (
                                                  <div className="absolute right-0 top-6 bg-white rounded-lg shadow-xl border border-stone-200 w-40 z-30 overflow-hidden animate-pop-in">
                                                      <div className="p-2 text-[10px] uppercase font-bold text-stone-400 border-b border-stone-100">Move To...</div>
                                                      {shelfGroups.filter(g => g.id !== group.id).map(targetGroup => (
                                                          <button 
                                                            key={targetGroup.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMoveNotebook(group.id, targetGroup.id, notebook.id);
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 truncate"
                                                          >
                                                              {targetGroup.title}
                                                          </button>
                                                      ))}
                                                  </div>
                                              )}
                                          </div>

                                          <div 
                                            className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/leather.png')]"
                                            onClick={() => onOpenNotebook(notebook)}
                                          ></div>
                                          
                                          <div className="p-6 flex flex-col h-full z-10 relative pointer-events-none">
                                              <div className="w-full h-24 bg-stone-100/50 rounded flex items-center justify-center mb-4 border border-stone-200/50">
                                                  <span className="font-serif font-bold text-xl text-center leading-tight" style={{ color: notebook.color }}>{notebook.title}</span>
                                              </div>
                                              <div className="mt-auto">
                                                  <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">Last Edited</p>
                                                  <p className="text-sm text-stone-600 font-serif">{notebook.updated}</p>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="animate-pop-in">
                      {/* Community Library UI */}
                      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/50 min-h-[60vh] flex flex-col items-center">
                           {/* Search Header */}
                           <div className="max-w-2xl w-full mx-auto mb-12 text-center">
                               <h3 className="text-2xl font-serif font-bold text-stone-700 mb-2">Explore Peer Knowledge</h3>
                               <p className="text-stone-500 mb-6">Find analogies, cheat codes, and simple explanations from the community.</p>
                               <form onSubmit={(e) => { e.preventDefault(); handleCommunitySearch(communityQuery); }} className="relative">
                                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                                   <input 
                                     type="text" 
                                     value={communityQuery}
                                     onChange={(e) => setCommunityQuery(e.target.value)}
                                     placeholder="Search for topics (e.g., Mitochondria, French Revolution)..."
                                     className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border border-stone-200 shadow-sm text-lg focus:ring-2 focus:ring-indigo-400 outline-none"
                                   />
                                   <button type="submit" className="absolute right-2 top-2 bottom-2 bg-stone-800 text-white px-6 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-stone-700 flex items-center justify-center">
                                       {communityLoading ? <Loader2 size={16} className="animate-spin" /> : "Search"}
                                   </button>
                               </form>
                           </div>

                           {/* Content Area */}
                           <div className="w-full max-w-6xl">
                               {communityResults.length > 0 ? (
                                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                       {communityResults.map((snippet) => (
                                           <div key={snippet.id} className="h-full">
                                                <div className={`relative p-6 rounded-lg shadow-sm border hover:shadow-md transition-all group flex flex-col h-full
                                                    ${snippet.type === 'CHEAT_CODE' ? 'bg-red-50 border-red-200 text-red-900' :
                                                      snippet.type === 'ELI5' ? 'bg-blue-50 border-blue-200 text-blue-900' :
                                                      'bg-yellow-100 border-yellow-200 text-yellow-900'}
                                                `}>
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-600 shadow-sm border border-red-800 z-10"></div>
                                                    
                                                    <div className="flex justify-between items-start mb-4 border-b border-black/10 pb-2">
                                                        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider opacity-70">
                                                            {snippet.type === 'CHEAT_CODE' ? <AlertTriangle size={14} /> :
                                                             snippet.type === 'ELI5' ? <Baby size={14} /> :
                                                             <Lightbulb size={14} />}
                                                             {snippet.type === 'CHEAT_CODE' ? 'Cheat Code' : snippet.type === 'ELI5' ? 'ELI5' : 'Analogy'}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] font-bold opacity-60">
                                                            <Heart size={10} className="fill-current" /> {snippet.likes}
                                                        </div>
                                                    </div>

                                                    <p className="font-handwriting text-xl leading-relaxed mb-4 flex-grow">
                                                        {snippet.content}
                                                    </p>

                                                    <div className="flex justify-between items-end mt-auto">
                                                         <span className="text-[10px] font-mono opacity-50">@{snippet.author_tag}</span>
                                                         <button 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                onAddToStaging('community_snippet', JSON.stringify(snippet), { rotation: (Math.random() * 4 - 2) });
                                                            }}
                                                            className="bg-white/50 hover:bg-white text-stone-800 p-2 rounded-full shadow-sm transition-colors"
                                                            title="Add to Staging"
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                           </div>
                                       ))}
                                   </div>
                               ) : (
                                   <div className="text-center py-12">
                                       <p className="text-stone-400 font-bold uppercase tracking-widest text-xs mb-4">Trending Topics</p>
                                       <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                                           {["Photosynthesis", "Calculus Limits", "The Great Gatsby", "React Hooks", "French Revolution", "Quantum Physics"].map(topic => (
                                               <button 
                                                    key={topic} 
                                                    onClick={() => { setCommunityQuery(topic); handleCommunitySearch(topic); }}
                                                    className="px-4 py-2 bg-stone-100 hover:bg-white border border-stone-200 rounded-full text-stone-600 text-sm font-medium transition-colors"
                                                >
                                                   {topic}
                                               </button>
                                           ))}
                                       </div>
                                   </div>
                               )}
                           </div>
                      </div>
                  </div>
              )}
          </div>
      </div>
  );
};

export default ShelfView;
