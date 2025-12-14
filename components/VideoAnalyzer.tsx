<<<<<<< HEAD

=======
>>>>>>> 2867a5c (Update wire connection visuals)
import React, { useState } from 'react';
import { analyzeVideo } from '../services/gemini';
import { VideoAnalysisResult } from '../types';
import { Youtube, Upload, Clock, Loader2, PlayCircle, ArrowLeft, Layers, FileText } from 'lucide-react';
<<<<<<< HEAD
import { motion } from 'framer-motion';
=======
import { motion as motionBase } from 'framer-motion';

const motion = motionBase as any;
>>>>>>> 2867a5c (Update wire connection visuals)

interface Props {
    initialUrl?: string;
    onBack: () => void;
}

const VideoAnalyzer: React.FC<Props> = ({ initialUrl = '', onBack }) => {
    const [url, setUrl] = useState(initialUrl);
    const [startTime, setStartTime] = useState('00:00');
    const [endTime, setEndTime] = useState('02:00');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<VideoAnalysisResult | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setVideoFile(e.target.files[0]);
    };

    const handleAnalyze = () => {
        if (!videoFile) {
            alert("Please upload the video clip. Direct YouTube download is restricted in browser.");
            return;
        }
        setLoading(true);
        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = (reader.result as string).split(',')[1];
            const context = `YouTube URL: ${url}. Timestamp: ${startTime} to ${endTime}`;
            const data = await analyzeVideo(base64, context);
            setResult(data);
            setLoading(false);
        };
        reader.readAsDataURL(videoFile);
    };

    return (
        <div className="max-w-5xl mx-auto p-6 min-h-screen">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                <ArrowLeft size={16}/> Back
            </button>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Input Panel */}
                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-widest mb-4">
                            <Youtube size={16}/> Video Intelligence
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold block mb-1">YouTube URL</label>
                                <input 
                                    value={url} 
                                    onChange={(e) => setUrl(e.target.value)} 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" 
                                    placeholder="https://youtube.com/..."
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Start Time</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/>
                                        <input 
                                            value={startTime} 
                                            onChange={(e) => setStartTime(e.target.value)} 
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 pl-9 text-white" 
                                            placeholder="00:00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold block mb-1">End Time</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/>
                                        <input 
                                            value={endTime} 
                                            onChange={(e) => setEndTime(e.target.value)} 
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 pl-9 text-white" 
                                            placeholder="02:00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-800 pt-4">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer hover:bg-slate-800/50 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 text-slate-400 mb-2"/>
                                        <p className="text-sm text-slate-400 font-bold">{videoFile ? videoFile.name : "Upload Clip (MP4)"}</p>
                                        <p className="text-xs text-slate-600 mt-1">Required for Gemini Analysis</p>
                                    </div>
                                    <input type="file" className="hidden" accept="video/mp4" onChange={handleFileSelect} />
                                </label>
                            </div>

                            <button 
                                onClick={handleAnalyze} 
                                disabled={loading || !videoFile}
                                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 disabled:opacity-50 transition-all"
                            >
                                {loading ? <Loader2 className="animate-spin"/> : <PlayCircle/>} Analyze Segment
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed text-center p-8">
                            <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4"/>
                            <h3 className="text-white font-bold">Watching Video...</h3>
                            <p className="text-slate-500 text-sm">Gemini Pro is extracting concepts and generating flashcards.</p>
                        </div>
                    ) : !result ? (
                        <div className="h-full flex flex-col items-center justify-center bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed text-slate-500 text-center p-8">
                            <Layers className="w-12 h-12 mb-4 opacity-20"/>
                            <p>Upload a clip to see the breakdown.</p>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            {/* Summary */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-primary-400"/> Summary</h3>
                                <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
                            </div>

                            {/* Analogies */}
                            <div className="space-y-3">
                                {result.analogies.map((item, i) => (
                                    <div key={i} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                        <div className="text-primary-400 font-bold text-sm mb-1">{item.concept}</div>
                                        <div className="text-slate-300 text-sm italic">"{item.analogy}"</div>
                                    </div>
                                ))}
                            </div>

                            {/* Flashcards */}
                            <div>
                                <h3 className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-3">Flashcards</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {result.flashcards.map((card, i) => (
                                        <div key={i} className="group perspective cursor-pointer h-24">
                                            <div className="relative preserve-3d group-hover:my-rotate-y-180 w-full h-full duration-500">
                                                <div className="absolute backface-hidden w-full h-full bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center p-4 text-center">
                                                    <span className="text-white font-bold text-sm">{card.front}</span>
                                                </div>
                                                <div className="absolute my-rotate-y-180 backface-hidden w-full h-full bg-primary-900/20 border border-primary-500/30 rounded-xl flex items-center justify-center p-4 text-center">
                                                    <span className="text-primary-200 text-sm">{card.back}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

<<<<<<< HEAD
export default VideoAnalyzer;
=======
export default VideoAnalyzer;
>>>>>>> 2867a5c (Update wire connection visuals)
