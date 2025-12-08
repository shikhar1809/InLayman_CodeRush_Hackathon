

export enum AppView {
  HOME = 'HOME',
  ASSESSMENT = 'ASSESSMENT',
  ROADMAP = 'ROADMAP',
  LEARNING = 'LEARNING',
  EXPLAIN_BACK = 'EXPLAIN_BACK',
  SUMMARY = 'SUMMARY',
  DOCUMENT = 'DOCUMENT',
  TEST = 'TEST',
  REVIEW = 'REVIEW',
<<<<<<< HEAD
  COMMUNITY = 'COMMUNITY',
=======
>>>>>>> 2867a5c (Update wire connection visuals)
  LIBRARY = 'LIBRARY',
  PROFILE = 'PROFILE',
  PRACTICE = 'PRACTICE',
  SCENARIO = 'SCENARIO',
  CODE = 'CODE',
  CHEAT_SHEET = 'CHEAT_SHEET',
  VIDEO = 'VIDEO',
  NOTEBOOK = 'NOTEBOOK'
}

export enum Difficulty {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export type ComplexityLevel = '5yo' | 'HighSchool' | 'Undergrad' | 'Professional';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface PrerequisiteNode {
  id: string;
  label: string;
  status: 'locked' | 'available' | 'completed' | 'current';
  description: string;
  time?: string;
}

export interface PrerequisiteLink {
  source: string;
  target: string;
}

export interface LearningPath {
  topic: string;
  nodes: PrerequisiteNode[];
  links: PrerequisiteLink[];
}

export interface AnalogyMappingItem {
  analogyTerm: string;
  technicalTerm: string;
  explanation: string;
}

export interface AnalogyContent {
  concept: string;
  domain: string;
  analogyTitle: string;
  analogyContent: string;
  analogyMapping: AnalogyMappingItem[]; 
  technicalExplanation: string; 
  keyTakeaways: string[];
  microTestQuestion: string;
  diagram?: string; // Mermaid JS syntax
  realWorldApplication?: string; // New field for contextual learning
}

export interface DocumentAnalysis {
  title: string;
  summary: string;
  sections: { 
      title: string; 
      content: string; // The simplified rewritten text
      analogyNote?: string; // A section-specific analogy
  }[]; 
  keyConcepts: { 
      term: string; // Exact text match for highlighting
      definition: string; 
      analogy: string; 
  }[];
  actionItems: string[];
}

export interface TestResult {
  totalScore: number; 
  mcqScore: number;
  explanationScore: number;
  professorFeedback: string;
  topicsToRevisit: string[];
  clarityRating: 'Crystal Clear' | 'Fuzzy' | 'Confused';
  dateTaken?: number;
  topic?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
}

export interface TranscriptItem {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface LiveConfig {
  voiceName: string;
  systemInstruction: string;
}

export type PersonaType = 'professor' | 'bro' | 'socrates' | 'custom';

export interface AvatarConfig {
    skinTone: string;
    hairColor: string;
    hairStyle: 'short' | 'long' | 'bun' | 'spiked';
    accessory: 'none' | 'glasses' | 'headphones' | 'hat';
    shirtColor: string;
}

export interface TeachingStyle {
    memeLevel: number; // 0-100
    strictness: number; // 0-100
    verbosity: number; // 0-100 (Concise vs Yapper)
    useAnalogies: boolean;
}

export interface ReviewItem {
    topic: string;
    stage: 1 | 2 | 4 | 7 | 99; 
    nextReviewDate: number; 
    lastReviewedDate: number; 
    masteryLevel: number; 
}

export interface SavedAnalogy extends AnalogyContent {
    id: string;
    dateSaved: number;
    userNotes?: string;
}

export interface CommunityAnalogy {
    id: string;
    topic: string;
    title: string;
    content: string;
    author: string;
    votes: number;
    tags: string[];
    datePosted: number;
    // AI Persona Data
    avatarConfig?: AvatarConfig;
    teachingStyle?: TeachingStyle;
    voiceName?: string;
}

export interface UserPreferences {
    likedDomains: string[];
    dislikedDomains: string[];
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    joinDate: number;
    testHistory: TestResult[];
    streak?: number;
    lastActiveDate?: number;
}

<<<<<<< HEAD
=======
// --- LAB TYPES ---

export type LabRole = 'Intern' | 'Junior' | 'Senior' | 'Staff' | 'Architect';

export interface LabMission {
    title: string;
    role: LabRole;
    companyContext: string;
    taskDescription: string;
    boilerplateCode: string;
    objectives: string[];
    hiddenTests: string[];
}

export interface LabFeedback {
    passed: boolean;
    score: number; // 0-100
    codeReview: string; // The "Senior Dev" comments
    optimizedCode?: string; // How the AI would have written it
}

>>>>>>> 2867a5c (Update wire connection visuals)
export interface CodeAnalysis {
  language: string;
  summary: string;
  lines: { code: string; analogy: string; explanation: string }[];
}

export interface CodeDeepAnalysis {
  fundamentals: string[];
  curriculum: LearningPath;
  challengePrompt: string; // The "Test" description
}

export interface CodeReconstructionResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  missingConcepts: string[];
}

export interface PracticeState {
  topic: string;
  studentName: string;
  history: { role: 'user' | 'model'; text: string }[];
  isComplete: boolean;
  score?: number;
  feedback?: string;
  weakAreas?: string[];
}

export type ScenarioLevel = 'Intern' | 'Junior' | 'Senior' | 'Principal';

export interface ScenarioState {
  topic: string;
  role: string;
  level: ScenarioLevel;
  objective: string;
  history: { role: 'user' | 'model'; text: string }[];
  isComplete: boolean;
  success?: boolean;
  feedback?: string;
}

export interface KnowledgeNode {
  id: string;
  group: number;
  val: number; // radius
}

export interface KnowledgeLink {
  source: string;
  target: string;
}

export interface KnowledgeGraphData {
  nodes: KnowledgeNode[];
  links: KnowledgeLink[];
}

export interface CheatSheetData {
    topic: string;
    nodes: {
        concept: string;
        analogy: string;
        keyTerm: string;
    }[];
}

export interface CapstoneTask {
    nodeId: string; // Links to a Roadmap Node ID
    title: string;
    description: string;
    isUnlocked: boolean;
    isCompleted: boolean;
}

export interface CapstoneProject {
    title: string;
    goal: string;
    tasks: CapstoneTask[];
}

export interface PodcastData {
    audioUrl: string;
    transcript: string;
}

export interface Flashcard {
    front: string;
    back: string;
}

export interface VideoAnalysisResult {
    summary: string;
    analogies: { concept: string; analogy: string }[];
    flashcards: Flashcard[];
}

export interface NextSteps {
    suggestions: {
        topic: string;
        reason: string;
    }[];
}

export type TaskType = 'THEORY' | 'CODE' | 'SIMULATION';

export interface DayPlan {
    day: number;
    title: string;
    description: string;
    taskType: TaskType;
    topic: string;
    isCompleted: boolean;
}

export interface UserGoal {
    id: string;
    title: string;
    durationDays: number;
    startDate: number;
    progress: number; // index of current day
    curriculum: DayPlan[];
}

export interface NoteReference {
    id: string;
    type: 'VIDEO' | 'ARTICLE';
    url: string;
    title: string;
    timestamp?: string; // seconds or string like "02:30"
}

export interface NoteHighlight {
    id: string;
    text: string; // The text content to highlight
    analogy: string;
    explanation: string;
    color?: string;
}

export interface Checkpoint {
    id: string;
    label: string;
    completed: boolean;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    lastModified: number;
    diagrams: { id: string; code: string; description: string }[];
    flashcards: Flashcard[];
    references: NoteReference[];
    highlights: NoteHighlight[]; 
    drawingData?: string; 
    
    // New Goal Oriented Fields
    learningGoal?: string;
    checkpoints?: Checkpoint[];
}

export interface Binder {
    id: string;
    title: string;
    goal: string; // e.g., "Studying for SAT"
    notes: Note[];
    themeColor: string;
}