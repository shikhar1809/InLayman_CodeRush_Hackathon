
// ... imports
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { ContentBlock, GoalContext, ExplainResponse, TopicProfile, GroundingResult, WingerResponse, TextIntentAnalysis, DiagnosticResult, ExamMetadata, QuizQuestion, QuizInsight, StyleProfile, RevisionMode, QuickQuizResult, DeepDiveResult, HighYieldResult, AudioVibe, AudioPlaylist, NorthStarContext, SnippetData } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FLASH = 'gemini-2.5-flash';

// --- STANDARD: ROBUST JSON PARSER ---
const cleanJSON = (text: string) => {
    if (!text) return "{}";
    let clean = text.replace(/```json/g, '').replace(/```/g, '');
    
    // Attempt to find the outer brace pair
    const firstBrace = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');
    
    let startIdx = -1;
    let endIdx = -1;

    // Determine if we are looking for an object or array
    if (firstBrace === -1 && firstBracket === -1) return "{}";

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startIdx = firstBrace;
        endIdx = clean.lastIndexOf('}') + 1;
    } else {
        startIdx = firstBracket;
        endIdx = clean.lastIndexOf(']') + 1;
    }

    if (startIdx !== -1 && endIdx !== -1) {
        clean = clean.substring(startIdx, endIdx);
    }

    return clean.trim();
};

// Safe Parse Wrapper with Strict Typing
function safeParseJSON<T>(text: string, fallback: T): T {
    try {
        const cleaned = cleanJSON(text);
        const parsed = JSON.parse(cleaned);
        // Basic check to ensure we didn't get null/undefined when expecting an object
        return parsed || fallback;
    } catch (e) {
        console.warn("JSON Parse Failed, using fallback. Raw text:", text);
        return fallback;
    }
}

// --- DEFAULT FALLBACKS ---
const DEFAULT_STYLE_PROFILE: StyleProfile = {
    id: 'default',
    name: 'Standard',
    detected_font: 'serif_handwriting',
    system_instruction: 'Standard legible notes.',
    preset_id: 'CUSTOM',
    shorthand_rules: [],
    structure_preference: 'Linear',
    tone: 'Neutral'
};

const DEFAULT_GOAL_CONTEXT: GoalContext = { 
    objective: 'General Learning', 
    status: 'In Progress', 
    action_plan: [] 
};

export const generateNorthStarContext = async (goal: string, checklist: string[]): Promise<NorthStarContext | undefined> => {
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            context_id: { type: Type.STRING },
            generated_persona_instruction: { type: Type.STRING },
            priority_tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            checklist_mapping: { type: Type.OBJECT, description: "Mapping of checklist items to their detected category" },
            tone_calibration: {
                type: Type.OBJECT,
                properties: { strictness: { type: Type.NUMBER }, practicality: { type: Type.NUMBER } },
                required: ["strictness", "practicality"]
            }
        },
        required: ["context_id", "generated_persona_instruction", "priority_tags", "checklist_mapping", "tone_calibration"]
    };

    try {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `User Goal: "${goal}". Checklist Items: ${JSON.stringify(checklist)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                systemInstruction: `SYSTEM INSTRUCTION: NORTH STAR CONTEXT ENGINE. Role: Strategic Learning Planner.`
            }
        });
        return safeParseJSON<NorthStarContext | undefined>(response.text || '{}', undefined);
    } catch (e) {
        console.error("North Star Engine Error", e);
        return undefined;
    }
};

export const parseGoalInput = async (userInput: string): Promise<GoalContext> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      objective: { type: Type.STRING },
      deadline: { type: Type.STRING },
      status: { type: Type.STRING, enum: ["In Progress"] },
      action_plan: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { step: { type: Type.STRING }, date: { type: Type.STRING } }
        }
      }
    },
    required: ["objective", "status", "action_plan"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `Analyze: "${userInput}". Create a realistic 3-5 step plan.`,
      config: { responseMimeType: "application/json", responseSchema: schema }
    });
    return safeParseJSON<GoalContext>(response.text || '{}', { ...DEFAULT_GOAL_CONTEXT, objective: userInput });
  } catch (error) {
    return { ...DEFAULT_GOAL_CONTEXT, objective: userInput };
  }
};

export const generateGoalAlignment = async (goal: string, notes: string): Promise<string[]> => {
    const schema: Schema = { type: Type.ARRAY, items: { type: Type.STRING } };
    try {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Goal: "${goal}". Current Notes: "${notes.substring(0, 10000)}". Provide 3 actionable next steps.`,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        return safeParseJSON<string[]>(response.text || '[]', ["Review key concepts", "Expand your notes", "Test yourself"]);
    } catch (e) {
        return ["Focus on key definitions", "Expand on the latest topic", "Review core concepts"];
    }
};

export const analyzeTextIntent = async (text: string): Promise<TextIntentAnalysis> => {
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            primary_intent: { type: Type.STRING, enum: ['COMPLEXITY', 'CLAIM', 'DRAFT'] },
            suggested_action_label: { type: Type.STRING }
        },
        required: ["primary_intent", "suggested_action_label"]
    };

    try {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Analyze selected text: "${text.substring(0, 500)}"`,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        return safeParseJSON<TextIntentAnalysis>(response.text || '{}', { primary_intent: 'COMPLEXITY', suggested_action_label: 'Explain' });
    } catch (e) {
        return { primary_intent: 'COMPLEXITY', suggested_action_label: 'Explain' };
    }
}

export const explainText = async (selectedText: string, context?: string): Promise<ExplainResponse> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: { analogy: { type: Type.STRING }, voice_script: { type: Type.STRING }, sticky_note: { type: Type.STRING } },
    required: ["analogy", "voice_script", "sticky_note"]
  };

  try {
      const response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: `Explain "${selectedText}". ${context ? `Context: ${context.substring(0, 1000)}` : ''}`,
        config: { responseMimeType: "application/json", responseSchema: schema }
      });
      return safeParseJSON<ExplainResponse>(response.text || '{}', { analogy: "Explanation unavailable.", voice_script: "Error.", sticky_note: "Error" });
  } catch (e) {
      return { analogy: "Error explaining.", voice_script: "Error explaining.", sticky_note: "Error" };
  }
};

export const enhanceTextWithContext = async (text: string, context?: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Rewrite for clarity: "${text}". ${context ? `Reference: ${context.substring(0, 2000)}` : ''}`,
        });
        return response.text || text;
    } catch (e) { return text; }
}

export const searchCommunitySnippets = async (searchTerm: string, context?: string): Promise<SnippetData[]> => {
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            results: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['ANALOGY', 'CHEAT_CODE', 'ELI5'] },
                        content: { type: Type.STRING },
                        author_tag: { type: Type.STRING },
                        likes: { type: Type.INTEGER }
                    },
                    required: ["id", "type", "content", "author_tag", "likes"]
                }
            }
        }
    };

    const systemInstruction = `
        SYSTEM INSTRUCTION: COMMUNITY NOTE CURATOR

        Role: You are the Search Engine for the "Layman Community" database.
        Objective: When a user looks up a term, you do NOT return a dictionary definition. You return "Peer Snippets"—explanations written by other students.
        
        Selection Algorithm (The "Good Note" Filter):
        You must generate/retrieve 3 distinct types of results.
        1. The Analogy Card: Must explain the concept using a real-world comparison.
        2. The Cheat Code: A short mnemonic, formula, or "don't forget" warning.
        3. The ELI5: A simplified 1-sentence summary.

        Formatting Rules:
        * Length: MAX 40 words per snippet.
        * Tone: Casual, student-to-student. Use arrows (->) and emojis.
        * Source: Invent a realistic "User Rank" (e.g., "Top Contributor", "Bio Major").
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Search_Term: "${searchTerm}". Context: "${context ? context.substring(0, 500) : 'General Knowledge'}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                systemInstruction: systemInstruction
            }
        });
        const result = safeParseJSON<{results: SnippetData[]}>(response.text || '{}', { results: [] });
        return result.results;
    } catch (e) {
        console.error("Community Snippet Error", e);
        return [];
    }
};

export const generateDeepDive = async (text: string): Promise<TopicProfile> => {
    const defaults: TopicProfile = { 
        topic_name: text,
        layman_summary: "Information currently unavailable.",
        stats: { exam_frequency_score: 5, exam_note: "Standard Topic", toughness_score: 5, toughness_label: "Average" },
        prerequisites: [],
        practice_pod: { question: "Try explaining this yourself.", answer: "", button_label: "Retry" }
    };

    try {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Analyze topic: "${text}". Return JSON profile.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return safeParseJSON<TopicProfile>(cleanJSON(response.text || '{}'), defaults); 
    } catch (e) { return defaults; }
}

export const generateRevisionArtifact = async (mode: RevisionMode, notes: string): Promise<any> => {
    if (mode === 'CHEAT_SHEET') {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Create a 1-page dense cheat sheet from: "${notes.substring(0, 20000)}". Use Markdown.`,
        });
        return response.text || "Notes too sparse.";
    }

    // Dynamic schema selection based on mode
    let schema: Schema | undefined;
    let systemInstruction = "You are a Revision Engine.";

    if (mode === 'QUICK_TEST') {
        systemInstruction = "Create a 5-question rapid fire multiple choice quiz.";
        schema = {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING },
                questions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            q: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correct: { type: Type.INTEGER }
                        },
                        required: ["q", "options", "correct"]
                    }
                }
            },
            required: ["questions"]
        };
    } else if (mode === 'DETAILED_TEST') {
        systemInstruction = "Create 3 complex essay questions with grading rubrics.";
        schema = {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING },
                questions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            q: { type: Type.STRING },
                            rubric_keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["q", "rubric_keywords"]
                    }
                }
            },
            required: ["questions"]
        };
    } else if (mode === 'IMPORTANT_Q') {
        systemInstruction = "Identify high-yield exam topics and likely questions.";
        schema = {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING },
                items: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            topic: { type: Type.STRING },
                            question: { type: Type.STRING },
                            exam_frequency: { type: Type.STRING }
                        },
                        required: ["topic", "question", "exam_frequency"]
                    }
                }
            },
            required: ["items"]
        };
    }

    try {
        const response = await ai.models.generateContent({
             model: MODEL_FLASH,
             contents: `Generate revision artifact for mode: ${mode}. Content: "${notes.substring(0, 20000)}".`,
             config: { 
                 responseMimeType: "application/json",
                 responseSchema: schema,
                 systemInstruction
             }
        });
        return safeParseJSON(response.text || '{}', null);
    } catch (e) { 
        console.error("Revision Artifact Error", e);
        return null; 
    }
}

export const generateAudioScript = async (notes: string, vibe: AudioVibe): Promise<AudioPlaylist> => {
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            playlist_title: { type: Type.STRING },
            vibe_used: { type: Type.STRING },
            tracks: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { title: { type: Type.STRING }, script: { type: Type.STRING } },
                    required: ["title", "script"]
                }
            }
        },
        required: ["playlist_title", "vibe_used", "tracks"]
    };

    try {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Convert notes to audio script. Vibe: ${vibe}. Notes: "${notes.substring(0, 15000)}"`,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        return safeParseJSON<AudioPlaylist>(response.text || '{}', { playlist_title: "Error", vibe_used: vibe, tracks: [] });
    } catch (e) {
        return { playlist_title: "Error", vibe_used: vibe, tracks: [] };
    }
}

export const generateMindmapCode = async (contextText: string): Promise<string> => {
  try {
      const response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: `Create Mermaid.js graph TD diagram for: "${contextText.substring(0, 2000)}". 
        RULES:
        1. Use 'graph TD'.
        2. ENCLOSE ALL NODE LABELS IN DOUBLE QUOTES. Example: A["This is (text)"]. 
        3. Do not use special characters outside quotes.
        4. Return ONLY code, no markdown block markers.`,
      });
      return response.text?.replace(/```mermaid/g, '').replace(/```/g, '').trim() || "";
  } catch (e) { return `graph TD\nA["Error generating map"]`; }
};

export const classifyLink = async (url: string): Promise<{ emoji: string, category: string }> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: { emoji: { type: Type.STRING }, category: { type: Type.STRING } },
    required: ["emoji", "category"]
  };
  try {
      const response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: `Classify URL: "${url}"`,
        config: { responseMimeType: "application/json", responseSchema: schema }
      });
      return safeParseJSON(response.text || '{}', { emoji: "🔗", category: "Link" });
  } catch (e) { return { emoji: "🔗", category: "Link" }; }
};

export const chatWithWinger = async (audioBase64: string, systemContext: string, currentFocus: string, mimeType: string = "audio/wav"): Promise<WingerResponse> => {
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            text: { type: Type.STRING },
            action: { type: Type.STRING, enum: ['create_note', 'none'] }
        }
    };
    
    // First attempt with Strict JSON Schema
    try {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: audioBase64 } },
                    { text: `System Context: ${systemContext}. Focus: ${currentFocus}. Role: Helpful assistant.` }
                ]
            },
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        return safeParseJSON<WingerResponse>(response.text || '{}', { text: "I didn't catch that.", action: 'none' });
    } catch (e) {
        console.warn("Winger First Attempt Failed, trying fallback...", e);
        
        // Fallback: Free-form generation (often fixes 'Audio Processing Error' caused by safety filters or strict schema with audio)
        try {
            const fallbackResponse = await ai.models.generateContent({
                model: MODEL_FLASH,
                contents: {
                    parts: [
                        { inlineData: { mimeType: mimeType, data: audioBase64 } },
                        { text: `System Context: ${systemContext}. Focus: ${currentFocus}. Respond briefly to the audio.` }
                    ]
                }
            });
            // Manual simple parse attempt or just return text
            const txt = fallbackResponse.text || "I heard you, but couldn't process the response.";
            return { text: txt, action: 'none' };
        } catch (e2) {
             console.error("Winger Fallback Failed", e2);
             return { text: "Audio processing error.", action: 'none' }; 
        }
    }
}

export const transcribeAudioNode = async (audioBase64: string, mimeType: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: {
                parts: [
                     { inlineData: { mimeType: mimeType, data: audioBase64 } },
                     { text: "Transcribe exactly what is said." }
                ]
            }
        });
        return response.text || "Transcription failed.";
    } catch (e) { return "Audio Error"; }
}

export const checkExamFrequency = async (text: string): Promise<ExamMetadata> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Is "${text}" a common exam topic? Return JSON with frequency rating.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return safeParseJSON<ExamMetadata>(cleanJSON(response.text || '{}'), { is_exam_favorite: false });
    } catch (e) { return { is_exam_favorite: false }; }
};

export const generateGapAnalysisQuiz = async (notes: string, goal: string): Promise<QuizQuestion[]> => {
    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, enum: ["MCQ", "OPEN"] },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } }, // Optional in schema, logic handles it
                correctIndex: { type: Type.INTEGER },
                answer: { type: Type.STRING, description: "The ideal simple answer for OPEN questions" },
                explanation: { type: Type.STRING }
            },
            required: ["type", "question", "explanation"]
        }
    };
    try {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Notes: "${notes.substring(0, 10000)}". Goal: "${goal}". 
            Generate 5 questions.
            CRITICAL INSTRUCTION:
            - Mix question types.
            - Include 3 "MCQ" questions.
            - Include 2 "OPEN" questions (Simplify/Explain challenges).
            - For OPEN questions, 'options' and 'correctIndex' are not needed, but provide a clear 'answer' field with the ideal explanation.`,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        return safeParseJSON<QuizQuestion[]>(response.text || '[]', []);
    } catch (e) { return []; }
};

export const generateHandshakeQuestion = async (notes: string): Promise<QuizQuestion> => {
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, enum: ["MCQ"] },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
        },
        required: ["question", "options", "correctIndex", "explanation"]
    };
    try {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Generate one key question from: "${notes.substring(0, 3000)}".`,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        return safeParseJSON<QuizQuestion>(response.text || '{}', { type: 'MCQ', question: "Error generating quiz.", options: ["A", "B"], correctIndex: 0, explanation: "" });
    } catch (e) { return { type: 'MCQ', question: "Error generating quiz.", options: ["A", "B"], correctIndex: 0, explanation: "" }; }
};

export const generateQuizInsights = async (quizContext: string, wrongAnswers: any[]): Promise<QuizInsight> => {
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            score_summary: { type: Type.STRING, description: "A encouraging but critical 1-sentence summary of performance." },
            weak_areas: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 specific topics the user failed on." },
            next_steps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 actionable study tasks." },
            remedial_note: { type: Type.STRING, description: "A short paragraph explaining the correct concepts for the mistakes made." }
        },
        required: ["score_summary", "weak_areas", "next_steps", "remedial_note"]
    };

    try {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Quiz Context: ${quizContext}. User Mistakes: ${JSON.stringify(wrongAnswers)}. Provide a helpful grading report.`,
            config: { 
                responseMimeType: "application/json",
                responseSchema: schema
            } 
        });
        return safeParseJSON<QuizInsight>(response.text || '{}', { score_summary: "Review needed.", weak_areas: ["General Review"], next_steps: ["Read notes again"], remedial_note: "Please review the material." });
    } catch (e) { 
        console.error("Quiz Insight Error", e);
        return { score_summary: "Analysis Unavailable", weak_areas: [], next_steps: [], remedial_note: "" }; 
    }
};

export const analyzeStyleFingerprint = async (base64Data: string, mimeType: string): Promise<StyleProfile> => {
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            detected_font: { type: Type.STRING, enum: ['serif_handwriting', 'cursive', 'messy', 'clean_serif'] },
            system_instruction: { type: Type.STRING }
        },
        required: ["name", "detected_font", "system_instruction"]
    };

    try {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: "Analyze handwriting style." }
                ]
            },
            config: { responseMimeType: "application/json", responseSchema: schema }
        });

        const result = safeParseJSON<Partial<StyleProfile>>(response.text || '{}', {});
        
        return {
            ...DEFAULT_STYLE_PROFILE,
            ...result,
            id: Math.random().toString(36),
            preset_id: 'CUSTOM',
        };
    } catch (e) {
        return DEFAULT_STYLE_PROFILE;
    }
}

export const generateAutopilotNotes = async (sourceText: string, profile: StyleProfile, goal?: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Source: "${sourceText.substring(0, 25000)}". Style: ${profile.system_instruction}. Goal: ${goal || 'General'}. 
            SYSTEM NOTE: If the Source is a URL or a link (e.g. YouTube), you MUST use the googleSearch tool to retrieve the content, transcript, or summary of that page before generating notes. Do NOT refuse.
            Return Markdown.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return response.text || "Notes generation failed.";
    } catch (e) { return "Autopilot Error."; }
}

export const ingestResource = async (base64: string, mime: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: { parts: [{ inlineData: { mimeType: mime, data: base64 } }, { text: "Extract text." }] }
        });
        return response.text || "";
    } catch (e) { return ""; }
}
