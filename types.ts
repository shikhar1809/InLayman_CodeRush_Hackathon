
export type BlockType = 'text' | 'image' | 'mindmap_code' | 'audio_note' | 'sticky_note' | 'smart_embed' | 'audio_tape' | 'topic_card' | 'community_snippet';

export type RevisionMode = 'QUICK_TEST' | 'DETAILED_TEST' | 'IMPORTANT_Q' | 'CHEAT_SHEET' | 'AUDIO_SUMMARY';

export interface ExamMetadata {
    is_exam_favorite: boolean;
    last_seen_year?: string;
    frequency_rating?: 'High' | 'Medium' | 'Low';
    context?: string;
}

export interface QuizQuestion {
    id?: string;
    type: 'MCQ' | 'OPEN'; // Added type differentiation
    question: string;
    options?: string[]; // Optional for OPEN questions
    correctIndex?: number; // Optional for OPEN questions
    answer?: string; // The "ideal explanation" for OPEN questions
    explanation: string;
}

export interface SnippetData {
    id: string;
    type: 'ANALOGY' | 'CHEAT_CODE' | 'ELI5';
    content: string;
    author_tag: string;
    likes: number;
}

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string; // For topic_card, JSON of TopicProfile. For community_snippet, JSON of SnippetData.
  meta_tags?: string[];
  ai_generated: boolean;
  voice_script?: string;
  rotation?: number;
  
  // Scrapbook Canvas Props
  x?: number;
  y?: number;
  width?: number;
  height?: number;

  // Examiner Props
  exam_metadata?: ExamMetadata;
  embed_type?: 'sticker' | 'card' | 'embed' | 'emoji';
  emoji_char?: string;
  
  // Audio Tape Props
  audio_url?: string;
  duration?: string;
  tape_style?: 'yellow' | 'blue' | 'pink' | 'green';
  
  // Handshake / Autopilot Props
  locked?: boolean;
  handshake_question?: QuizQuestion;

  // Flashback Stack / Spaced Repetition Props
  review_stats?: {
      last_reviewed: string;
      memory_strength: number;
  };
}

export interface NorthStarContext {
  context_id: string;
  generated_persona_instruction: string;
  priority_tags: string[];
  checklist_mapping: Record<string, string>;
  tone_calibration: {
    strictness: number;
    practicality: number;
  };
}

export interface GoalContext {
  objective: string;
  deadline?: string;
  status: 'In Progress' | 'Completed' | 'Not Started';
  action_plan?: Array<{ step: string; date?: string; completed?: boolean }>;
  north_star?: NorthStarContext;
}

export interface GroundingContext {
  raw_text: string;
  source_summary: string;
}

export interface VisualStyle {
  paper_texture: string;
  font: string;
}

export type StylePreset = 'IVY_LEAGUER' | 'DOODLER' | 'HACKER' | 'INFLUENCER' | 'CUSTOM';

export interface StyleProfile {
    id: string;
    name: string;
    preset_id?: StylePreset; 
    shorthand_rules: string[];
    structure_preference: string;
    tone: string;
    detected_font: 'serif_handwriting' | 'cursive' | 'messy' | 'clean_serif' | 'ivy' | 'doodler' | 'hacker' | 'influencer';
    system_instruction: string;
}

export interface NoteSession {
  id: string;
  title: string;
  goal_context: GoalContext;
  grounding_context?: GroundingContext;
  content_blocks: ContentBlock[];
  visual_style: VisualStyle;
  style_profile?: StyleProfile;
  sketches: Array<{points: {x: number, y: number}[], mode: 'pen' | 'lasso'}>;
}

export type ViewState = 'DESK' | 'SHELF' | 'COVER' | 'NOTEBOOK';

export interface ExplainResponse {
  analogy: string;
  voice_script: string;
  sticky_note: string;
}

export interface TopicStats {
    exam_frequency_score: number; // 1-10
    exam_note: string;
    toughness_score: number; // 1-10
    toughness_label: string;
}

export interface PracticePod {
    question: string;
    answer: string;
    button_label: string;
}

export interface TopicProfile {
    topic_name: string;
    layman_summary: string;
    stats: TopicStats;
    prerequisites: string[];
    practice_pod: PracticePod;
}

export interface GroundingResult {
  text: string;
  sources: Array<{ title: string; uri: string }>;
}

export interface WingerResponse {
  text: string;
  action?: 'create_note' | 'none';
}

export interface TextIntentAnalysis {
    primary_intent: 'COMPLEXITY' | 'CLAIM' | 'DRAFT';
    suggested_action_label: string;
}

export interface DiagnosticResult {
    needs_remedial: boolean;
    prerequisites: Array<{ topic: string, question: string, options: string[], answer: string }>;
    remedial_note?: string;
}

export interface QuizInsight {
  score_summary: string;
  weak_areas: string[];
  next_steps: string[];
  remedial_note: string;
}

// Revision Engine Interfaces
export interface QuickQuizResult {
    type: 'quick_quiz';
    questions: Array<{ q: string; options: string[]; correct: number }>;
}

export interface DeepDiveResult {
    type: 'deep_dive';
    questions: Array<{ q: string; rubric_keywords: string[] }>;
}

export interface HighYieldResult {
    type: 'high_yield';
    items: Array<{ topic: string; question: string; exam_frequency: string }>;
}

export interface Flashcard {
    front: string;
    back: string;
}

// Audio Engine Types
export type AudioVibe = 'ZEN_MASTER' | 'HYPE_COACH' | 'THE_GOSSIP';

export interface AudioTrack {
    title: string;
    script: string;
}

export interface AudioPlaylist {
    playlist_title: string;
    vibe_used: string;
    tracks: AudioTrack[];
}
