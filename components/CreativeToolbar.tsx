
import React from 'react';
import { MousePointer2, PenTool, Lasso, Eraser } from 'lucide-react';
import MicButton from './MicButton';

interface CreativeToolbarProps {
  currentTool: 'cursor' | 'pen' | 'lasso' | 'mic' | 'eraser';
  onSelectTool: (tool: 'cursor' | 'pen' | 'lasso' | 'eraser') => void;
  
  // Audio Props
  isRecording: boolean;
  audioMode: 'idle' | 'dictation' | 'voice_note';
  onStartDictation: () => void;
  onStopDictation: () => void;
  onStartVoiceNote: () => void;
  onStopVoiceNote: () => void;
}

const CreativeToolbar: React.FC<CreativeToolbarProps> = ({ 
  currentTool, 
  onSelectTool,
  isRecording,
  audioMode,
  onStartDictation,
  onStopDictation,
  onStartVoiceNote,
  onStopVoiceNote
}) => {

  return (
    <div 
        className="bg-white/95 border border-stone-200 shadow-xl rounded-full px-6 py-3 flex gap-6 transition-all hover:bg-white mx-auto items-center z-50"
    >
      
      <button 
        onClick={() => onSelectTool('cursor')}
        className={`p-2 rounded-full transition-all ${currentTool === 'cursor' ? 'bg-stone-800 text-white shadow-lg scale-110' : 'text-stone-600 hover:bg-stone-100'}`}
        title="Selection Mode"
      >
        <MousePointer2 size={20} />
      </button>

      <button 
        onClick={() => onSelectTool('pen')}
        className={`p-2 rounded-full transition-all ${currentTool === 'pen' ? 'bg-stone-800 text-white shadow-lg scale-110' : 'text-stone-600 hover:bg-stone-100'}`}
        title="Draw Mode"
      >
        <PenTool size={20} />
      </button>
      
      <button 
        onClick={() => onSelectTool('eraser')}
        className={`p-2 rounded-full transition-all ${currentTool === 'eraser' ? 'bg-stone-800 text-white shadow-lg scale-110' : 'text-stone-600 hover:bg-stone-100'}`}
        title="Eraser"
      >
        <Eraser size={20} />
      </button>

      <button 
        onClick={() => onSelectTool('lasso')}
        className={`p-2 rounded-full transition-all ${currentTool === 'lasso' ? 'bg-stone-800 text-white shadow-lg scale-110' : 'text-stone-600 hover:bg-stone-100'}`}
        title="Smart Lasso"
      >
        <Lasso size={20} />
      </button>

      <div className="w-px h-8 bg-stone-300 mx-1"></div>

      {/* Rebuilt Mic Button with Hook Integration */}
      <MicButton 
        isRecording={isRecording}
        mode={audioMode}
        onStartDictation={onStartDictation}
        onStopDictation={onStopDictation}
        onStartVoiceNote={onStartVoiceNote}
        onStopVoiceNote={onStopVoiceNote}
      />

    </div>
  );
};

export default CreativeToolbar;
