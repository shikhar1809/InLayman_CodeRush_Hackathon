
import React, { useRef, useState } from 'react';
import { Camera, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { generateObjectAnalogy } from '../services/gemini';

interface Props {
    onBack: () => void;
}

const AnalogyAR: React.FC<Props> = ({ onBack }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const startCamera = async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setStream(s);
            if (videoRef.current) videoRef.current.srcObject = s;
        } catch (e) {
            alert("Camera access denied.");
        }
    };

    const stopCamera = () => {
        stream?.getTracks().forEach(t => t.stop());
        setStream(null);
    };

    const handleCapture = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg');
        setCapturedImage(base64);
        stopCamera();
        analyze(base64.split(',')[1]);
    };

    const analyze = async (base64: string) => {
        setLoading(true);
        const text = await generateObjectAnalogy(base64);
        setAnalysis(text);
        setLoading(false);
    };

    const reset = () => {
        setCapturedImage(null);
        setAnalysis(null);
        startCamera();
    };

    React.useEffect(() => {
        startCamera();
        return stopCamera;
    }, []);

    return (
        <div className="h-screen bg-black flex flex-col relative overflow-hidden">
            <button onClick={() => { stopCamera(); onBack(); }} className="absolute top-4 left-4 z-20 text-white bg-black/50 p-2 rounded-full"><ArrowLeft/></button>
            
            <div className="flex-1 relative">
                {!capturedImage ? (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover opacity-50" />
                )}
                
                {/* Overlay UI */}
                {!capturedImage && (
                    <div className="absolute bottom-10 left-0 right-0 flex justify-center pb-10">
                        <button onClick={handleCapture} className="w-20 h-20 rounded-full border-4 border-white bg-white/20 flex items-center justify-center">
                            <div className="w-16 h-16 bg-white rounded-full"></div>
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
                        <Loader2 className="w-12 h-12 text-primary-500 animate-spin"/>
                        <span className="text-white font-bold mt-2 bg-black/50 px-3 py-1 rounded">Scanning Object...</span>
                    </div>
                )}

                {analysis && (
                    <div className="absolute inset-x-0 bottom-0 bg-slate-900/90 p-6 rounded-t-3xl border-t border-slate-700 z-30 animate-slide-up">
                        <h3 className="text-primary-400 font-bold uppercase text-xs mb-2">Object Analysis</h3>
                        <p className="text-white text-lg leading-relaxed mb-6">{analysis}</p>
                        <button onClick={reset} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                            <RefreshCw size={16}/> Scan Another Object
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalogyAR;
