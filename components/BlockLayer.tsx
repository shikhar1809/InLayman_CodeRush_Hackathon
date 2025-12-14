
import React from 'react';
import { ContentBlock } from '../types';
import ScrapbookItem from './ScrapbookItem';
import SmartEditor from './SmartEditor';
import SmartEmbed from './SmartEmbed';
import MindMapBlock from './MindMapBlock';
import VoiceTapeBlock from './VoiceTapeBlock';
import TopicCard from './TopicCard';
import ExamStamp from './ExamStamp';
import { Heart } from 'lucide-react';

interface BlockLayerProps {
    blocks: ContentBlock[];
    audioMode: string;
    liveTranscript: string;
    activeBlockId: string | null;
    focusMode: boolean;
    tool: string;
    selection: { blockId?: string; blockIds?: string[] } | null;
    fontClass: string;
    textColorClass: string;
    onUpdateBlock: (id: string, updates: Partial<ContentBlock>) => void;
    onFocusBlock: (id: string) => void;
    onRemoveBlock: (id: string) => void;
    onResizeBlock: (id: string, dw: number, dh: number) => void;
    onConvertLink: (url: string, id: string, start: number, end: number) => void;
    onSelectionChange: (sel: any) => void;
    onStopDictation: () => void;
    onAddToStaging: (type: any, content: string, extra: any) => void;
    registerBlockRef: (id: string, el: HTMLElement | null) => void;
}

const BlockLayer: React.FC<BlockLayerProps> = ({
    blocks, audioMode, liveTranscript, activeBlockId, focusMode, tool, selection,
    fontClass, textColorClass, onUpdateBlock, onFocusBlock, onRemoveBlock, 
    onResizeBlock, onConvertLink, onSelectionChange, onStopDictation, onAddToStaging,
    registerBlockRef
}) => {
    return (
        <div className="space-y-6 flex-grow relative">
            {blocks.map((block, index) => {
                // --- FLOW BLOCKS (Text & Smart Embeds without coords) ---
                if (block.type === 'text' || (block.type === 'smart_embed' && block.x === undefined)) {
                    if (block.type === 'smart_embed') {
                        return (
                            <div 
                                key={block.id} 
                                id={`block-${block.id}`}
                                ref={(el) => registerBlockRef(block.id, el)}
                                className="w-full flex justify-center py-2 animate-pop-in"
                            >
                                <SmartEmbed url={block.content} type={block.embed_type} emoji={block.emoji_char} onUpdateType={(t) => onUpdateBlock(block.id, { embed_type: t })} />
                            </div>
                        )
                    }
                    
                    const isTargetBlock = activeBlockId === block.id || (!activeBlockId && index === blocks.length - 1);
                    const displayContent = (isTargetBlock && audioMode === 'dictation' && liveTranscript) 
                        ? block.content + ' ' + liveTranscript 
                        : block.content;

                    return (
                        <div 
                            key={block.id} 
                            id={`block-${block.id}`}
                            ref={(el) => registerBlockRef(block.id, el)}
                            className="relative group"
                        >
                            {block.exam_metadata && !focusMode && <ExamStamp metadata={block.exam_metadata} />}
                            <div className="min-h-[100px] relative">
                                <SmartEditor 
                                    content={displayContent}
                                    onChange={(val) => onUpdateBlock(block.id, { content: val })}
                                    onFocus={() => { onFocusBlock(block.id); onSelectionChange(null); }}
                                    fontClass={fontClass} textColorClass={textColorClass} lineHeight={'32px'}
                                    isLocked={block.locked}
                                    onUnlock={() => onUpdateBlock(block.id, { locked: false })}
                                    onConvertLink={(url, start, end) => onConvertLink(url, block.id, start, end)}
                                    onEntityClick={(text) => { if (tool === 'cursor' && !block.locked) onSelectionChange({ text, blockId: block.id }); }}
                                    onSelect={(e) => { 
                                        if (tool !== 'cursor' || block.locked) return; 
                                        const target = e.target as HTMLTextAreaElement; 
                                        if (target.selectionStart !== target.selectionEnd) {
                                            const text = target.value.substring(target.selectionStart, target.selectionEnd); 
                                            if (text.length > 3) onSelectionChange({ text, blockId: block.id }); 
                                        }
                                    }}
                                    isDictating={isTargetBlock && audioMode === 'dictation' && !block.locked}
                                    onStopDictation={onStopDictation}
                                    activeTool={tool as any}
                                    isSelected={selection?.blockId === 'lasso-group' && selection.blockIds?.includes(block.id)}
                                />
                            </div>
                            <div className={`absolute -left-8 top-0 transition-opacity ${focusMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                                {index === blocks.length - 1 && <button onClick={() => {/* handled by parent usually, but could emit add event here */}} className="text-stone-300 hover:text-stone-500">+</button>}
                            </div>
                        </div>
                    )
                }

                // --- CANVAS BLOCKS (Absolute Positioned) ---
                return (
                    <div 
                        key={block.id} 
                        id={`block-${block.id}`} 
                        ref={(el) => registerBlockRef(block.id, el)}
                    >
                        <ScrapbookItem 
                            id={block.id} x={block.x || 40} y={block.y || (index * 100)} width={block.width} height={block.height}
                            onResizeStop={(dw, dh) => onResizeBlock(block.id, dw, dh)}
                            onDelete={() => onRemoveBlock(block.id)}
                        >
                            {block.type === 'mindmap_code' && <div className="bg-white/80 p-1 rounded shadow border border-stone-200 w-full h-full overflow-hidden"><MindMapBlock code={block.content} /></div>}
                            {block.type === 'sticky_note' && <div style={{ transform: `rotate(${block.rotation || 0}deg)` }} className="bg-highlight p-4 shadow-md w-full h-full font-handwriting text-xl text-stone-800 relative flex items-center justify-center text-center leading-tight">{block.content}</div>}
                            {block.type === 'smart_embed' && <div style={{ transform: `rotate(${block.rotation || 0}deg)` }}><SmartEmbed url={block.content} type={block.embed_type} emoji={block.emoji_char} onUpdateType={(t) => onUpdateBlock(block.id, { embed_type: t })} /></div>}
                            {block.type === 'audio_tape' && block.audio_url && <div style={{ transform: `rotate(${block.rotation || 0}deg)` }} className="w-full h-full"><VoiceTapeBlock audioUrl={block.audio_url} duration={block.duration || "0:00"} transcript={block.content} styleVariant={block.tape_style} /></div>}
                            {block.type === 'topic_card' && <div style={{ transform: `rotate(${block.rotation || 0}deg)` }} className="w-full h-full"><TopicCard profile={JSON.parse(block.content)} onPractice={(q, a) => onAddToStaging('sticky_note', `Q: ${q}\n\nA: ${a}`, { rotation: (Math.random() * 4 - 2) })} /></div>}
                            {block.type === 'community_snippet' && (
                                <div style={{ transform: `rotate(${block.rotation || 0}deg)` }} className="w-full h-full relative">
                                    <div className={`p-4 shadow-md w-full h-full flex flex-col justify-center items-center text-center leading-tight relative border ${JSON.parse(block.content).type === 'CHEAT_CODE' ? 'bg-red-50 border-red-200 text-red-900' : JSON.parse(block.content).type === 'ELI5' ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-yellow-100 border-yellow-200 text-yellow-900'}`}>
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-600 shadow-sm border border-red-800 z-10"></div>
                                        <div className="font-handwriting text-lg">{JSON.parse(block.content).content}</div>
                                        <div className="mt-2 flex items-center gap-1 text-[10px] opacity-60 font-bold uppercase tracking-wider"><Heart size={10} className="fill-current"/> {JSON.parse(block.content).likes} Likes</div>
                                    </div>
                                </div>
                            )}
                        </ScrapbookItem>
                    </div>
                );
            })}
        </div>
    );
};

export default BlockLayer;
