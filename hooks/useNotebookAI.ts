
import React, { useState } from 'react';
import { NoteSession, ContentBlock, StyleProfile, RevisionMode, QuickQuizResult, DeepDiveResult, HighYieldResult, QuizQuestion } from '../types';
import { generateId } from '../utils';
import { 
    explainText, generateMindmapCode, enhanceTextWithContext, 
    checkExamFrequency, generateGapAnalysisQuiz, generateGoalAlignment, 
    generateRevisionArtifact, searchCommunitySnippets, generateAutopilotNotes, 
    generateHandshakeQuestion, ingestResource 
} from '../services/geminiService';

interface UseNotebookAIProps {
    session: NoteSession;
    setSession: React.Dispatch<React.SetStateAction<NoteSession>>;
    setStagingBlocks: React.Dispatch<React.SetStateAction<ContentBlock[]>>;
    startLoading: (msg: string) => void;
    stopLoading: () => void;
    showToast: (msg: string, type: 'success' | 'error') => void;
    setWingerMessage: (msg: string | null) => void;
    addBlock: (type: any, content: string, ai_generated?: boolean, extra?: any) => void;
    addToStaging: (type: any, content: string, extra?: any) => void;
}

export const useNotebookAI = ({ 
    session, setSession, setStagingBlocks, 
    startLoading, stopLoading, showToast, setWingerMessage, 
    addBlock, addToStaging 
}: UseNotebookAIProps) => {
    
    const [quizData, setQuizData] = useState<{ title: string, questions: any[], unlockBlockId?: string } | null>(null);
    const [revisionSheetContent, setRevisionSheetContent] = useState<string | null>(null);
    const [autopilotLoading, setAutopilotLoading] = useState(false);
    const [revisionLoading, setRevisionLoading] = useState(false);

    // 1. Explain / Analogy
    const handleExplain = async (selectionText: string) => {
        startLoading("Explaining with Analogy...");
        try {
            const result = await explainText(selectionText, session.grounding_context?.raw_text);
            setWingerMessage(result.analogy);
            addToStaging('sticky_note', `Analogy: ${result.analogy}`, { rotation: (Math.random() * 4 - 2) });
        } catch (e) { console.error(e); }
        stopLoading();
    };

    // 2. Enhance Text
    const handleEnhance = async (selectionText: string) => {
        startLoading("Enhancing Text...");
        try {
            const enhanced = await enhanceTextWithContext(selectionText, session.grounding_context?.raw_text);
            addToStaging('text', enhanced);
        } catch (e) { console.error(e); }
        stopLoading();
    };

    // 3. Lookup (Personal vs Community)
    const handleLookup = async (selectionText: string, selectionBlockId: string | undefined, source: 'personal' | 'community') => {
        if (source === 'community') {
            showToast("Searching Community Notes...", 'success');
            startLoading("Scanning Community Knowledge...");
            try {
                const snippets = await searchCommunitySnippets(selectionText, session.grounding_context?.raw_text);
                if (snippets.length === 0) { showToast("No community notes found.", 'error'); return; }
                snippets.forEach(snippet => addToStaging('community_snippet', JSON.stringify(snippet), { rotation: (Math.random() * 4 - 2) }));
                showToast(`Found ${snippets.length} Community Clips`, 'success');
            } catch (e) { showToast("Failed to search.", 'error'); } finally { stopLoading(); }
        } else {
            // Personal Search
            startLoading("Searching Notebook...");
            const term = selectionText.toLowerCase();
            const matches = session.content_blocks.filter(b => 
                b.id !== selectionBlockId && 
                b.type === 'text' && 
                b.content.toLowerCase().includes(term)
            );
            
            if (matches.length > 0) {
                 matches.forEach(m => {
                     const snippet = {
                         id: m.id,
                         type: 'ELI5',
                         content: `...${m.content.substring(0, 150)}...`,
                         author_tag: 'Internal Reference',
                         likes: 1
                     };
                     addToStaging('community_snippet', JSON.stringify(snippet), { rotation: (Math.random() * 4 - 2) });
                 });
                 showToast(`Found ${matches.length} matches.`, 'success');
            } else {
                showToast("No matches found.", 'error');
            }
            stopLoading();
        }
    };

    // 4. Visualize
    const handleVisualize = async (selectionText: string) => {
        startLoading("Generating Mind Map...");
        try {
            const code = await generateMindmapCode(selectionText);
            addToStaging('mindmap_code', code);
        } catch(e) { console.error(e); }
        stopLoading();
    };

    // 5. Test Me
    const runTestMe = async () => {
        const allText = session.content_blocks.map(b => b.content).join(' ');
        if (allText.length < 50) return alert("Write more notes first to generate an exam!");
        startLoading("Drafting Hybrid Exam...");
        try {
            const questions = await generateGapAnalysisQuiz(allText, session.goal_context.objective);
            if (questions && questions.length > 0) {
                setQuizData({ title: "Gap Analysis Exam", questions });
            } else {
                showToast("Failed to generate enough questions.", 'error');
            }
        } catch (e) { showToast("Failed to generate exam.", 'error'); } 
        finally { stopLoading(); }
    };

    // 6. Autopilot Generation
    const handleAutopilotGeneration = async (sourceText: string, manualTopic: string, style: StyleProfile) => {
        setAutopilotLoading(true);
        showToast("Autopilot Engaged...", 'success');
        
        let effectiveSource = sourceText;
        let effectiveGoal = session.goal_context.objective;

        if (manualTopic) {
            if (effectiveSource) {
                effectiveGoal = `${manualTopic}. Context Goal: ${effectiveGoal}`;
            } else {
                effectiveSource = manualTopic;
                startLoading(`Autopilot: Researching "${manualTopic.substring(0, 20)}..."`);
            }
        } else {
            startLoading("Autopilot: Analyzing Source...");
        }
        
        setSession(prev => ({
            ...prev,
            style_profile: style,
            visual_style: { ...prev.visual_style, font: style.detected_font },
            grounding_context: { raw_text: effectiveSource, source_summary: prev.grounding_context?.source_summary || manualTopic || "Autopilot Source" }
        }));

        try {
            const styledNotes = await generateAutopilotNotes(effectiveSource, style, effectiveGoal);
            const handshakeQ = await generateHandshakeQuestion(styledNotes);
            const mermaidMatch = styledNotes.match(/```mermaid([\s\S]*?)```/);
            let textPart = styledNotes;
            let codePart = "";

            if (mermaidMatch) {
                codePart = mermaidMatch[1].trim();
                textPart = styledNotes.replace(mermaidMatch[0], '*[Diagram Generated Below]*');
            }
            addBlock('text', textPart, true, { locked: true, handshake_question: handshakeQ });
            if (codePart) addBlock('mindmap_code', codePart, true, { locked: true });
            showToast("Notes Generated!", 'success');
        } catch (e) { showToast("Failed to generate notes.", 'error'); } finally { setAutopilotLoading(false); stopLoading(); }
    };

    // 7. Revision Artifacts
    const handleRevisionModeSelect = async (mode: RevisionMode) => {
        if (mode === 'AUDIO_SUMMARY') return; // Handled by View
        setRevisionLoading(true);
        startLoading("Generating Revision Materials...");
        const allText = session.content_blocks.map(b => b.content).join('\n');
        try {
            const artifact = await generateRevisionArtifact(mode, allText);
            if (!artifact) throw new Error("Generation failed");

            switch (mode) {
                case 'QUICK_TEST':
                     const resultQT = artifact as QuickQuizResult;
                     if (resultQT?.questions && resultQT.questions.length > 0) {
                          const quizQs: QuizQuestion[] = resultQT.questions.map(q => ({
                              type: 'MCQ',
                              question: q.q, options: q.options, correctIndex: q.correct, explanation: "Review your notes for details."
                          }));
                          setQuizData({ title: "Quick Sprint", questions: quizQs });
                     } else { showToast("Could not generate questions.", 'error'); }
                     break;
                case 'DETAILED_TEST':
                    const resultDT = artifact as DeepDiveResult;
                    if (resultDT?.questions) {
                        resultDT.questions.forEach((q, i) => addToStaging('text', `🧠 Deep Dive Q${i+1}:\n${q.q}\n\nRubric:\n${q.rubric_keywords.map(k => `• ${k}`).join('\n')}`));
                        showToast("Questions added to Insights", 'success');
                    }
                    break;
                case 'IMPORTANT_Q':
                    const resultHY = artifact as HighYieldResult;
                    if (resultHY?.items) {
                        resultHY.items.forEach(item => addToStaging('sticky_note', `🎯 ${item.topic}\n\nQ: ${item.question}\n\nFrequency: ${item.exam_frequency}`, { rotation: (Math.random() * 4 - 2) }));
                        showToast("High Yield Qs Added", 'success');
                    }
                    break;
                case 'CHEAT_SHEET':
                    setRevisionSheetContent(artifact as string);
                    break;
            }
        } catch (e) { 
            console.error(e);
            showToast("Failed to generate revision artifact.", 'error'); 
        } finally { 
            setRevisionLoading(false);
            stopLoading(); 
        }
    };

    // 8. Analyze Goal
    const handleAnalyzeGoal = async () => {
        if (!session.goal_context.objective) return;
        setAutopilotLoading(true);
        startLoading("Analyzing Goal Alignment...");
        try {
            const allText = session.content_blocks.map(b => b.content).join('\n');
            const suggestions = await generateGoalAlignment(session.goal_context.objective, allText);
            suggestions.forEach(s => addToStaging('sticky_note', `${s}`, { rotation: (Math.random() * 4 - 2) }));
            showToast("Suggestions Ready", 'success');
        } catch(e) { showToast("Could not analyze alignment.", 'error'); } finally { setAutopilotLoading(false); stopLoading(); }
    };

    const handleModalContextUpload = async (file: File): Promise<string> => {
        const reader = new FileReader();
        startLoading("Ingesting Document...");
        return new Promise((resolve, reject) => {
            reader.onload = async () => {
                try {
                    const base64 = (reader.result as string).split(',')[1];
                    const extractedText = await ingestResource(base64, file.type);
                    setSession(prev => ({ ...prev, grounding_context: { raw_text: extractedText, source_summary: file.name } }));
                    resolve(extractedText);
                } catch (e) { reject(e); } finally { stopLoading(); }
            };
            reader.readAsDataURL(file);
        });
    };

    return {
        quizData, setQuizData,
        revisionSheetContent, setRevisionSheetContent,
        autopilotLoading,
        revisionLoading,
        handleExplain, handleEnhance, handleLookup, handleVisualize,
        runTestMe, handleAutopilotGeneration, handleRevisionModeSelect,
        handleAnalyzeGoal, handleModalContextUpload
    };
};
