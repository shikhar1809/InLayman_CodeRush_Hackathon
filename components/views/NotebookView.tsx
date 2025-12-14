
import React, { useState, useEffect } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent, useDroppable, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { generateId, blobToBase64 } from '../../utils';
import { NoteSession, ContentBlock, BlockType } from '../../types';
import { useAudioController } from '../../hooks/useAudioController';
import { useBlockRegistry } from '../../hooks/useBlockRegistry';
import { useNotebookAI } from '../../hooks/useNotebookAI';
import { classifyLink, checkExamFrequency, transcribeAudioNode } from '../../services/geminiService';
import { ArrowLeft } from 'lucide-react';

import CreativeToolbar from '../CreativeToolbar';
import SystemDock from '../SystemDock';
import CanvasLayer from '../CanvasLayer';
import SmartLassoMenu from '../SmartLassoMenu';
import QuizModal from '../QuizModal';
import GoalPanel from '../GoalPanel';
import AutopilotModal from '../AutopilotModal'; 
import ShareModal from '../ShareModal';
import StagingArea, { StagingItem } from '../StagingArea';
import RevisionSheetModal from '../RevisionSheetModal';
import RevisionMenu from '../RevisionMenu';
import FocusPlug from '../FocusPlug';
import CommuteModal from '../CommuteModal';
import BlockLayer from '../BlockLayer';

// Droppable Wrapper
const DroppableCanvas = ({ children, onClick }: { children?: React.ReactNode, onClick?: (e: React.MouseEvent) => void }) => {
    const { setNodeRef } = useDroppable({ id: 'notebook-canvas' });
    return <div ref={setNodeRef} onClick={onClick} className="relative flex justify-center w-full">{children}</div>;
}

interface NotebookViewProps {
  session: NoteSession;
  setSession: React.Dispatch<React.SetStateAction<NoteSession>>;
  stagingBlocks: ContentBlock[];
  setStagingBlocks: React.Dispatch<React.SetStateAction<ContentBlock[]>>;
  onBackToShelf: () => void;
  startLoading: (msg: string) => void;
  stopLoading: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  setWingerMessage: (msg: string | null) => void;
}

const NotebookView: React.FC<NotebookViewProps> = ({
  session, setSession, stagingBlocks, setStagingBlocks, onBackToShelf, startLoading, stopLoading, showToast, setWingerMessage
}) => {
  // --- STATE ---
  const [selection, setSelection] = useState<{ text: string; blockId?: string; blockIds?: string[] } | null>(null);
  const [tool, setTool] = useState<'cursor' | 'pen' | 'lasso' | 'mic' | 'eraser'>('cursor');
  const [nudge, setNudge] = useState<string | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<ContentBlock | null>(null);
  const [showStaging, setShowStaging] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAutopilotModal, setShowAutopilotModal] = useState(false);
  const [showRevisionMenu, setShowRevisionMenu] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showCommuteModal, setShowCommuteModal] = useState(false);
  const [pageHeight, setPageHeight] = useState('100vh');
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  
  // --- PERFORMANCE HOOK ---
  const { registerBlock, getIntersectingBlocks } = useBlockRegistry();

  // --- BASIC ACTIONS ---
  const addBlock = (type: BlockType, content: string = '', ai_generated: boolean = false, extra: any = {}) => {
    const isVisual = ['sticky_note', 'mindmap_code', 'smart_embed', 'audio_tape', 'topic_card', 'community_snippet'].includes(type);
    const randomRotation = isVisual ? (Math.random() * 4 - 2) : 0;
    
    const existingMaxY = session.content_blocks.reduce((max, b) => Math.max(max, (b.y || 0) + (b.height || 100)), 0);
    const startY = isVisual ? existingMaxY + 50 : undefined;

    const newId = generateId();
    setSession(prev => ({
      ...prev,
      content_blocks: [...prev.content_blocks, { 
          id: newId, type, content, ai_generated, rotation: randomRotation,
          x: isVisual ? 100 + (Math.random() * 50) : undefined, y: startY, ...extra 
      }]
    }));
    
    if (type === 'text') setActiveBlockId(newId);
  };

  const removeBlock = (id: string) => setSession(prev => ({ ...prev, content_blocks: prev.content_blocks.filter(b => b.id !== id) }));
  
  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
      setSession(prev => ({ ...prev, content_blocks: prev.content_blocks.map(b => b.id === id ? { ...b, ...updates } : b) }));
  };

  const addToStaging = (type: BlockType, content: string, extra: any = {}) => {
      setStagingBlocks(prev => [...prev, {
          id: generateId(), type, content, ai_generated: true, rotation: (Math.random() * 4 - 2), ...extra
      }]);
      setShowStaging(true);
      showToast("Added to Insights", 'success');
  };

  // --- AI HOOK ---
  const ai = useNotebookAI({
      session, setSession, setStagingBlocks, startLoading, stopLoading, showToast, setWingerMessage, addBlock, addToStaging
  });

  // --- INTELLIGENT PAGE GROWTH ---
  useEffect(() => {
      const bottomMostBlock = session.content_blocks.reduce((max, b) => {
          const blockBottom = (b.y || 0) + (b.height || 200);
          return Math.max(max, blockBottom);
      }, 0);
      setPageHeight(`${Math.max(window.innerHeight, bottomMostBlock + 600)}px`);
  }, [session.content_blocks]);

  // --- DRAG HANDLERS ---
  const handleDragStart = (event: DragStartEvent) => {
      if (event.active.id.toString().startsWith('staging-')) setActiveDragItem(event.active.data.current?.block);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;
    setActiveDragItem(null);

    if (activeId.startsWith('staging-') && over?.id === 'notebook-canvas') {
        const blockData = active.data.current?.block as ContentBlock;
        const paperEl = document.getElementById('paper-editor');
        if (paperEl) {
            const paperRect = paperEl.getBoundingClientRect();
            const droppedRect = active.rect.current.translated;
            if (droppedRect) {
                const relativeX = Math.round(droppedRect.left - paperRect.left);
                const relativeY = Math.round(droppedRect.top - paperRect.top);
                setStagingBlocks(prev => prev.filter(b => b.id !== blockData.id));
                setSession(prev => ({
                    ...prev,
                    content_blocks: [...prev.content_blocks, { ...blockData, x: relativeX, y: relativeY, rotation: (Math.random() * 4 - 2) }]
                }));
            }
        }
        return;
    }

    setSession(prev => ({
        ...prev,
        content_blocks: prev.content_blocks.map(b => {
            if (b.id === activeId && active.rect.current.translated) {
                 const newX = Math.round((b.x || 0) + event.delta.x);
                 const newY = Math.round((b.y || 0) + event.delta.y);
                return { ...b, x: newX, y: newY };
            }
            return b;
        })
    }));
  };

  // --- AUDIO LOGIC ---
  const handleDictationCommit = (text: string) => {
      setSession(prev => {
          const blocks = [...prev.content_blocks];
          let targetIndex = blocks.length - 1;
          if (activeBlockId) {
              const idx = blocks.findIndex(b => b.id === activeBlockId);
              if (idx !== -1) targetIndex = idx;
          }
          if (targetIndex >= 0 && blocks[targetIndex].type === 'text') {
              blocks[targetIndex] = { ...blocks[targetIndex], content: blocks[targetIndex].content + text };
              return { ...prev, content_blocks: blocks };
          } else {
              const newId = generateId();
              return { ...prev, content_blocks: [...blocks, { id: newId, type: 'text', content: text, ai_generated: false }] };
          }
      });
  };

  const handleVoiceNoteComplete = async (blob: Blob, durationMs: number) => {
      const audioUrl = await blobToBase64(blob);
      const durationSec = Math.round(durationMs / 1000);
      const fmtDuration = `0:${durationSec < 10 ? '0' : ''}${durationSec}`;
      showToast("Processing Voice Note...", 'success');
      startLoading("Transcribing Voice Note...");
      let transcript = "Processing audio...";
      try {
          const mimeType = blob.type; 
          transcript = await transcribeAudioNode(audioUrl.split(',')[1], mimeType);
      } catch (e) { transcript = "Audio note"; } finally { stopLoading(); }
      addToStaging('audio_tape', transcript, { audio_url: audioUrl, duration: fmtDuration, tape_style: ['yellow', 'pink', 'blue', 'green'][Math.floor(Math.random() * 4)], width: 200, height: 60 });
  };

  const { mode: audioMode, isRecording, liveTranscript, startDictation, stopDictation, startVoiceNote, stopVoiceNote } = useAudioController({
      onDictationCommit: handleDictationCommit, onVoiceNoteComplete: handleVoiceNoteComplete
  });

  // --- LASSO SELECTION ---
  const onLassoSelect = (rect: { x: number, y: number, width: number, height: number }) => {
      const paperEl = document.getElementById('paper-editor');
      if (!paperEl) return;
      
      // Use the O(1) registry for performance
      const intersectingIds = getIntersectingBlocks(rect, paperEl.getBoundingClientRect());

      if (intersectingIds.length > 0) {
          const text = session.content_blocks.filter(b => intersectingIds.includes(b.id)).map(b => b.content).join('\n');
          setSelection({ text, blockId: 'lasso-group', blockIds: intersectingIds });
      }
      setTool('cursor');
  };

  // --- HELPERS ---
  const handleConvertLink = async (url: string, blockId: string, startIndex: number, endIndex: number) => {
      const blockIndex = session.content_blocks.findIndex(b => b.id === blockId);
      if (blockIndex === -1) return;
      const block = session.content_blocks[blockIndex];
      try {
          const { emoji } = await classifyLink(url);
          const beforeText = block.content.substring(0, startIndex);
          const afterText = block.content.substring(endIndex);
          const newBlocks: any[] = [];
          if (beforeText.trim()) newBlocks.push({ ...block, id: generateId(), content: beforeText });
          newBlocks.push({ id: generateId(), type: 'smart_embed', content: url, embed_type: 'emoji', emoji_char: emoji, ai_generated: true, rotation: 0 });
          if (afterText.trim()) newBlocks.push({ ...block, id: generateId(), content: afterText });
          setSession(prev => { const updated = [...prev.content_blocks]; updated.splice(blockIndex, 1, ...newBlocks); return { ...prev, content_blocks: updated }; });
      } catch (e) { console.error("Link conversion failed", e); }
  };

  // --- AUTOMATED EXAM RADAR ---
  useEffect(() => {
    const checkRadar = async () => {
        if (focusMode || session.content_blocks.length === 0) return;
        const lastBlock = session.content_blocks[session.content_blocks.length - 1];
        if (lastBlock.type === 'text' && lastBlock.content.length > 50 && !lastBlock.exam_metadata) {
             if (Math.random() > 0.7) { 
                 try {
                     const result = await checkExamFrequency(lastBlock.content.substring(0, 100));
                     if (result.is_exam_favorite) {
                         updateBlock(lastBlock.id, { exam_metadata: result });
                         setNudge(`Exam Alert! This topic appeared in ${result.last_seen_year || 'recent'} finals.`);
                     }
                 } catch (e) {}
             }
        }
    };
    const timer = setTimeout(checkRadar, 3000); 
    return () => clearTimeout(timer);
  }, [session.content_blocks, focusMode]);

  // --- STYLES ---
  const getFontClass = (fontId: string) => {
      switch(fontId) {
          case 'clean_serif': return 'font-serif';
          case 'modern_sans': return 'font-sans';
          case 'cursive': return 'font-cursive';
          case 'messy': return 'font-messy';
          case 'ivy': return 'font-ivy';
          case 'doodler': return 'font-doodler';
          case 'hacker': return 'font-hacker';
          case 'influencer': return 'font-influencer';
          case 'serif_handwriting': default: return 'font-handwriting';
      }
  };
  const getPaperStyles = (texture: string) => {
      const base = { backgroundColor: '#fdfbf7', color: '#2d2a2e' };
      switch (texture) {
          case 'white_smooth': return { backgroundColor: '#ffffff', color: '#2d2a2e' };
          case 'lined': return { ...base, backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '100% 32px', backgroundPosition: '0 8px' };
          case 'grid': return { ...base, backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px' };
          case 'dark_terminal': return { backgroundColor: '#0c0c0c', color: '#00ff00', backgroundImage: 'linear-gradient(rgba(0, 255, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.05) 1px, transparent 1px)', backgroundSize: '20px 20px', fontFamily: 'JetBrains Mono, monospace' };
          case 'cream_rough': default: return { ...base, backgroundImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyBAMAAADsEZWCAAAAGFBMVEUAAAA5OTkAAAAAAAAAAABMTExERERmZmZVNWuvAAAACHRSTlMAMwA1MzMzM7O0s14AAABSSURBVDjLY2AYBaNgKL2h4Q8D+x8G9j8M7H8Y2P8wsP9hYP/DwP6Hgf0PA/sfBvY/DOx/GNj/MLD/YWD/YWD/w8D+h4H9DwP7Hwb2PwzsfxiY5jAAAGB9W/1w2BvaAAAAAElFTkSuQmCC')" };
      }
  };
  const dynamicFontClass = getFontClass(session.visual_style.font);
  const paperStyle = { ...getPaperStyles(session.visual_style.paper_texture), minHeight: pageHeight, height: 'auto', transition: 'min-height 0.3s ease-out' };
  const textColorClass = session.visual_style.paper_texture === 'dark_terminal' ? 'text-green-500 placeholder:text-green-900' : 'text-ink placeholder:text-stone-300';

  const handleToolbarAction = (action: 'autopilot' | 'insights' | 'test' | 'revision' | 'commute' | 'share') => {
      switch(action) {
          case 'autopilot': setShowAutopilotModal(true); break;
          case 'insights': setShowStaging(true); break;
          case 'test': ai.runTestMe(); break;
          case 'revision': setShowRevisionMenu(true); break;
          case 'commute': setShowCommuteModal(true); break;
          case 'share': setShowShareModal(true); break;
      }
  };

  const handleToolSelect = (newTool: 'cursor' | 'pen' | 'lasso' | 'eraser') => {
      setSelection(null); 
      setTool(newTool);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <div className="min-h-screen bg-[#e8e6e1] bg-noise flex justify-center font-serif relative overflow-y-auto overflow-x-hidden text-stone-800 isolation-isolate" id="paper-bg">
      
      {/* HUD Elements */}
      {audioMode === 'dictation' && liveTranscript && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-pop-in pointer-events-none opacity-50">
              <div className="bg-stone-800/50 text-white backdrop-blur-md px-4 py-2 rounded-full border border-stone-600 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-mono tracking-wide">Transcribing...</span>
              </div>
          </div>
      )}
      {isRecording && audioMode === 'voice_note' && (
          <div className="fixed inset-0 z-[100] bg-blue-500/10 backdrop-blur-sm flex items-center justify-center cursor-none pointer-events-none">
              <div className="bg-white p-6 rounded-full shadow-2xl animate-pulse flex items-center gap-4">
                  <div className="w-4 h-4 bg-blue-600 rounded-full animate-ping"></div>
                  <span className="font-mono text-blue-600 font-bold tracking-widest uppercase">Recording Tape...</span>
              </div>
          </div>
      )}

      {/* Nav & Dock */}
      <div className={`fixed top-6 left-6 z-50 transition-transform ${focusMode ? '-translate-x-[200%]' : 'translate-x-0'}`}>
        <button onClick={onBackToShelf} className="bg-white/80 backdrop-blur border border-stone-200 p-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-white shadow-sm transition-all group" title="Back to Shelf">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>
      <FocusPlug connected={!focusMode} onToggle={() => { setFocusMode(!focusMode); if(!focusMode) setShowStaging(false); }} />
      {!focusMode && <SystemDock onAction={handleToolbarAction} stagingCount={stagingBlocks.length} />}

      {/* Main Canvas Area */}
      <DroppableCanvas onClick={(e) => { if (tool === 'cursor') { const target = e.target as HTMLElement; if (target.id === 'paper-bg' || target.getAttribute('role') === 'canvas') setSelection(null); } }}>
        <div className="flex flex-col items-center w-full relative">
            <div className={`fixed left-1/2 -translate-x-1/2 z-40 transition-all duration-500 top-6`}>
                <CreativeToolbar currentTool={tool} onSelectTool={handleToolSelect} isRecording={isRecording} audioMode={audioMode} onStartDictation={startDictation} onStopDictation={stopDictation} onStartVoiceNote={startVoiceNote} onStopVoiceNote={stopVoiceNote} />
            </div>

            <div className="w-full max-w-[850px] shrink-0 min-h-[100vh] h-auto shadow-2xl rounded-sm p-4 md:p-16 relative flex flex-col z-20 transition-all duration-300 mb-20 md:mb-0" style={paperStyle} id="paper-editor">
                <CanvasLayer 
                    active={tool === 'pen' || tool === 'lasso' || tool === 'eraser'} 
                    mode={tool === 'pen' ? 'pen' : tool === 'eraser' ? 'eraser' : 'lasso'} 
                    onLassoSelect={onLassoSelect} 
                    paths={session.sketches}
                    onPathAdd={(pathData) => setSession(prev => ({ ...prev, sketches: [...prev.sketches, pathData] }))}
                    onPathRemove={(index) => setSession(prev => { const s = [...prev.sketches]; s.splice(index, 1); return {...prev, sketches: s}; })}
                />

                <div className={`border-b-2 border-stone-100/10 pb-4 mb-8 flex justify-between items-end transition-opacity duration-700 opacity-100`}>
                    <div>
                        <h1 className={`text-3xl font-bold tracking-tight ${dynamicFontClass} ${textColorClass}`}>{session.title}</h1>
                        <p className="text-stone-400 text-sm mt-1">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                {nudge && !focusMode && (
                    <div className="mb-6 p-4 bg-yellow-50/50 border-l-2 border-yellow-400 text-stone-600 text-sm italic flex justify-between items-center">
                        <span>💡 {nudge}</span>
                        <button onClick={() => setNudge(null)} className="text-stone-400 hover:text-stone-800 ml-4">&times;</button>
                    </div>
                )}

                <BlockLayer 
                    blocks={session.content_blocks}
                    audioMode={audioMode}
                    liveTranscript={liveTranscript}
                    activeBlockId={activeBlockId}
                    focusMode={focusMode}
                    tool={tool}
                    selection={selection}
                    fontClass={dynamicFontClass}
                    textColorClass={textColorClass}
                    onUpdateBlock={updateBlock}
                    onFocusBlock={setActiveBlockId}
                    onRemoveBlock={removeBlock}
                    onResizeBlock={(id, dw, dh) => setSession(prev => ({...prev, content_blocks: prev.content_blocks.map(b => b.id === id ? { ...b, width: (b.width || 300) + dw, height: (b.height || 200) + dh } : b)}))}
                    onConvertLink={handleConvertLink}
                    onSelectionChange={setSelection}
                    onStopDictation={stopDictation}
                    onAddToStaging={addToStaging}
                    registerBlockRef={registerBlock}
                />

                {selection && tool === 'cursor' && !focusMode && (
                    <SmartLassoMenu 
                        selectionText={selection.text} 
                        onExplain={() => ai.handleExplain(selection.text)} 
                        onEnhance={() => ai.handleEnhance(selection.text)} 
                        onLookup={(s) => ai.handleLookup(selection.text, selection.blockId, s)} 
                        onVisualize={() => ai.handleVisualize(selection.text)} 
                    />
                )}
            </div>
        </div>
      </DroppableCanvas>
      
      {/* Drawers & Modals */}
      <div className="z-40"><StagingArea blocks={stagingBlocks} isOpen={showStaging} onClose={() => setShowStaging(false)} onRemoveBlock={(id) => setStagingBlocks(prev => prev.filter(b => b.id !== id))} /></div>
      <DragOverlay>{activeDragItem ? <StagingItem block={activeDragItem} isOverlay /> : null}</DragOverlay>
      <div className={`fixed left-0 top-0 h-full z-40 transition-transform`}><GoalPanel goalContext={session.goal_context} onUpdateGoal={(g) => setSession(prev => ({ ...prev, goal_context: g }))} focusMode={focusMode} onAnalyze={ai.handleAnalyzeGoal} analyzing={ai.autopilotLoading} /></div>
      
      {showAutopilotModal && <AutopilotModal onClose={() => setShowAutopilotModal(false)} onGenerate={ai.handleAutopilotGeneration} onUploadContext={ai.handleModalContextUpload} existingContext={session.grounding_context} />}
      {showShareModal && <ShareModal notebookTitle={session.title} onClose={() => setShowShareModal(false)} />}
      {showRevisionMenu && <RevisionMenu onClose={() => setShowRevisionMenu(false)} onSelect={(m) => { if(m === 'AUDIO_SUMMARY') { setShowRevisionMenu(false); setShowCommuteModal(true); } else { ai.handleRevisionModeSelect(m); setShowRevisionMenu(false); } }} loading={ai.revisionLoading} />}
      {showCommuteModal && <CommuteModal notes={session.content_blocks.map(b => b.content).join('\n')} onClose={() => setShowCommuteModal(false)} />}
      {ai.revisionSheetContent && <RevisionSheetModal content={ai.revisionSheetContent} onClose={() => ai.setRevisionSheetContent(null)} />}
      {ai.quizData && <QuizModal title={ai.quizData.title} context={session.title} questions={ai.quizData.questions} onClose={() => ai.setQuizData(null)} onComplete={(failed, remedial) => { const unlockId = ai.quizData?.unlockBlockId; ai.setQuizData(null); if (!failed && unlockId) updateBlock(unlockId, { locked: false }); else if (failed && remedial && !unlockId) addBlock('sticky_note', `Remedial Note: ${remedial}`, true); }} />}
    </div>
    </DndContext>
  );
};

export default NotebookView;
