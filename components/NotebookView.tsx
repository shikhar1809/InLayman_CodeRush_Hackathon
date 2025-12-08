
import React, { useState, useEffect, useRef } from 'react';
import { Binder, Note, NoteHighlight, Checkpoint, NoteReference, UserGoal } from '../types';
import { Plus, ArrowLeft, Sparkles, Zap, Bot, ToggleLeft, ToggleRight, Loader2, Replace, Target, CheckSquare, Link, Video, BoxSelect, MousePointer2, Type, Pen, Highlighter, Check, XCircle, Cloud, Save, Layers, GraduationCap, Copy, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { enhanceNoteContent, generateNoteVisual, suggestSimilarQuestion, analyzeNoteContext, analyzeVisualSelection, monitorNoteSession, generateNoteFromResource } from '../services/gemini';
import { authService } from '../services/authService';
import LiveTutor from './LiveTutor';

interface Props {
    onBack: () => void;
    initialBinderId?: string;
    initialNoteId?: string;
}

const getBinders = (): Binder[] => {
    const raw = localStorage.getItem('inlayman_binders');
    if (raw) return JSON.parse(raw);
    const defaultBinder: Binder = {
        id: 'b1', title: 'General Notes', goal: 'Learn new things', themeColor: '#06b6d4',
        notes: [{ id: 'n1', title: 'Welcome', content: 'This is your smart paper.\n\nType anywhere or use the Pen tool below to annotate, circle, or draw diagrams manually.\n\nSelect text to see AI superpowers.', lastModified: Date.now(), diagrams: [], flashcards: [], references: [], highlights: [] }]
    };
    return [defaultBinder];
};

const saveBinders = (binders: Binder[]) => localStorage.setItem('inlayman_binders', JSON.stringify(binders));

type AiOutputType = 'ENHANCE' | 'EXPLAIN' | 'PRACTICE' | 'VISUALIZE';
interface AiOutput {
    type: AiOutputType;
    data: any;
    originalSelection?: string;
    loading?: boolean;
}

interface InsightState {
    recommendations: string[];
    nextStep: string;
    resources: { title: string, query: string }[];
    loading: boolean;
}

const NotebookView: React.FC<Props> = ({ onBack, initialBinderId, initialNoteId }) => {
    const [binders, setBinders] = useState<Binder[]>([]);
    const [activeBinderId, setActiveBinderId] = useState<string>('');
    const [activeNoteId, setActiveNoteId] = useState<string>('');
    const [viewMode, setViewMode] = useState<'EDIT' | 'READ'>('EDIT');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState({ left: false, right: false });
    const [rightSidebarTab, setRightSidebarTab] = useState<'INSIGHTS' | 'RESOURCES' | 'CONCEPTS'>('INSIGHTS');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<number | null>(null);
    
    // Goal & Monitoring State
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showContextModal, setShowContextModal] = useState(false); // New Context Modal
    const [detectedGlobalGoal, setDetectedGlobalGoal] = useState<UserGoal | null>(null);

    const [tempGoal, setTempGoal] = useState('');
    const [tempCheckpoints, setTempCheckpoints] = useState<string[]>(['']);
    const [newCheckpointInput, setNewCheckpointInput] = useState('');
    const [insights, setInsights] = useState<InsightState>({ recommendations: [], nextStep: '', resources: [], loading: false });
    
    // Resource Module State
    const [resourceInput, setResourceInput] = useState('');
    const [resourceType, setResourceType] = useState<'VIDEO' | 'ARTICLE'>('ARTICLE');
    const [analyzingResource, setAnalyzingResource] = useState<string | null>(null);

    // AI Staging State
    const [aiOutput, setAiOutput] = useState<AiOutput | null>(null);

    // Selection State
    const [selectedText, setSelectedText] = useState('');
    const [menuPos, setMenuPos] = useState<{x: number, y: number} | null>(null);
    const [showMagicMenu, setShowMagicMenu] = useState(false);
    
    // Tools
    const [drawTool, setDrawTool] = useState<'pen' | 'highlighter' | 'eraser' | 'selection' | 'cursor' | 'text'>('pen');
    
    // AI State
    const [selectionAnalysis, setSelectionAnalysis] = useState<{ category: string, description: string, suggestion: string, x: number, y: number } | null>(null);
    const [agentState, setAgentState] = useState<'HIDDEN' | 'PEEKING' | 'ACTIVE'>('HIDDEN');
    const [activeHighlight, setActiveHighlight] = useState<{ text: string, analogy: string, explanation: string } | null>(null);
    const [expandedHighlightId, setExpandedHighlightId] = useState<string | null>(null);
    
    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const monitorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Drawing & Selection Refs
    const [isDrawing, setIsDrawing] = useState(false);
    const [isSelectingBox, setIsSelectingBox] = useState(false);
    const lastPos = useRef<{x: number, y: number} | null>(null);
    const dragStart = useRef<{x: number, y: number} | null>(null); 
    const [selectionBox, setSelectionBox] = useState<{x: number, y: number, w: number, h: number} | null>(null);

    useEffect(() => {
        const loaded = getBinders();
        setBinders(loaded);
        if (initialBinderId && loaded.find(b => b.id === initialBinderId)) {
            setActiveBinderId(initialBinderId);
            if (initialNoteId) setActiveNoteId(initialNoteId);
            if (initialBinderId === 'binder-docs') {
                setViewMode('READ');
                setDrawTool('cursor'); 
            }
        } else if (loaded.length > 0) {
            setActiveBinderId(loaded[0].id);
            if (loaded[0].notes.length > 0) setActiveNoteId(loaded[0].notes[0].id);
        }
    }, [initialBinderId, initialNoteId]);

    const activeBinder = binders.find(b => b.id === activeBinderId);
    const activeNote = activeBinder?.notes.find(n => n.id === activeNoteId);

    // Auto-Save Logic
    useEffect(() => {
        if (binders.length > 0) {
            setIsSaving(true);
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                saveBinders(binders);
                setIsSaving(false);
                setLastSaved(Date.now());
            }, 1000);
        }
    }, [binders]);

    // Check Goal on Note Load
    useEffect(() => {
        if (activeNote && !activeNote.learningGoal) {
            // Check for global goal
            const globalGoal = authService.getGoal();
            if (globalGoal) {
                setDetectedGlobalGoal(globalGoal);
                const t = setTimeout(() => setShowContextModal(true), 800);
                return () => clearTimeout(t);
            } else {
                const t = setTimeout(() => setShowGoalModal(true), 800);
                return () => clearTimeout(t);
            }
        }
    }, [activeNoteId]); 

    // Monitor Session Effect
    useEffect(() => {
        if (!activeNote || !activeNote.learningGoal) return;

        if (monitorTimeoutRef.current) clearTimeout(monitorTimeoutRef.current);

        monitorTimeoutRef.current = setTimeout(async () => {
            setInsights(prev => ({ ...prev, loading: true }));
            try {
                const result = await monitorNoteSession(
                    activeNote.content, 
                    activeNote.learningGoal!, 
                    activeNote.checkpoints || []
                );
                
                setInsights({
                    recommendations: result.insights,
                    nextStep: result.nextStep,
                    resources: result.suggestedResources,
                    loading: false
                });

                if (result.updatedCheckpoints && result.updatedCheckpoints.length > 0) {
                    const updatedCPs = (activeNote.checkpoints || []).map(cp => {
                        const update = result.updatedCheckpoints.find(u => u.id === cp.id);
                        return update ? { ...cp, completed: update.completed } : cp;
                    });
                    
                    if (JSON.stringify(updatedCPs) !== JSON.stringify(activeNote.checkpoints)) {
                        const updatedNotes = activeBinder!.notes.map(n => n.id === activeNote.id ? { ...n, checkpoints: updatedCPs } : n);
                        setBinders(binders.map(b => b.id === activeBinderId ? { ...b, notes: updatedNotes } : b));
                    }
                }
            } catch (e) { console.error(e); setInsights(prev => ({ ...prev, loading: false })); }
        }, 5000); // Increased debouce to 5s to reduce API calls

        return () => { if (monitorTimeoutRef.current) clearTimeout(monitorTimeoutRef.current); };
    }, [activeNote?.content, activeNoteId]);


    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && activeNote) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (activeNote.drawingData) {
                    const img = new Image();
                    img.src = activeNote.drawingData;
                    img.onload = () => ctx.drawImage(img, 0, 0);
                }
            }
        }
        setSelectionAnalysis(null);
        setActiveHighlight(null);
        setExpandedHighlightId(null);
        setShowMagicMenu(false);
        setSelectionBox(null);
        
        if (viewMode === 'READ') setDrawTool('cursor');
        else setDrawTool('pen');
        
    }, [activeNoteId, viewMode]);

    useEffect(() => {
        let animationFrameId: number;
        const handleResize = () => {
             animationFrameId = requestAnimationFrame(() => {
                if (!containerRef.current || !canvasRef.current) return;
                const width = Math.max(containerRef.current.scrollWidth, containerRef.current.clientWidth);
                const height = Math.max(containerRef.current.scrollHeight, containerRef.current.clientHeight, 800);
                
                if (Math.abs(canvasRef.current.width - width) > 1 || Math.abs(canvasRef.current.height - height) > 1) {
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = canvasRef.current.width;
                    tempCanvas.height = canvasRef.current.height;
                    const tempCtx = tempCanvas.getContext('2d');
                    if (tempCtx) tempCtx.drawImage(canvasRef.current, 0, 0);
                    
                    canvasRef.current.width = width;
                    canvasRef.current.height = height;
                    
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) ctx.drawImage(tempCanvas, 0, 0);
                }
            });
        };

        handleResize(); 
        const resizeObserver = new ResizeObserver(handleResize);
        if (containerRef.current) resizeObserver.observe(containerRef.current);
        if (textareaRef.current) resizeObserver.observe(textareaRef.current);

        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(animationFrameId);
        };
    }, [activeNoteId, viewMode, activeNote?.content]); 

    const updateNoteContent = (newContent: string) => {
        if (!activeBinder || !activeNote) return;
        const updatedNotes = activeBinder.notes.map(n => n.id === activeNote.id ? { ...n, content: newContent, lastModified: Date.now() } : n);
        const updatedBinders = binders.map(b => b.id === activeBinder.id ? { ...b, notes: updatedNotes } : b);
        setBinders(updatedBinders);
    };

    const saveDrawing = () => {
        if (!activeBinder || !activeNote || !canvasRef.current) return;
        const dataUrl = canvasRef.current.toDataURL();
        const updatedNotes = activeBinder.notes.map(n => n.id === activeNote.id ? { ...n, drawingData: dataUrl, lastModified: Date.now() } : n);
        const updatedBinders = binders.map(b => b.id === activeBinder.id ? { ...b, notes: updatedNotes } : b);
        setBinders(updatedBinders);
    };

    const handleCreateNote = () => {
        if (!activeBinder) return;
        const newNote: Note = {
            id: Date.now().toString(),
            title: 'Untitled Note',
            content: '',
            lastModified: Date.now(),
            diagrams: [],
            flashcards: [],
            references: [],
            highlights: []
        };
        const updatedBinders = binders.map(b => b.id === activeBinder.id ? { ...b, notes: [newNote, ...b.notes] } : b);
        setBinders(updatedBinders);
        setActiveNoteId(newNote.id);
    };

    const handleSaveGoal = () => {
        if (!activeBinder || !activeNote) return;
        const checkpoints: Checkpoint[] = tempCheckpoints.filter(c => c.trim()).map((c, i) => ({
            id: `cp-${i}-${Date.now()}`,
            label: c,
            completed: false
        }));
        
        const updatedNotes = activeBinder.notes.map(n => n.id === activeNote.id ? { 
            ...n, 
            learningGoal: tempGoal,
            checkpoints: checkpoints 
        } : n);
        const updatedBinders = binders.map(b => b.id === activeBinder.id ? { ...b, notes: updatedNotes } : b);
        setBinders(updatedBinders);
        setShowGoalModal(false);
        setRightSidebarTab('INSIGHTS');
    };

    const handleConfirmGlobalGoal = () => {
        if (!activeBinder || !activeNote || !detectedGlobalGoal) return;
        const updatedNotes = activeBinder.notes.map(n => n.id === activeNote.id ? { 
            ...n, 
            learningGoal: detectedGlobalGoal.title,
            // Import current day's title as a checkpoint if available
            checkpoints: detectedGlobalGoal.curriculum ? [
                 { id: `cp-glob-${Date.now()}`, label: detectedGlobalGoal.curriculum[Math.min(detectedGlobalGoal.progress, detectedGlobalGoal.curriculum.length-1)].title, completed: false }
            ] : []
        } : n);
        const updatedBinders = binders.map(b => b.id === activeBinder.id ? { ...b, notes: updatedNotes } : b);
        setBinders(updatedBinders);
        setShowContextModal(false);
    }

    const handleRejectGlobalGoal = () => {
        setShowContextModal(false);
        setShowGoalModal(true);
    }

    const toggleCheckpoint = (cpId: string) => {
        if (!activeBinder || !activeNote) return;
        const updatedCPs = (activeNote.checkpoints || []).map(cp => cp.id === cpId ? { ...cp, completed: !cp.completed } : cp);
        const updatedNotes = activeBinder.notes.map(n => n.id === activeNote.id ? { ...n, checkpoints: updatedCPs } : n);
        setBinders(binders.map(b => b.id === activeBinderId ? { ...b, notes: updatedNotes } : b));
    };

    const addManualCheckpoint = () => {
        if (!activeBinder || !activeNote || !newCheckpointInput.trim()) return;
        const newCp: Checkpoint = {
            id: `cp-man-${Date.now()}`,
            label: newCheckpointInput,
            completed: false
        };
        const updatedCPs = [...(activeNote.checkpoints || []), newCp];
        const updatedNotes = activeBinder.notes.map(n => n.id === activeNote.id ? { ...n, checkpoints: updatedCPs } : n);
        setBinders(binders.map(b => b.id === activeBinderId ? { ...b, notes: updatedNotes } : b));
        setNewCheckpointInput('');
    };

    const handleAddResource = async () => {
        if (!resourceInput.trim() || !activeBinder || !activeNote) return;
        const newRef: NoteReference = {
            id: Date.now().toString(),
            type: resourceType,
            url: resourceInput,
            title: resourceInput, 
            timestamp: Date.now().toString()
        };
        const updatedNotes = activeBinder.notes.map(n => n.id === activeNote.id ? { ...n, references: [...n.references, newRef] } : n);
        setBinders(binders.map(b => b.id === activeBinderId ? { ...b, notes: updatedNotes } : b));
        setResourceInput('');
    };

    const handleUseResource = async (ref: NoteReference, mode: 'FULL' | 'COMPLETE' | 'SUMMARY') => {
        if (!activeNote) return;
        setAnalyzingResource(ref.id);
        try {
            const result = await generateNoteFromResource(ref, activeNote.content, mode);
            if (result) {
                let newContent = activeNote.content;
                if (mode === 'COMPLETE') {
                    newContent += result;
                } else {
                    newContent += `\n\n${result}`;
                }
                updateNoteContent(newContent);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to process resource.");
        } finally {
            setAnalyzingResource(null);
        }
    };

    const getCoords = (e: React.PointerEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.PointerEvent) => {
        (e.target as Element).setPointerCapture(e.pointerId);
        const coords = getCoords(e);
        lastPos.current = coords;
        dragStart.current = coords;
        setIsDrawing(true);
    };

    const draw = (e: React.PointerEvent) => {
        if (!isDrawing || !lastPos.current) return;
        const coords = getCoords(e);
        
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        
        ctx.beginPath(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.moveTo(lastPos.current.x, lastPos.current.y); 
        ctx.lineTo(coords.x, coords.y);
        ctx.strokeStyle = drawTool === 'highlighter' ? '#fef08a' : '#000000';
        ctx.lineWidth = drawTool === 'highlighter' ? 15 : 2;
        ctx.globalCompositeOperation = drawTool === 'highlighter' ? 'multiply' : drawTool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.stroke();
        
        lastPos.current = coords;
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        saveDrawing();
    };

    const startBoxSelection = (e: React.PointerEvent) => {
        (e.target as Element).setPointerCapture(e.pointerId);
        const coords = getCoords(e);
        dragStart.current = coords;
        setIsSelectingBox(true);
        setSelectionBox({ x: coords.x, y: coords.y, w: 0, h: 0 });
        setShowMagicMenu(false);
        setSelectionAnalysis(null);
    };

    const moveBoxSelection = (e: React.PointerEvent) => {
        if (!isSelectingBox || !dragStart.current) return;
        const coords = getCoords(e);
        const w = Math.abs(coords.x - dragStart.current.x);
        const h = Math.abs(coords.y - dragStart.current.y);
        const x = Math.min(coords.x, dragStart.current.x);
        const y = Math.min(coords.y, dragStart.current.y);
        setSelectionBox({ x, y, w, h });
    };

    const endBoxSelection = async (e: React.PointerEvent) => {
        if (!isSelectingBox || !selectionBox) return;
        setIsSelectingBox(false);
        (e.target as Element).releasePointerCapture(e.pointerId);

        if (selectionBox.w < 20 || selectionBox.h < 20) {
            setSelectionBox(null);
            return;
        }

        const container = containerRef.current;
        if (!container) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const menuClientX = rect.left + (selectionBox.x / scaleX) + (selectionBox.w / scaleX);
        const menuClientY = rect.top + (selectionBox.y / scaleY) + (selectionBox.h / scaleY) + 10;
        
        setMenuPos({ x: menuClientX, y: menuClientY });
        setShowMagicMenu(true);
        
        if (canvasRef.current) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = selectionBox.w;
            tempCanvas.height = selectionBox.h;
            const ctx = tempCanvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, selectionBox.w, selectionBox.h);
                ctx.drawImage(canvasRef.current, selectionBox.x, selectionBox.y, selectionBox.w, selectionBox.h, 0, 0, selectionBox.w, selectionBox.h);
            }
            const dataUrl = tempCanvas.toDataURL('image/jpeg');
            
            try {
                const res = await analyzeVisualSelection(dataUrl.split(',')[1]);
                setSelectionAnalysis({ category: res.category, description: res.description, suggestion: res.suggestion, x: menuClientX, y: menuClientY });
                if(res.extractedText) setSelectedText(res.extractedText);
            } catch(e) { console.error(e); }
        }
    };

    const initAiPanel = (type: AiOutputType, selection: string) => {
        setAiOutput({ type, data: null, originalSelection: selection, loading: true });
        setIsSidebarCollapsed(prev => ({ ...prev, left: false }));
        setShowMagicMenu(false);
        setSelectionBox(null);
    };

    const handleAiEnhance = async () => {
        if (!selectedText || !activeBinder) return;
        initAiPanel('ENHANCE', selectedText);
        const improved = await enhanceNoteContent(selectedText, activeNote?.learningGoal);
        setAiOutput(prev => prev ? { ...prev, data: improved, loading: false } : null);
    };

    const handleAiExplain = async () => {
        if (!selectedText || !activeBinder) return;
        initAiPanel('EXPLAIN', selectedText);
        const context = await analyzeNoteContext(selectedText, activeNote?.learningGoal);
        setAiOutput(prev => prev ? { ...prev, data: context, loading: false } : null);
    };

    const handleAiPractice = async () => {
        if (!selectedText || !activeBinder) return;
        initAiPanel('PRACTICE', selectedText);
        const q = await suggestSimilarQuestion(selectedText, activeNote?.learningGoal);
        setAiOutput(prev => prev ? { ...prev, data: q, loading: false } : null);
    };

    const handleAiVisualize = async () => {
        if (!selectedText) return;
        initAiPanel('VISUALIZE', selectedText);
        const visual = await generateNoteVisual(selectedText);
        setAiOutput(prev => prev ? { ...prev, data: visual, loading: false } : null);
    };

    const applyAiReplacement = () => {
        if (!aiOutput?.data || typeof aiOutput.data !== 'string' || !aiOutput.originalSelection) return;
        const currentContent = activeNote?.content || '';
        const newContent = currentContent.replace(aiOutput.originalSelection, aiOutput.data);
        updateNoteContent(newContent);
        setAiOutput(null); 
    };

    const renderInteractiveText = () => {
        if (!activeNote) return null;
        let content = activeNote.content;
        const highlights = activeNote.highlights || [];
        if (highlights.length === 0) return <div className="whitespace-pre-wrap leading-loose font-serif text-lg">{content}</div>;
        
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        const matches: { start: number, end: number, hl: NoteHighlight }[] = [];
        highlights.forEach(hl => {
            try {
                const escaped = hl.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(escaped, 'gi');
                let match;
                while ((match = regex.exec(content)) !== null) {
                    matches.push({ start: match.index, end: match.index + match[0].length, hl });
                }
            } catch (e) { }
        });
        matches.sort((a, b) => a.start - b.start);
        matches.forEach(m => {
            if (m.start > lastIndex) parts.push(content.substring(lastIndex, m.start));
            parts.push(
                <span 
                    key={`hl-${m.start}`} 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        setActiveHighlight(m.hl); 
                        setAgentState('ACTIVE'); 
                        setExpandedHighlightId(prev => prev === m.hl.id ? null : m.hl.id); 
                    }} 
                    className={`cursor-pointer px-0.5 rounded-sm border-b-2 ${expandedHighlightId === m.hl.id ? 'bg-primary-500 text-white border-transparent' : 'bg-teal-500/20 border-teal-500 hover:bg-teal-500/40'}`}
                >
                    {content.substring(m.start, m.end)}
                </span>
            );
            if (expandedHighlightId === m.hl.id) {
                parts.push(
                    <motion.div key={`exp-${m.hl.id}`} initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="block my-4 mx-4">
                         <div className="bg-slate-900 border border-teal-500/30 rounded-xl p-4 shadow-xl border-l-4 border-l-teal-500">
                            <div className="text-xs font-bold text-teal-400 uppercase mb-2">Analogy</div>
                            <p className="text-slate-200 italic mb-3">"{m.hl.analogy}"</p>
                            <div className="text-sm text-slate-400"><span className="font-bold uppercase text-xs">Def:</span> {m.hl.explanation}</div>
                         </div>
                    </motion.div>
                )
            }
            lastIndex = m.end;
        });
        if (lastIndex < content.length) parts.push(content.substring(lastIndex));
        return <div className="whitespace-pre-wrap leading-loose font-serif text-lg">{parts}</div>;
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
            
            <AnimatePresence>
                {/* NEW GOAL CONTEXT MODAL */}
                {showContextModal && detectedGlobalGoal && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
                             <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                                    <Copy className="w-8 h-8"/>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Continue Your Goal?</h2>
                                <p className="text-slate-400 text-sm">We see you're currently working on:</p>
                                <div className="my-4 p-3 bg-blue-900/20 rounded-xl border border-blue-500/30 text-blue-300 font-bold">
                                    "{detectedGlobalGoal.title}"
                                </div>
                                <p className="text-slate-400 text-sm">Do you want to apply this context to this note?</p>
                             </div>
                             <div className="flex gap-3">
                                 <button onClick={handleRejectGlobalGoal} className="px-6 py-3 border border-slate-700 rounded-xl text-slate-300 hover:text-white flex-1">No, New Goal</button>
                                 <button onClick={handleConfirmGlobalGoal} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex-1 shadow-lg shadow-blue-900/20">Yes, Apply</button>
                             </div>
                        </motion.div>
                    </motion.div>
                )}

                {showGoalModal && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                                    <Target className="w-8 h-8"/>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Set Your Mission</h2>
                                <p className="text-slate-400 text-sm">To give you the best AI guidance, tell us what you're aiming for.</p>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Objective</label>
                                    <input value={tempGoal} onChange={e => setTempGoal(e.target.value)} placeholder="e.g. Master Derivatives for AP Calc" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none"/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Checkpoints (Optional)</label>
                                    <div className="space-y-2">
                                        {tempCheckpoints.map((cp, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input value={cp} onChange={e => {const n=[...tempCheckpoints]; n[i]=e.target.value; setTempCheckpoints(n)}} placeholder={`Step ${i+1}`} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white"/>
                                                {i === tempCheckpoints.length-1 && <button onClick={() => setTempCheckpoints([...tempCheckpoints, ''])} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700"><Plus size={16}/></button>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowGoalModal(false)} className="px-6 py-3 border border-slate-700 rounded-xl text-slate-300 hover:text-white">Skip</button>
                                    <button onClick={handleSaveGoal} disabled={!tempGoal} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold disabled:opacity-50 transition-all">Start Session</button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
            {!isSidebarCollapsed.left && (
                <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: aiOutput ? 400 : 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-20">
                     <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                         <button onClick={onBack} className="text-slate-400 hover:text-white"><ArrowLeft size={18}/></button>
                         <span className="font-bold text-xs uppercase tracking-widest text-slate-500">Binders</span>
                         <Plus size={18} className="text-primary-400 cursor-pointer" onClick={handleCreateNote}/>
                     </div>
                     
                     <div style={{ flexGrow: aiOutput ? 0 : 1, height: aiOutput ? '35%' : 'auto' }} className="overflow-y-auto p-2 space-y-1 transition-all">
                        {binders.map(b => (
                             <div key={b.id}>
                                <button onClick={() => setActiveBinderId(b.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${activeBinderId === b.id ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>
                                    <div className="w-2 h-2 rounded-full" style={{background: b.themeColor}}></div>{b.title}
                                </button>
                                {activeBinderId === b.id && (
                                    <div className="pl-6 mt-1 space-y-0.5">
                                        {b.notes.map(n => (
                                            <button key={n.id} onClick={() => setActiveNoteId(n.id)} className={`w-full text-left px-3 py-1.5 text-xs rounded truncate ${activeNoteId === n.id ? 'text-primary-400 bg-slate-800' : 'text-slate-500'}`}>{n.title || "Untitled"}</button>
                                        ))}
                                    </div>
                                )}
                             </div>
                        ))}
                     </div>

                     {aiOutput && (
                         <div className="flex-1 flex flex-col bg-slate-900 border-t border-primary-500/20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
                            <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                                 <span className="font-bold text-primary-400 text-xs uppercase flex gap-1"><Sparkles size={12}/> AI Result</span>
                                 <button onClick={() => setAiOutput(null)} className="text-slate-500 hover:text-white"><XCircle size={14}/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                 {aiOutput.loading ? (
                                     <div className="flex flex-col items-center justify-center h-full gap-4">
                                         <Loader2 className="w-8 h-8 text-primary-500 animate-spin"/>
                                         <span className="text-xs text-slate-500">Generating Intelligence...</span>
                                     </div>
                                 ) : (
                                     <div className="text-sm text-slate-300">
                                         {aiOutput.type === 'ENHANCE' && (
                                             <>
                                                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 mb-4 shadow-inner">{aiOutput.data}</div>
                                                <button onClick={applyAiReplacement} className="w-full py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2"><Replace size={14}/> Replace Selection</button>
                                             </>
                                         )}
                                         {aiOutput.type === 'EXPLAIN' && <div className="bg-slate-800 p-3 rounded-lg border border-slate-700"><b>Analogy:</b> {aiOutput.data.insight}</div>}
                                         {aiOutput.type === 'PRACTICE' && (
                                            <div className="space-y-2">
                                                <div className="font-bold text-white">{aiOutput.data.text}</div>
                                                {aiOutput.data.options.map((o: string, i:number) => <div key={i} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs">{o}</div>)}
                                            </div>
                                         )}
                                         {aiOutput.type === 'VISUALIZE' && (
                                            <div className="space-y-2">
                                                <img src={`https://mermaid.ink/img/${btoa(aiOutput.data.code)}?bgColor=1e293b&theme=dark`} alt="Diagram" className="w-full rounded-lg border border-slate-700" />
                                                <div className="text-xs text-slate-500">{aiOutput.data.description}</div>
                                            </div>
                                         )}
                                     </div>
                                 )}
                            </div>
                         </div>
                     )}
                </motion.div>
            )}
            </AnimatePresence>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col relative bg-[#f8fafc]">
                 {activeNote ? (
                     <div className="flex flex-col h-full relative">
                        <div className="h-16 border-b border-slate-200 flex items-center px-4 shrink-0 bg-white gap-4 z-50 shadow-sm">
                            <button onClick={() => setIsSidebarCollapsed(prev => ({ ...prev, left: !prev.left }))} className="text-slate-400"><ToggleLeft/></button>
                            <div className="flex-1 flex flex-col justify-center">
                                <input value={activeNote.title} onChange={(e) => { const updated = activeBinder!.notes.map(n => n.id === activeNote.id ? { ...n, title: e.target.value } : n); setBinders(binders.map(b => b.id === activeBinderId ? { ...b, notes: updated } : b)); }} className="bg-transparent text-lg font-bold text-slate-900 focus:outline-none" placeholder="Page Title..." />
                                {activeNote.learningGoal ? 
                                    <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 cursor-pointer hover:underline" onClick={() => setShowGoalModal(true)}><Target size={10}/> Goal: {activeNote.learningGoal}</div>
                                    : <button onClick={() => setShowGoalModal(true)} className="text-[10px] text-slate-400 hover:text-emerald-600 flex items-center gap-1"><Plus size={10}/> Add Goal</button>
                                }
                            </div>
                            
                            <div className="flex bg-slate-100 p-1 rounded-lg items-center gap-1">
                                {isSaving ? (
                                    <div className="text-[10px] text-slate-400 animate-pulse mr-2 flex items-center gap-1"><Cloud size={10}/> Saving...</div>
                                ) : (
                                    <div className="text-[10px] text-emerald-600 mr-2 flex items-center gap-1 transition-opacity duration-1000"><Check size={10}/> Saved</div>
                                )}
                                <button onClick={() => setAgentState(prev => prev === 'HIDDEN' ? 'PEEKING' : 'HIDDEN')} className={`p-1 rounded transition-colors ${agentState !== 'HIDDEN' ? 'bg-white text-emerald-600 shadow' : 'text-slate-400 hover:text-emerald-600'}`} title="AI Tutor">
                                    <Bot size={16}/>
                                </button>
                                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                <button onClick={() => { setViewMode('EDIT'); setDrawTool('pen'); }} className={`px-3 py-1 rounded text-xs font-bold transition-all ${viewMode === 'EDIT' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>Edit</button>
                                <button onClick={() => { setViewMode('READ'); setDrawTool('cursor'); }} className={`px-3 py-1 rounded text-xs font-bold transition-all ${viewMode === 'READ' ? 'bg-white shadow text-teal-600' : 'text-slate-400'}`}>Interact</button>
                            </div>
                            <button onClick={() => setIsSidebarCollapsed(prev => ({ ...prev, right: !prev.right }))} className="text-slate-400"><ToggleRight/></button>
                        </div>

                        <div ref={containerRef} className="flex-1 relative overflow-y-auto custom-scrollbar-light bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
                            <div className="min-h-full p-8 relative max-w-4xl mx-auto pb-24" onMouseUp={viewMode === 'READ' ? () => {
                                const sel = window.getSelection();
                                if(sel && sel.toString().length > 0) {
                                    setSelectedText(sel.toString());
                                    const r = sel.getRangeAt(0).getBoundingClientRect();
                                    setMenuPos({x: r.left + r.width/2, y: r.bottom + 10});
                                    setShowMagicMenu(true);
                                }
                            } : undefined}>
                                {viewMode === 'EDIT' ? (
                                    <textarea ref={textareaRef} value={activeNote.content} onChange={(e) => {
                                        const updated = activeBinder!.notes.map(n => n.id === activeNote.id ? { ...n, content: e.target.value } : n);
                                        setBinders(binders.map(b => b.id === activeBinderId ? { ...b, notes: updated } : b));
                                    }} className="w-full min-h-[80vh] bg-transparent text-lg leading-loose text-slate-800 resize-none focus:outline-none font-serif relative z-20 pointer-events-auto" placeholder="Start typing..." />
                                ) : (
                                    <div className="w-full min-h-[80vh] relative z-20 text-slate-800 pointer-events-auto">{renderInteractiveText()}</div>
                                )}
                                <canvas ref={canvasRef} className="absolute inset-0 z-30 pointer-events-none" />
                                {drawTool === 'selection' && (
                                    <div className="absolute inset-0 z-50 pointer-events-auto cursor-crosshair touch-none" onPointerDown={startBoxSelection} onPointerMove={moveBoxSelection} onPointerUp={endBoxSelection}>
                                        {selectionBox && <div style={{position: 'absolute', left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h, border: '2px dashed #8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', pointerEvents: 'none'}}/>}
                                    </div>
                                )}
                                {drawTool !== 'selection' && drawTool !== 'cursor' && drawTool !== 'text' && <div className="absolute inset-0 z-40 pointer-events-auto touch-none" onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} />}
                            </div>
                        </div>

                        {/* TOOLBAR */}
                        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex justify-center">
                            <div className="bg-slate-900 border border-slate-700 rounded-full shadow-2xl p-2 flex items-center gap-2">
                                {viewMode === 'READ' ? (
                                    <>
                                        <button onClick={() => { setDrawTool('selection'); setShowMagicMenu(false); }} className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 ${drawTool === 'selection' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}><BoxSelect size={18}/> <span className="text-sm">Box Select</span></button>
                                        <button onClick={() => { setDrawTool('cursor'); setShowMagicMenu(false); }} className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 ${drawTool === 'cursor' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}><MousePointer2 size={18}/> <span className="text-sm">Select Text</span></button>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex bg-slate-800 rounded-full p-1">
                                            <button onClick={() => setDrawTool('text')} className={`p-2 rounded-full ${drawTool === 'text' ? 'bg-slate-700 text-white' : 'text-slate-400'}`} title="Type Text"><Type size={18}/></button>
                                            <button onClick={() => setDrawTool('pen')} className={`p-2 rounded-full ${drawTool === 'pen' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}><Pen size={18}/></button>
                                            <button onClick={() => setDrawTool('highlighter')} className={`p-2 rounded-full ${drawTool === 'highlighter' ? 'bg-yellow-500/20 text-yellow-400' : 'text-slate-400'}`}><Highlighter size={18}/></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* MAGIC MENU */}
                        <AnimatePresence>
                            {showMagicMenu && menuPos && (
                                <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} style={{left: menuPos.x, top: menuPos.y}} className="fixed z-[9999] -translate-x-1/2 -translate-y-full mb-2">
                                    <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700 p-1 flex gap-1">
                                        <button onClick={handleAiEnhance} className="px-3 py-2 hover:bg-slate-800 rounded-lg text-xs font-bold text-white flex flex-col items-center gap-1 group"><Sparkles size={14} className="text-yellow-400 group-hover:scale-110"/> Enhance</button>
                                        <button onClick={handleAiExplain} className="px-3 py-2 hover:bg-slate-800 rounded-lg text-xs font-bold text-white flex flex-col items-center gap-1 group"><Zap size={14} className="text-blue-400 group-hover:scale-110"/> Explain</button>
                                        <button onClick={handleAiVisualize} className="px-3 py-2 hover:bg-slate-800 rounded-lg text-xs font-bold text-white flex flex-col items-center gap-1 group"><Layers size={14} className="text-pink-400 group-hover:scale-110"/> Visualize</button>
                                        <button onClick={handleAiPractice} className="px-3 py-2 hover:bg-slate-800 rounded-lg text-xs font-bold text-white flex flex-col items-center gap-1 group"><GraduationCap size={14} className="text-green-400 group-hover:scale-110"/> Practice</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        {/* AI VOICE AGENT OVERLAY (DRAGGABLE) */}
                        <AnimatePresence>
                            {agentState !== 'HIDDEN' && (
                                <motion.div 
                                    drag
                                    dragConstraints={containerRef}
                                    dragMomentum={false}
                                    initial={{ opacity: 0, scale: 0.9, y: 20, right: 24, bottom: 24 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute z-[60] w-72 h-80 cursor-grab active:cursor-grabbing"
                                    style={{ right: 24, bottom: 24 }}
                                >
                                     <div className="w-full h-full drop-shadow-2xl">
                                        <LiveTutor 
                                            contextTopic={activeNote?.learningGoal || activeNote?.title}
                                            documentContext={activeNote?.content}
                                            analogyContent={activeHighlight ? { 
                                                concept: activeHighlight.text,
                                                domain: 'General',
                                                analogyTitle: "Context Analogy",
                                                analogyContent: activeHighlight.analogy,
                                                analogyMapping: [],
                                                technicalExplanation: activeHighlight.explanation,
                                                keyTakeaways: [],
                                                microTestQuestion: '',
                                                realWorldApplication: ''
                                            } : null}
                                            onClose={() => setAgentState('HIDDEN')}
                                            standalone={false}
                                        />
                                     </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                     </div>
                 ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 bg-slate-100">Select a page.</div>
                 )}
            </div>

            {/* RIGHT SIDEBAR */}
            <AnimatePresence>
            {!isSidebarCollapsed.right && (
                <motion.div initial={{ width: 0 }} animate={{ width: 320 }} exit={{ width: 0 }} className="bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 z-20">
                    <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-center">
                         <div className="flex bg-slate-900 rounded-lg p-1 w-full overflow-x-auto no-scrollbar">
                             {['INSIGHTS', 'RESOURCES', 'CONCEPTS'].map(tab => (
                                 <button key={tab} onClick={() => setRightSidebarTab(tab as any)} className={`flex-1 py-1 px-2 rounded text-[10px] font-bold uppercase whitespace-nowrap ${rightSidebarTab===tab?'bg-slate-800 text-white':'text-slate-500'}`}>{tab}</button>
                             ))}
                         </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {rightSidebarTab === 'INSIGHTS' && (
                            <div className="space-y-6">
                                <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl relative overflow-hidden">
                                    {insights.loading && <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500"/></div>}
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-4 h-4 text-emerald-400"/>
                                        <span className="text-xs font-bold text-emerald-400 uppercase">Next Best Action</span>
                                    </div>
                                    <p className="text-sm text-slate-200 leading-relaxed">
                                        {insights.nextStep || "Start writing to get recommendations."}
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><CheckSquare size={12}/> Checkpoints</h4>
                                        <span className="text-[10px] text-slate-600">{(activeNote?.checkpoints || []).filter(c=>c.completed).length}/{(activeNote?.checkpoints || []).length}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {(activeNote?.checkpoints || []).map(cp => (
                                            <div key={cp.id} onClick={() => toggleCheckpoint(cp.id)} className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-colors ${cp.completed ? 'bg-green-900/20 border-green-500/30' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${cp.completed ? 'bg-green-500 border-green-500' : 'border-slate-500'}`}>
                                                    {cp.completed && <Check size={10} className="text-slate-900"/>}
                                                </div>
                                                <span className={`text-sm ${cp.completed ? 'text-green-400 line-through' : 'text-slate-300'}`}>{cp.label}</span>
                                            </div>
                                        ))}
                                        <div className="flex gap-2 mt-2">
                                            <input value={newCheckpointInput} onChange={e => setNewCheckpointInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addManualCheckpoint()} placeholder="Add task..." className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"/>
                                            <button onClick={addManualCheckpoint} disabled={!newCheckpointInput} className="bg-slate-800 px-2 rounded hover:bg-slate-700"><Plus size={14} className="text-slate-400"/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {rightSidebarTab === 'RESOURCES' && (
                            <div className="space-y-4">
                                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Add Credible Source</label>
                                    <input 
                                        value={resourceInput} 
                                        onChange={e => setResourceInput(e.target.value)} 
                                        placeholder="Paste YouTube or Article URL..." 
                                        className="w-full bg-slate-950 border border-slate-600 rounded-lg p-2 text-sm text-white mb-2 focus:border-emerald-500 outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <select value={resourceType} onChange={(e) => setResourceType(e.target.value as any)} className="bg-slate-950 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-300">
                                            <option value="ARTICLE">Article</option>
                                            <option value="VIDEO">Video</option>
                                        </select>
                                        <button onClick={handleAddResource} disabled={!resourceInput} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
                                            Add Resource
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {(activeNote?.references || []).map((ref) => (
                                        <div key={ref.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden group">
                                            <div className="p-3 border-b border-slate-700 flex items-center gap-2 bg-slate-800">
                                                {ref.type === 'VIDEO' ? <Video size={14} className="text-red-400"/> : <Link size={14} className="text-blue-400"/>}
                                                <span className="text-xs font-bold text-slate-300 truncate flex-1">{ref.title}</span>
                                                {analyzingResource === ref.id && <Loader2 size={12} className="animate-spin text-emerald-400"/>}
                                            </div>
                                            <div className="p-2 flex gap-1 bg-slate-900/50">
                                                <button 
                                                    onClick={() => handleUseResource(ref, 'SUMMARY')}
                                                    disabled={analyzingResource === ref.id}
                                                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-bold text-slate-400 hover:text-white border border-slate-700 transition"
                                                    title="Extract Key Points"
                                                >
                                                    Key Points
                                                </button>
                                                <button 
                                                    onClick={() => handleUseResource(ref, 'FULL')}
                                                    disabled={analyzingResource === ref.id}
                                                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-bold text-slate-400 hover:text-white border border-slate-700 transition"
                                                    title="Write full note section"
                                                >
                                                    Draft Note
                                                </button>
                                                <button 
                                                    onClick={() => handleUseResource(ref, 'COMPLETE')}
                                                    disabled={analyzingResource === ref.id}
                                                    className="flex-1 py-1.5 bg-emerald-900/30 hover:bg-emerald-900/50 rounded text-[10px] font-bold text-emerald-400 border border-emerald-500/20 transition"
                                                    title="Auto-complete using this source"
                                                >
                                                    Auto-Complete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {(activeNote?.references || []).length === 0 && (
                                        <div className="text-center py-8 text-slate-500 text-xs italic">
                                            No resources added yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {rightSidebarTab === 'CONCEPTS' && (
                             (activeNote?.highlights || []).map(hl => (
                                <div key={hl.id} className="p-3 rounded-xl border border-slate-700 bg-slate-800">
                                    <div className="text-teal-400 font-bold text-xs mb-1">{hl.text}</div>
                                    <div className="text-[10px] text-slate-400">"{hl.analogy}"</div>
                                </div>
                             ))
                        )}
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};

export default NotebookView;
