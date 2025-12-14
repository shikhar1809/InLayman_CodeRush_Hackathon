
import { useState, useEffect, useRef, useCallback } from 'react';

type AudioMode = 'idle' | 'dictation' | 'voice_note';

interface UseAudioControllerProps {
  onDictationCommit: (text: string) => void;
  onVoiceNoteComplete: (blob: Blob, durationMs: number) => void;
}

export const useAudioController = ({ onDictationCommit, onVoiceNoteComplete }: UseAudioControllerProps) => {
  const [mode, setMode] = useState<AudioMode>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Refs for instances to prevent zombie closures
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  // Refs for state access inside callbacks
  const modeRef = useRef<AudioMode>(mode);
  const isRecordingRef = useRef(isRecording);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // --- CLEANUP: KILL ZOMBIES ON UNMOUNT ---
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop(); 
        recognitionRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
    };
  }, []);

  // --- MODE A: DICTATION (Web Speech API) ---
  const startDictation = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    // Prevent Double Activation
    if (modeRef.current === 'dictation') return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setMode('dictation');
      setIsRecording(true);
      setLiveTranscript('');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) {
        onDictationCommit(final.trim() + ' ');
      }
      setLiveTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        alert("Microphone access denied.");
      }
      // Don't fully stop on 'no-speech', just keep listening or let user stop
      if (event.error !== 'no-speech') {
          stopDictation();
      }
    };

    recognition.onend = () => {
      // If we are still strictly in dictation mode, the browser might have timed out.
      // We can choose to restart or just go idle. For explicit control, we go idle.
      if (modeRef.current === 'dictation') {
         setMode('idle');
         setIsRecording(false);
         setLiveTranscript('');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onDictationCommit]);

  const stopDictation = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setMode('idle');
    setIsRecording(false);
    setLiveTranscript('');
  }, []);

  // --- MODE B: VOICE NOTE (MediaRecorder) ---
  const startVoiceNote = useCallback(async () => {
    if (modeRef.current !== 'idle') return; 

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Safari/iOS often needs 'audio/mp4' or blank, Chrome prefers 'audio/webm'
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      startTimeRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const duration = Date.now() - startTimeRef.current;
        const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        
        // Only verify logic here, data handling is in callback
        onVoiceNoteComplete(blob, duration);
        
        // Stop tracks
        stream.getTracks().forEach(track => track.stop());
        
        setMode('idle');
        setIsRecording(false);
      };

      recorder.start();
      setMode('voice_note');
      setIsRecording(true);

    } catch (e) {
      console.error("Voice Note Error", e);
      // Fail silently or show toast in UI
    }
  }, [onVoiceNoteComplete]);

  const stopVoiceNote = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return {
    mode,
    isRecording,
    liveTranscript,
    startDictation,
    stopDictation,
    startVoiceNote,
    stopVoiceNote
  };
};
