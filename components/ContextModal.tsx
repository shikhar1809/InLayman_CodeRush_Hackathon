import React, { useState } from 'react';
import { ingestResource } from '../services/geminiService';
import { Upload, BookOpen } from 'lucide-react';

interface ContextModalProps {
  onSetContext: (contextText: string, goal: string) => void;
}

const ContextModal: React.FC<ContextModalProps> = ({ onSetContext }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [goal, setGoal] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleIngest = async () => {
    if (!goal) return;
    setLoading(true);
    let extractedText = "";

    try {
        if (files && files.length > 0) {
            setStatus('Reading document...');
            const file = files[0];
            const reader = new FileReader();
            
            const base64Promise = new Promise<string>((resolve) => {
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });

            const base64Data = (await base64Promise).split(',')[1];
            setStatus('AI Extracting knowledge...');
            extractedText = await ingestResource(base64Data, file.type);
        }
        
        onSetContext(extractedText, goal);
        setIsOpen(false);
    } catch (e) {
        console.error(e);
        setStatus('Error extracting text.');
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="bg-[#fdfbf7] w-full max-w-lg p-8 rounded-xl shadow-2xl border border-stone-200">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-stone-200 rounded-full">
                <BookOpen className="text-stone-700" size={24} />
            </div>
            <h2 className="text-2xl font-serif font-bold text-ink">Setup Workspace</h2>
        </div>
        
        <p className="text-stone-500 font-serif mb-6">Help Winger understand your goal and source material.</p>

        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">The Goal</label>
                <input 
                    type="text" 
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Master React Hooks by Sunday"
                    className="w-full p-3 bg-white border border-stone-200 rounded-lg font-handwriting text-xl focus:ring-2 focus:ring-stone-400 outline-none"
                />
            </div>

            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Primary Source (PDF/Image)</label>
                <div className="relative border-2 border-dashed border-stone-300 rounded-lg p-6 hover:bg-stone-50 transition-colors text-center cursor-pointer group">
                    <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={(e) => setFiles(e.target.files)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="mx-auto text-stone-400 group-hover:text-stone-600 mb-2" />
                    <p className="text-sm text-stone-500 font-serif">
                        {files ? files[0].name : "Drag & Drop or Click to Upload"}
                    </p>
                </div>
            </div>

            {status && <p className="text-sm text-blue-500 font-serif animate-pulse">{status}</p>}

            <button 
                onClick={handleIngest}
                disabled={loading}
                className="w-full bg-stone-800 text-stone-100 py-3 rounded-lg font-serif font-medium hover:bg-stone-700 transition-all disabled:opacity-50"
            >
                {loading ? 'Analyzing...' : 'Initialize Session'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ContextModal;
