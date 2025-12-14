
import React, { useRef, useEffect, useState } from 'react';
import { Lock, Link, Highlighter, X, MicOff, Check } from 'lucide-react';

interface SmartEditorProps {
  content: string;
  onChange: (val: string) => void;
  fontClass: string;
  textColorClass: string;
  lineHeight: string;
  onEntityClick: (text: string) => void;
  onSelect: (e: React.SyntheticEvent<HTMLTextAreaElement>) => void;
  onConvertLink?: (url: string, start: number, end: number) => void;
  isLocked?: boolean;
  onUnlock?: () => void;
  
  // Audio Props
  isDictating?: boolean;
  onStopDictation?: () => void;
  
  // Tracking
  onFocus?: () => void;
  
  // Active Tool Context
  activeTool?: 'cursor' | 'pen' | 'lasso' | 'mic' | 'eraser';
  
  // External Selection (Lasso)
  isSelected?: boolean;
}

interface HighlightRange {
    start: number;
    end: number;
    type: 'date' | 'def' | 'url' | 'manual' | 'selection';
    text: string;
    color?: string; // For manual highlights
}

const SmartEditor: React.FC<SmartEditorProps> = ({ 
    content, 
    onChange, 
    fontClass, 
    textColorClass, 
    lineHeight, 
    onEntityClick, 
    onSelect, 
    onConvertLink, 
    isLocked = false, 
    onUnlock,
    isDictating,
    onStopDictation,
    onFocus,
    activeTool = 'cursor',
    isSelected = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [highlights, setHighlights] = useState<React.ReactNode[]>([]);
  const [activeUrl, setActiveUrl] = useState<{url: string, start: number, end: number} | null>(null);
  
  // Manual Highlighting State
  const [manualHighlights, setManualHighlights] = useState<Array<{start: number, end: number, color: string}>>([]);
  const [toolbarPos, setToolbarPos] = useState<{x: number, y: number, selectionStart: number, selectionEnd: number} | null>(null);
  const [cursorPos, setCursorPos] = useState<{x: number, y: number} | null>(null);
  
  // Selection Visual State
  const [currentSelection, setCurrentSelection] = useState<{start: number, end: number} | null>(null);

  // Auto-Resize Logic
  useEffect(() => {
      const resize = () => {
          if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
              const newHeight = textareaRef.current.scrollHeight + 'px';
              textareaRef.current.style.height = newHeight;
              
              // Sync backdrop height exactly
              if (backdropRef.current) {
                  backdropRef.current.style.height = newHeight;
              }
          }
      };
      resize();
  }, [content]);

  // Track cursor position for Floating Dictation Button
  const updateCursorPos = () => {
      if (!isDictating || !textareaRef.current) return;
      setCursorPos({ x: 0, y: 0 }); // Anchor to top-left of active block relative container for now
  };

  useEffect(() => {
      if (isDictating) {
          updateCursorPos();
      } else {
          setCursorPos(null);
      }
  }, [isDictating, content]);

  // Tool Switching Logic: Clear selection if tool is not cursor
  useEffect(() => {
      if (activeTool !== 'cursor') {
          setCurrentSelection(null);
          setToolbarPos(null);
          if (window.getSelection) {
              window.getSelection()?.removeAllRanges();
          }
      }
  }, [activeTool]);

  // 1. Regex Definitions
  const DATE_REGEX = /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s\d{1,2}(?:st|nd|rd|th)?(?:,?\s\d{4})?|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Tomorrow|Yesterday|Today)\b/gi;
  const DEF_REGEX = /\b([A-Z][\w\s-]{2,20})\s+(?:is a|is an|is the|are|refers to|means)\b/g;
  const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+/g;

  // 2. Process Content for Highlights (Debounced)
  useEffect(() => {
    const processHighlights = () => {
      const nodes: React.ReactNode[] = [];
      let matches: Array<HighlightRange> = [];

      // A. Get Regex Matches
      const dateRegex = new RegExp(DATE_REGEX);
      const defRegex = new RegExp(DEF_REGEX);
      const urlRegex = new RegExp(URL_REGEX);

      let match;
      while ((match = dateRegex.exec(content)) !== null) {
        matches.push({ start: match.index, end: match.index + match[0].length, type: 'date', text: match[0] });
      }
      while ((match = defRegex.exec(content)) !== null) {
         matches.push({ start: match.index, end: match.index + match[1].length, type: 'def', text: match[1] });
      }
      while ((match = urlRegex.exec(content)) !== null) {
        matches.push({ start: match.index, end: match.index + match[0].length, type: 'url', text: match[0] });
      }

      // B. Add Manual Highlights
      manualHighlights.forEach(h => {
          if (h.end <= content.length) {
              matches.push({ start: h.start, end: h.end, type: 'manual', text: content.substring(h.start, h.end), color: h.color });
          }
      });

      // C. Add Current Selection Highlight (High Priority)
      if (currentSelection && currentSelection.start !== currentSelection.end) {
          matches.push({ 
              start: currentSelection.start, 
              end: currentSelection.end, 
              type: 'selection', 
              text: content.substring(currentSelection.start, currentSelection.end) 
          });
      } else if (isSelected) {
          // External Selection (Lasso) - Highlight Everything
          matches.push({ 
              start: 0, 
              end: content.length, 
              type: 'selection', 
              text: content
          });
      }

      // D. Sort and Filter
      matches.sort((a, b) => a.start - b.start);
      const prioritizedMatches: typeof matches = [];
      const occupied: boolean[] = new Array(content.length).fill(false);
      
      // Selection takes top priority for visuals
      const selectionMatch = matches.find(m => m.type === 'selection');
      if (selectionMatch) {
          prioritizedMatches.push(selectionMatch);
          for(let i=selectionMatch.start; i<selectionMatch.end; i++) occupied[i] = true;
      }

      // Then Manual Highlights
      matches.filter(m => m.type === 'manual' && !occupied.slice(m.start, m.end).some(b => b)).forEach(m => {
          prioritizedMatches.push(m);
          for(let i=m.start; i<m.end; i++) occupied[i] = true;
      });

      // Then Auto Highlights
      matches.filter(m => m.type !== 'manual' && m.type !== 'selection').forEach(m => {
          let clean = true;
          for(let i=m.start; i<m.end; i++) if(occupied[i]) clean = false;
          if(clean) {
              prioritizedMatches.push(m);
              for(let i=m.start; i<m.end; i++) occupied[i] = true;
          }
      });
      
      prioritizedMatches.sort((a, b) => a.start - b.start);

      // E. Build Nodes
      let lastIndex = 0;
      prioritizedMatches.forEach((m, i) => {
          if (m.start > lastIndex) {
              nodes.push(content.substring(lastIndex, m.start));
          }

          let style = "";
          if (m.type === 'date') style = "bg-blue-100/50 border-b-2 border-blue-300 text-transparent rounded-sm";
          else if (m.type === 'def') style = "bg-yellow-100/50 border-b-2 border-yellow-300 text-transparent rounded-sm";
          else if (m.type === 'url') style = "bg-stone-200/50 border-b-2 border-stone-400 text-transparent rounded-sm";
          else if (m.type === 'manual') style = `${m.color || 'bg-yellow-200'} text-transparent mix-blend-multiply rounded-sm px-0.5 box-decoration-clone`;
          // Modified Selection Style for Blue Underline
          else if (m.type === 'selection') style = "border-b-2 border-blue-600 bg-blue-100/30 text-transparent rounded-none";

          nodes.push(
              <span key={`${i}-${m.start}`} className={`${style}`}>
                  {content.substring(m.start, m.end)}
              </span>
          );

          lastIndex = m.end;
      });

      if (lastIndex < content.length) {
          nodes.push(content.substring(lastIndex));
      }

      // Handle trailing newline for precise sync
      if (content.endsWith('\n')) {
          nodes.push(<br key="last-br"/>);
      }

      setHighlights(nodes);
    };

    const timer = setTimeout(() => {
        processHighlights();
    }, 50); // Faster debounce for smoother selection feeling

    return () => clearTimeout(timer);
  }, [content, manualHighlights, currentSelection, isSelected]);

  const handleSelectInternal = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
      onSelect(e);
      const target = e.target as HTMLTextAreaElement;
      
      // Update visual selection state
      if (target.selectionStart !== target.selectionEnd) {
          setCurrentSelection({ start: target.selectionStart, end: target.selectionEnd });
      } else {
          setCurrentSelection(null);
      }
      
      if (isDictating) updateCursorPos();

      const cursor = target.selectionStart;
      const urlRegex = new RegExp(URL_REGEX);
      let match;
      let foundUrl = null;
      while ((match = urlRegex.exec(content)) !== null) {
          if (cursor >= match.index && cursor <= match.index + match[0].length) {
              foundUrl = { url: match[0], start: match.index, end: match.index + match[0].length };
              break;
          }
      }
      setActiveUrl(foundUrl);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLTextAreaElement>) => {
      const target = e.target as HTMLTextAreaElement;
      if (target.selectionStart !== target.selectionEnd) {
          const rect = target.getBoundingClientRect();
          // Calculate precise tooltip position
          const x = Math.min(rect.width - 100, e.clientX - rect.left);
          const y = e.clientY - rect.top - 40; 

          setToolbarPos({
              x: Math.max(0, x),
              y,
              selectionStart: target.selectionStart,
              selectionEnd: target.selectionEnd
          });
      } else {
          setToolbarPos(null);
          setCurrentSelection(null); // Clear highlight on click
          
          // Check for clicks on entities
          const start = target.selectionStart;
          const dateRegex = new RegExp(DATE_REGEX);
          const defRegex = new RegExp(DEF_REGEX);
          let match;
          while ((match = dateRegex.exec(content)) !== null) {
             if (start >= match.index && start <= match.index + match[0].length) {
                 onEntityClick(match[0]);
                 return;
             }
          }
          while ((match = defRegex.exec(content)) !== null) {
              if (start >= match.index && start <= match.index + match[0].length) {
                  onEntityClick(match[1] || match[0]); // Def regex group 1 is term
                  return;
              }
          }
      }
  };

  const applyHighlight = (colorClass: string) => {
      if (toolbarPos) {
          setManualHighlights(prev => [
              ...prev, 
              { start: toolbarPos.selectionStart, end: toolbarPos.selectionEnd, color: colorClass }
          ]);
          setToolbarPos(null);
          setCurrentSelection(null);
      }
  };

  return (
    <div className="relative w-full min-h-[100px] overflow-visible group h-auto">
        
        {/* Helper Styles */}
        <style>{`
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {/* Floating Dictation Indicator */}
        {isDictating && onStopDictation && (
            <div className="absolute -left-10 top-0 z-50 animate-bounce">
                <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_red]"></div>
            </div>
        )}

        {/* Floating Highlighter Menu */}
        {toolbarPos && !isLocked && activeTool === 'cursor' && (
            <div 
                className="absolute z-50 bg-stone-900 text-white rounded-full px-2 py-1.5 shadow-xl flex items-center gap-2 animate-pop-in border border-stone-700"
                style={{ top: toolbarPos.y, left: toolbarPos.x }}
            >
                <div className="flex items-center gap-1 border-r border-stone-700 pr-2 mr-1">
                    <Highlighter size={12} className="text-stone-400" />
                </div>
                <button onClick={() => applyHighlight('bg-yellow-300/60')} className="w-5 h-5 rounded-full bg-yellow-400 hover:scale-110 transition-transform ring-1 ring-white/20" />
                <button onClick={() => applyHighlight('bg-green-300/60')} className="w-5 h-5 rounded-full bg-green-400 hover:scale-110 transition-transform ring-1 ring-white/20" />
                <button onClick={() => applyHighlight('bg-pink-300/60')} className="w-5 h-5 rounded-full bg-pink-400 hover:scale-110 transition-transform ring-1 ring-white/20" />
                <button onClick={() => setToolbarPos(null)} className="ml-1 text-stone-500 hover:text-white"><X size={12} /></button>
            </div>
        )}

        {/* URL Convert Button */}
        {activeUrl && onConvertLink && !toolbarPos && (
            <div className="absolute top-0 right-0 z-50 animate-pop-in">
                <button 
                    onClick={() => {
                        onConvertLink(activeUrl.url, activeUrl.start, activeUrl.end);
                        setActiveUrl(null);
                    }}
                    className="bg-stone-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 hover:bg-stone-700 hover:scale-105 transition-all"
                >
                    <Link size={12} />
                    <span>Anchor</span>
                </button>
            </div>
        )}

        <div className={`relative w-full h-auto ${isLocked ? 'blur-sm select-none pointer-events-none opacity-50 transition-all duration-500' : ''}`}>
            {/* Backdrop for Highlights */}
            <div 
                ref={backdropRef}
                className={`absolute inset-0 w-full whitespace-pre-wrap break-words pointer-events-none text-transparent ${fontClass} hide-scrollbar`}
                style={{ 
                    lineHeight: lineHeight, 
                    fontSize: '1.125rem', // Match Textarea
                    padding: '0px', 
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    overflow: 'hidden'
                }}
                aria-hidden="true"
            >
                {highlights}
            </div>

            {/* Editable Input */}
            <textarea
                ref={textareaRef}
                className={`relative z-10 w-full bg-transparent resize-none outline-none border-none text-lg leading-relaxed overflow-hidden ${fontClass} ${textColorClass} hide-scrollbar`}
                value={content}
                onChange={(e) => { onChange(e.target.value); if(isDictating) updateCursorPos(); }}
                onFocus={onFocus}
                onMouseUp={handleMouseUp}
                onSelect={handleSelectInternal}
                onKeyUp={handleSelectInternal}
                style={{ 
                    lineHeight: lineHeight,
                    padding: '0px',
                    boxSizing: 'border-box',
                    height: 'auto',
                    fontFamily: 'inherit',
                    whiteSpace: 'pre-wrap'
                }}
                spellCheck={false}
                disabled={isLocked}
                rows={1}
            />
        </div>

        {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
                <button 
                    onClick={onUnlock}
                    className="bg-white/80 backdrop-blur-md border border-stone-200 shadow-xl px-6 py-4 rounded-xl flex items-center gap-3 hover:scale-105 transition-transform group-hover:bg-white text-stone-800 animate-pop-in cursor-pointer"
                >
                    <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-600">
                        <Lock size={20} />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-sm uppercase tracking-wide">Autopilot Locked</p>
                        <p className="text-xs text-stone-500">Pass the Handshake Quiz to unlock</p>
                    </div>
                </button>
            </div>
        )}
    </div>
  );
};

export default SmartEditor;
