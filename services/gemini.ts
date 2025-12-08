

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Question, LearningPath, AnalogyContent, LiveConfig, DocumentAnalysis, TestResult, ComplexityLevel, CodeAnalysis, PracticeState, ScenarioState, CheatSheetData, CapstoneProject, PodcastData, VideoAnalysisResult, NextSteps, DayPlan, PrerequisiteNode, Flashcard, Checkpoint, NoteReference, CodeDeepAnalysis, CodeReconstructionResult, ScenarioLevel } from '../types';

// Global instance 
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const TEXT_MODEL = 'gemini-2.5-flash';
const REASONING_MODEL = 'gemini-3-pro-preview';
const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

// --- INTENT & CLASSIFICATION ---

export const classifyIntent = async (input: string): Promise<{ type: string, correctedTopic?: string, reason?: string }> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Classify the user input: "${input}". 
        Categories: 
        - LEARN (general topic, "I want to learn", "explain")
        - CODE (programming code, specific coding framework, "write python")
        - TEST (quizzes, "test me", "quiz me")
        - PRACTICE (teaching back, "I want to practice", "feynman technique")
        - APPLY (scenarios, simulations, "apply knowledge", "real world scenario", "test my skills")
        - VIDEO (youtube url)
        - INVALID (nsfw/personal).
        
        If typo, provide correctedTopic.
        JSON Response: { type: string, correctedTopic?: string, reason?: string }`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const analyzeImageInput = async (base64: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64 } }, { text: "What educational topic is shown in this image? Return just the topic name." }] }
    });
    return response.text || "";
};

// --- CORE LEARNING ---

export const generateProficiencyTest = async (topic: string): Promise<Question[]> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Generate 5 multiple choice questions to test proficiency in "${topic}".
        JSON format: [{ id: string, text: string, options: string[], correctAnswer: number }]`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '[]');
};

export const generateQuiz = async (topic: string): Promise<Question[]> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Generate 15 multiple choice questions to test proficiency in "${topic}".
        JSON format: [{ id: string, text: string, options: string[], correctAnswer: number }]`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '[]');
};

export const generatePrerequisiteGraph = async (topic: string, level: string): Promise<LearningPath> => {
    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: `Create a strict prerequisite learning path leading UP TO the concept: "${topic}" at a ${level} level.
        
        CRITICAL RULES:
        1. The path must ONLY contain concepts necessary to understand "${topic}".
        2. The VERY LAST node in the 'nodes' array MUST be "${topic}" itself.
        3. Do NOT include topics that come after "${topic}" (no future applications, no advanced extensions).
        4. Order the 'nodes' array topologically: start with the most basic prerequisite (Step 1) and end with "${topic}".
        
        Return a JSON object:
        { 
            topic: "${topic}", 
            nodes: {
                id: string, 
                label: string, 
                status: 'locked' | 'available', 
                description: string (brief explanation of why this prerequisite is needed), 
                time: string
            }[], 
            links: {source: string, target: string}[] 
        }`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const generateAnalogyContent = async (concept: string, context: string, variation: boolean, disliked: string[], liked: string[], complexity: ComplexityLevel, prevDomain?: string | null): Promise<AnalogyContent> => {
    const prompt = `Explain "${concept}" in the context of "${context}".
    Use an analogy from a domain like: ${liked.join(', ')} (Avoid: ${disliked.join(', ')}).
    Complexity: ${complexity}.
    ${variation ? 'Provide a DIFFERENT analogy than before.' : ''}
    ${prevDomain ? `Connect it to the previous concept of ${prevDomain} if possible (Golden Thread).` : ''}
    
    JSON Schema:
    {
        concept: string,
        domain: string,
        analogyTitle: string,
        analogyContent: string,
        analogyMapping: { analogyTerm: string, technicalTerm: string, explanation: string }[],
        technicalExplanation: string,
        keyTakeaways: string[],
        microTestQuestion: string,
        diagram: string (Mermaid JS syntax for a flowchart/graph),
        realWorldApplication: string
    }`;

    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const evaluateExplanation = async (concept: string, question: string, answer: string): Promise<{ score: number, feedback: string, isMastered: boolean }> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Evaluate this answer for concept "${concept}". Question: "${question}". Answer: "${answer}".
        JSON: { score: number (0-100), feedback: string, isMastered: boolean (score > 85) }`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const generateAnalogyImage = async (concept: string, title: string, analogy: string): Promise<string> => {
    // Generate prompt for image
    const response = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: { parts: [{ text: `Create a visual illustration for an analogy. 
        Concept: ${concept}. 
        Analogy Title: ${title}. 
        Analogy Description: ${analogy}. 
        Style: Minimalist vector art, clean lines, educational infographic style.` }] }
    });
    
    // Extract base64 from response parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return "";
};

// --- NOTEBOOK & DOCUMENTS ---

export const analyzeDocument = async (base64: string, mimeType: string): Promise<DocumentAnalysis> => {
    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64 } },
                { text: `Analyze this document. 
                1. Summarize it. 
                2. Break it down into sections. 
                3. For each section, provide the verbatim content (or simplified if too complex) AND an analogy note.
                4. Extract key concepts (terms) that appear EXACTLY in the text.
                
                JSON Schema:
                {
                    title: string,
                    summary: string,
                    sections: { title: string, content: string, analogyNote: string }[],
                    keyConcepts: { term: string, definition: string, analogy: string }[],
                    actionItems: string[]
                }` }
            ]
        },
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const enhanceNoteContent = async (text: string, goal?: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: `Enhance this note content: "${text}".
        ${goal ? `User Goal: ${goal}. Ensure the tone aligns with this.` : ''}
        Improve clarity, fix grammar, and expand on key points using academic yet accessible language.
        Use Google Search to verify facts if needed.`,
        config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || text;
};

export const generateNoteVisual = async (text: string): Promise<{ code: string, description: string, imageUrl?: string }> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Generate a Mermaid.js diagram to visualize: "${text}".
        CRITICAL RULES for CLEAN DIAGRAMS:
        1. Use 'graph LR' (Left to Right) for flow.
        2. Limit to max 6 nodes total.
        3. Use rounded nodes (id1(Label)).
        4. Keep node labels VERY short (max 4 words).
        5. Avoid crossing lines.
        
        Return JSON: { code: string (valid mermaid syntax), description: string }`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const suggestSimilarQuestion = async (text: string, goal?: string): Promise<{ text: string, options: string[], correctAnswer: number }> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Create a practice question based on this text: "${text}".
        ${goal ? `Align difficulty with goal: ${goal}` : ''}
        JSON: { text: string, options: string[], correctAnswer: number }`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const analyzeNoteContext = async (text: string, goal?: string): Promise<{ insight: string }> => {
    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: `Explain this text "${text}" using an analogy.
        ${goal ? `Context Goal: ${goal}` : ''}
        JSON: { insight: string }`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const analyzeVisualSelection = async (base64: string): Promise<{ category: string, description: string, suggestion: string, extractedText?: string }> => {
    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: { parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64 } },
            { text: "Analyze this visual selection. 1. Categorize it (Diagram, Text, Math, UI). 2. Describe it. 3. Suggest an action (e.g. Solve, Summarize). 4. If it contains text, OCR it verbatim." }
        ] },
        config: { 
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING },
                    description: { type: Type.STRING },
                    suggestion: { type: Type.STRING },
                    extractedText: { type: Type.STRING }
                }
            },
            responseMimeType: 'application/json'
        }
    });
    return JSON.parse(response.text || '{}');
};

export const generateNoteFromResource = async (
    reference: NoteReference, 
    currentNote: string, 
    mode: 'COMPLETE' | 'FULL' | 'SUMMARY'
): Promise<string> => {
    let prompt = "";
    if (mode === 'FULL') {
        prompt = `Using the resource "${reference.title}" (${reference.url}), write a comprehensive, educational note covering the main topics. 
        Format it in Markdown with headers. 
        Ensure the information is accurate according to the resource.`;
    } else if (mode === 'COMPLETE') {
        prompt = `The user is writing a note. Use the resource "${reference.title}" (${reference.url}) to auto-complete or continue the current thought.
        
        Current Note Context: "${currentNote.slice(-1000)}"
        
        Provide only the continuation text.`;
    } else {
        prompt = `Extract key bullet points from the resource "${reference.title}" (${reference.url}).`;
    }

    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "";
};

// --- NEW: ACTIVE INSIGHT & MONITORING ---

export const monitorNoteSession = async (
    content: string, 
    goal: string, 
    checkpoints: Checkpoint[]
): Promise<{
    insights: string[],
    nextStep: string,
    suggestedResources: { title: string, query: string }[],
    updatedCheckpoints: { id: string, completed: boolean }[]
}> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Monitor User Session.
        Context: "${content.slice(-500)}"
        Goal: "${goal}"
        Checkpoints: ${JSON.stringify(checkpoints.map(c => ({ id: c.id, label: c.label, completed: c.completed })))}
        
        Output JSON:
        1. insights: 1 brief tip.
        2. nextStep: What to write next?
        3. suggestedResources: 1 search query.
        4. updatedCheckpoints: Mark completed IDs based on text.
        `,
        config: { 
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    insights: { type: Type.ARRAY, items: { type: Type.STRING } },
                    nextStep: { type: Type.STRING },
                    suggestedResources: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: {type: Type.STRING}, query: {type: Type.STRING} } } }
                    ,
                    updatedCheckpoints: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: {type: Type.STRING}, completed: {type: Type.BOOLEAN} } } }
                }
            }
        }
    });
    return JSON.parse(response.text || '{}');
};

export const generateGoalCurriculum = async (goal: string, days: number): Promise<DayPlan[]> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Create a ${days}-day learning plan for: ${goal}.
        JSON: [{ day: number, title: string, description: string, taskType: 'THEORY'|'CODE'|'SIMULATION', topic: string }]`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '[]');
};

// --- CAPSTONE & MEDIA ---

export const generateCapstoneProject = async (topic: string, nodes: any[]): Promise<CapstoneProject> => {
    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: `Create a capstone project for topic "${topic}".
        Nodes covered: ${nodes.map(n => n.label).join(', ')}.
        JSON: { title, goal, tasks: [{ nodeId, title, description, isUnlocked: false, isCompleted: false }] }`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const generatePodcastAudio = async (topic: string, nodes: any[]): Promise<PodcastData> => {
    const scriptResponse = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Generate a 2-minute podcast script between Host (Chad) and Professor (Albus) summarizing: ${topic}.
        Format: "Speaker: Text"`
    });
    const script = scriptResponse.text || "";
    
    return {
        audioUrl: "", 
        transcript: script
    };
};

export const generateNextSteps = async (topic: string): Promise<NextSteps> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Suggest next topics after "${topic}". JSON: { suggestions: [{topic, reason}] }`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const generateCheatSheet = async (topic: string, nodes: any[]): Promise<CheatSheetData> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Create a cheat sheet for ${topic}. JSON: { topic, nodes: [{concept, analogy, keyTerm}] }`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const generateObjectAnalogy = async (base64: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64 } }, { text: "Identify the main object and explain it using a simple analogy." }] }
    });
    return response.text || "";
};

export const analyzeVideo = async (base64: string, context: string): Promise<VideoAnalysisResult> => {
    return {
        summary: "Video analysis requires File API upload in production. Simulating result.",
        analogies: [{ concept: "Stream", analogy: "A river flowing" }],
        flashcards: [{ front: "Video Concept", back: "Explained" }]
    };
};

export const analyzeCode = async (code: string): Promise<CodeAnalysis> => {
    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: `Analyze code: "${code}". JSON: { language, summary, lines: [{code, analogy, explanation}] }`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

// --- NEW DEEP CODING MODULE ---

export const analyzeCodeDeep = async (code: string): Promise<CodeDeepAnalysis> => {
    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: `Analyze this code deeply.
        1. Identify the core programming fundamentals used (e.g. Recursion, Async/Await, Array Methods).
        2. Create a curriculum (Learning Path) to teach these concepts from scratch so the user can eventually rewrite this code.
        3. Create a 'challengePrompt' that asks the user to rewrite this functionality without showing them the original code.

        Code: "${code}"

        JSON Response:
        {
          fundamentals: string[],
          curriculum: {
             topic: "Code Mastery",
             nodes: [{ id: string, label: string, status: 'locked' | 'available', description: string, time: string }],
             links: [{ source: string, target: string }]
          },
          challengePrompt: string
        }
        
        Ensure curriculum nodes are ordered topologically.`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
}

export const evaluateCodeReconstruction = async (originalCode: string, userCode: string, challenge: string): Promise<CodeReconstructionResult> => {
    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: `Evaluate the user's code reconstruction.
        Original Code: "${originalCode}"
        Challenge Prompt: "${challenge}"
        User Code: "${userCode}"

        Did they achieve the logic? Syntax doesn't have to be identical, but logic must handle the task.
        
        JSON: { isCorrect: boolean, score: number (0-100), feedback: string, missingConcepts: string[] }`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
}

// --- PRACTICE & SCENARIO ---

export const startPracticeSession = async (topic: string): Promise<PracticeState> => {
    return {
        topic,
        studentName: "Alex",
        history: [{ role: 'model', text: `I'm ready to learn about ${topic}. Can you explain the basics?` }],
        isComplete: false
    };
};

export const continuePracticeSession = async (state: PracticeState, input: string): Promise<PracticeState> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Roleplay as a student named ${state.studentName}. Topic: ${state.topic}.
        History: ${JSON.stringify(state.history)}
        User Input: "${input}"
        
        If the explanation is good, ask a follow up. If bad, express confusion.
        If mastery is proven, set isComplete: true and provide score/feedback.
        
        JSON: { text: string, isComplete: boolean, score?: number, feedback?: string, weakAreas?: string[] }`,
        config: { responseMimeType: 'application/json' }
    });
    const data = JSON.parse(response.text || '{}');
    return {
        ...state,
        history: [...state.history, { role: 'user', text: input }, { role: 'model', text: data.text }],
        isComplete: data.isComplete,
        score: data.score,
        feedback: data.feedback,
        weakAreas: data.weakAreas
    };
};

export const startScenario = async (topic: string, level: ScenarioLevel = 'Junior'): Promise<ScenarioState> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Create a "Real World" roleplay scenario for "${topic}".
        Proficiency Level: ${level}.
        
        If topic is Coding/Tech: Create a "War Room" or "Production Outage" scenario.
        If topic is Science: Create a "Lab Crisis" or "Discovery" scenario.
        If topic is General: Create a high-stakes application scenario.

        JSON: { role: string (e.g. Senior Engineer, CTO), objective: string, initialMessage: string }`,
        config: { responseMimeType: 'application/json' }
    });
    const data = JSON.parse(response.text || '{}');
    return {
        topic,
        role: data.role,
        level,
        objective: data.objective,
        history: [{ role: 'model', text: data.initialMessage }],
        isComplete: false
    };
};

export const continueScenario = async (state: ScenarioState, input: string): Promise<ScenarioState> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Roleplay: ${state.topic}. Level: ${state.level}. Opponent: ${state.role}. Objective: ${state.objective}.
        History: ${JSON.stringify(state.history)}. User: "${input}".
        
        Evaluate the user's response based on their level (${state.level}).
        
        JSON: { text: string, isComplete: boolean, success?: boolean, feedback?: string }`,
        config: { responseMimeType: 'application/json' }
    });
    const data = JSON.parse(response.text || '{}');
    return {
        ...state,
        history: [...state.history, { role: 'user', text: input }, { role: 'model', text: data.text }],
        isComplete: data.isComplete,
        success: data.success,
        feedback: data.feedback
    };
};

export const generateReviewQuestion = async (topic: string): Promise<Question> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Create a single review question for "${topic}". JSON: { id, text, options, correctAnswer }`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const evaluateComprehensiveTest = async (topic: string, mcqScore: number, totalMcq: number, written: string): Promise<TestResult> => {
    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: `Evaluate test on "${topic}". MCQ: ${mcqScore}/${totalMcq}. Written: "${written}".
        JSON: { totalScore, mcqScore, explanationScore, professorFeedback, topicsToRevisit: string[], clarityRating: 'Crystal Clear'|'Fuzzy'|'Confused' }`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};


// --- LIVE SESSION CLASS ---

// Helper function to encode audio data safely to base64
function base64EncodeAudio(float32Data: Float32Array): string {
    const int16 = new Int16Array(float32Data.length);
    for (let i = 0; i < float32Data.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Data[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export class LiveSession {
    private client: GoogleGenAI;
    private config: LiveConfig;
    private onAudioData: (data: ArrayBuffer) => void;
    private onVolumeChange: (vol: number) => void;
    private onInterrupted: () => void;
    private onTranscript: (role: 'user' | 'model', text: string) => void;
    private onError: (err: Error) => void;
    private onConnectionChange: (state: 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED') => void;
    
    // Core Session State
    private activeSession: any = null;
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private processor: ScriptProcessorNode | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    
    // Status Flags
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private isProcessorRunning: boolean = false;

    constructor(
        config: LiveConfig, 
        onAudioData: (data: ArrayBuffer) => void,
        onVolumeChange: (vol: number) => void,
        onInterrupted: () => void,
        onTranscript: (role: 'user'|'model', text: string) => void,
        onError: (err: Error) => void,
        onConnectionChange: (state: 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED') => void
    ) {
        // Initialize client but we'll re-init on connect to be safe with keys
        this.client = new GoogleGenAI({ apiKey: process.env.API_KEY });
        this.config = config;
        this.onAudioData = onAudioData;
        this.onVolumeChange = onVolumeChange;
        this.onInterrupted = onInterrupted;
        this.onTranscript = onTranscript;
        this.onError = onError;
        this.onConnectionChange = onConnectionChange;
    }

    async connect() {
        if (this.isConnected) return;
        
        try {
            this.onConnectionChange('RECONNECTING');

            // 0. Ensure fresh client
            this.client = new GoogleGenAI({ apiKey: process.env.API_KEY });

            // 1. Audio Setup (Reusable)
            if (!this.audioContext || this.audioContext.state === 'closed') {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                this.audioContext = new AudioContextClass();
            }
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // 2. Stream Setup (Reusable)
            if (!this.mediaStream) {
                 this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        channelCount: 1,
                        sampleRate: 16000,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    } 
                });
            }

            // 3. Socket Connection
            this.activeSession = await this.client.live.connect({
                model: LIVE_MODEL,
                config: { 
                   responseModalities: [Modality.AUDIO],
                   speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: this.config.voiceName } }
                   },
                   systemInstruction: { parts: [{ text: this.config.systemInstruction }] }
                },
                callbacks: {
                    onopen: () => {
                        this.isConnected = true;
                        this.reconnectAttempts = 0; // Reset attempts on successful connection
                        this.onConnectionChange('CONNECTED');
                    },
                    onmessage: (message: any) => {
                        if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData) {
                             const base64 = message.serverContent.modelTurn.parts[0].inlineData.data;
                             const binary = atob(base64);
                             const len = binary.length;
                             const bytes = new Uint8Array(len);
                             for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
                             this.onAudioData(bytes.buffer);
                        }
                        if (message.serverContent?.interrupted) {
                            this.onInterrupted();
                        }
                    },
                    onclose: (e) => {
                        this.isConnected = false;
                        this.activeSession = null;
                        if (this.reconnectAttempts < 5) {
                             this.reconnectAttempts++;
                             this.onConnectionChange('RECONNECTING');
                             // Exponential backoff
                             setTimeout(() => this.connect(), 1000 * Math.pow(2, this.reconnectAttempts));
                        } else {
                             this.onConnectionChange('DISCONNECTED');
                             this.onError(new Error("Connection lost. Please restart session."));
                             this.disconnect(); // Clean cleanup
                        }
                    },
                    onerror: (err) => {
                        console.error("Session Error:", err);
                        // Let onclose handle the reconnection logic usually
                    }
                }
            });
            
            // 4. Attach Audio Processor (Only if not already running to avoid duplication)
            if (!this.isProcessorRunning) {
                this.startAudioProcessor();
                this.isProcessorRunning = true;
            }

        } catch (e: any) {
            console.error("Connection Failed:", e);
            this.onError(new Error("Failed to connect: " + (e.message || "Unknown error")));
            this.onConnectionChange('DISCONNECTED');
            this.disconnect(); 
        }
    }

    private startAudioProcessor() {
        if (!this.audioContext || !this.mediaStream) return;
        
        try {
            this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
            
            this.processor.onaudioprocess = async (e) => {
                // If not connected, do not send, but keep processor alive to avoid recreating graph repeatedly
                if (!this.isConnected || !this.activeSession) return;

                const inputData = e.inputBuffer.getChannelData(0);
                
                // Volume Calc
                let sum = 0;
                for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                this.onVolumeChange(Math.sqrt(sum/inputData.length));
                
                // Resample to 16k
                const targetRate = 16000;
                const contextRate = this.audioContext!.sampleRate;
                let finalData = inputData;
                
                if (contextRate !== targetRate) {
                    const ratio = contextRate / targetRate;
                    const newLength = Math.floor(inputData.length / ratio);
                    const downsampled = new Float32Array(newLength);
                    for(let i=0; i<newLength; i++) {
                        downsampled[i] = inputData[Math.floor(i * ratio)];
                    }
                    finalData = downsampled;
                }

                // Encode safely
                const base64Data = base64EncodeAudio(finalData);
                
                const blob = {
                    mimeType: "audio/pcm;rate=16000",
                    data: base64Data
                };

                // CRITICAL FIX: Send to the CURRENT active session instance with correct payload structure
                try {
                    this.activeSession.sendRealtimeInput({ media: blob });
                } catch (err) {
                    // Start of handling for potential socket closure during send
                    console.debug("Send failed", err);
                }
            };

            this.source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

        } catch (e) {
            console.error("Audio Graph Error:", e);
        }
    }

    disconnect() {
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.isProcessorRunning = false;

        if (this.activeSession) {
            try { this.activeSession.close(); } catch(e){}
            this.activeSession = null;
        }
        
        if (this.source) {
            try { this.source.disconnect(); } catch(e){}
            this.source = null;
        }

        if (this.processor) {
            try { 
                this.processor.disconnect(); 
                this.processor.onaudioprocess = null;
            } catch(e){}
            this.processor = null;
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(t => t.stop());
            this.mediaStream = null;
        }
        
        // We close the context to ensure full cleanup and avoid limit errors
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}