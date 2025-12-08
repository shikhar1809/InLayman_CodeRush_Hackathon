<<<<<<< HEAD
=======

>>>>>>> 2867a5c (Update wire connection visuals)
// ... (imports)
import React, { useState, useEffect, useRef } from 'react';
import { AppView, LearningPath, DocumentAnalysis, UserProfile, CapstoneProject, PodcastData, NextSteps, DayPlan, Binder, Note, NoteHighlight } from './types';
import TopicSearch from './components/TopicSearch';
import ProficiencyAssessment from './components/ProficiencyAssessment';
import LearningPathGraph from './components/LearningPathGraph';
import ContentPlayer from './components/ContentPlayer';
import DocumentAnalyzer from './components/DocumentAnalyzer';
import LiveTutor from './components/LiveTutor';
import TestModule from './components/TestModule'; 
import ReviewDashboard from './components/ReviewDashboard'; 
<<<<<<< HEAD
import AnalogyCommunity from './components/AnalogyCommunity';
=======
>>>>>>> 2867a5c (Update wire connection visuals)
import UserProfileView from './components/UserProfile';
import CodeAnalogy from './components/CodeAnalogy';
import PracticeMode from './components/PracticeMode';
import ScenarioChat from './components/ScenarioChat';
import MasteryBar from './components/MasteryBar'; 
import CheatSheet from './components/CheatSheet';
import CapstoneWidget from './components/CapstoneWidget'; 
import VideoAnalyzer from './components/VideoAnalyzer';
import NotebookView from './components/NotebookView';
import { generatePrerequisiteGraph, analyzeDocument, generateCapstoneProject, generatePodcastAudio, generateNextSteps } from './services/gemini';
import { srsSystem } from './services/srsSystem'; 
import { authService } from './services/authService';
import { knowledgeGraphService } from './services/knowledgeGraphService';
import { User, ChevronRight, Loader2, FileText, Bell, LogIn, FileCheck, PlayCircle, Headphones, Flame } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

// Robust Inline SVG Logo
const InLaymanLogo = () => (
  <svg width="40" height="40" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M20 20 H140 L180 60 V180 H20 V20 Z" stroke="none" fill="#020617"/>
    <path d="M20 20 H140 L180 60 V180 H20 V20 Z" stroke="white" strokeWidth="12"/>
    <path d="M20 20 H140 L180 60 V100 H20 V20 Z" fill="#06b6d4"/>
    <rect x="50" y="130" width="100" height="50" fill="white"/>
  </svg>
);

const MockGoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [topic, setTopic] = useState('');
  const [proficiencyScore, setProficiencyScore] = useState(0);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [currentConceptId, setCurrentConceptId] = useState<string | null>(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentAnalysis | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isAnalyzingDocument, setIsAnalyzingDocument] = useState(false);
  const [dueReviewsCount, setDueReviewsCount] = useState(0);
  const [lastAnalogyDomain, setLastAnalogyDomain] = useState<string | null>(null); 
  const [lastActiveTopic, setLastActiveTopic] = useState<string | null>(null);
  const [nextSteps, setNextSteps] = useState<NextSteps | null>(null);
  const [activeGoalTask, setActiveGoalTask] = useState<DayPlan | null>(null);
  
  // Navigation State for Notebook (Deep Linking)
  const [notebookInitState, setNotebookInitState] = useState<{binderId: string, noteId: string} | null>(null);
  
  // Capstone State
  const [capstoneProject, setCapstoneProject] = useState<CapstoneProject | null>(null);
  const [loadingCapstone, setLoadingCapstone] = useState(false);

  // Podcast State
  const [podcast, setPodcast] = useState<PodcastData | null>(null);
  const [loadingPodcast, setLoadingPodcast] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Video State
  const [videoUrl, setVideoUrl] = useState('');

  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
      setDueReviewsCount(srsSystem.getDueItems().length);
      setUser(authService.getCurrentUser()); 
  }, [view]);

  const handleLogin = async () => {
      setIsLoggingIn(true);
      const u = await authService.login();
      setUser(u);
      setIsLoggingIn(false);
  };

  const handleLogout = () => {
      authService.logout();
      setUser(null);
      setView(AppView.HOME);
  };

  const handleSearch = (searchTopic: string) => { setTopic(searchTopic); setLastActiveTopic(searchTopic); setView(AppView.ASSESSMENT); };
  const handleTestStart = (topicToTest: string) => { if (topicToTest) { setTopic(topicToTest); setView(AppView.TEST); } };
  const handlePracticeStart = (t: string) => { setTopic(t); setView(AppView.PRACTICE); };
  const handleScenarioStart = (t: string) => { setTopic(t); setView(AppView.SCENARIO); };
  const handleVideoStart = (url: string) => { setVideoUrl(url); setView(AppView.VIDEO); };

  const handleFileAnalyze = async (base64: string, mimeType: string) => {
      setIsAnalyzingDocument(true); 
      
      try { 
          const result = await analyzeDocument(base64, mimeType); 
          
          if (!result) throw new Error("Analysis Failed");

          // --- SMART CONVERSION LOGIC ---
          // 1. Create content string from analysis sections
          let content = `# ${result.title}\n\n> ${result.summary}\n\n---\n\n`;
          
          if (Array.isArray(result.sections)) {
              result.sections.forEach(sec => {
                  content += `## ${sec.title}\n${sec.content}\n\n`;
                  if (sec.analogyNote) {
                      content += `> **Analogy:** ${sec.analogyNote}\n\n`;
                  }
              });
          }
          
          // 2. Extract Highlights
          const highlights: NoteHighlight[] = Array.isArray(result.keyConcepts) ? result.keyConcepts.map((kc, i) => ({
              id: `hl-${i}`,
              text: kc.term,
              analogy: kc.analogy,
              explanation: kc.definition,
              color: '#06b6d4' // teal
          })) : [];

          // 3. Create Note Object
          const newNote: Note = {
              id: Date.now().toString(),
              title: result.title || "Uploaded Document",
              content: content,
              lastModified: Date.now(),
              diagrams: [],
              flashcards: [],
              references: [],
              highlights: highlights
          };

          // 4. Save to Binder in LocalStorage
          const binderId = 'binder-docs';
          const rawBinders = localStorage.getItem('inlayman_binders');
          let binders: Binder[] = rawBinders ? JSON.parse(rawBinders) : [];
          
          let docBinder = binders.find(b => b.id === binderId);
          if (!docBinder) {
              docBinder = {
                  id: binderId,
                  title: 'Uploaded Documents',
                  goal: 'Simplify and Understand',
                  themeColor: '#10b981', // Emerald
                  notes: []
              };
              binders.push(docBinder);
          }
          // Add to top of list
          docBinder.notes = [newNote, ...docBinder.notes];
          localStorage.setItem('inlayman_binders', JSON.stringify(binders));

          // 5. Redirect to Notebook
          setNotebookInitState({ binderId, noteId: newNote.id });
          // Short delay to allow progress bar to finish visually
          setTimeout(() => {
              setView(AppView.NOTEBOOK);
          }, 800);

      } catch (error) { 
          console.error("Analysis failed", error); 
          alert("Failed to analyze document."); 
          setView(AppView.HOME); 
      } finally { 
          setIsAnalyzingDocument(false); 
      }
  }

  const handleGoalTaskStart = (task: DayPlan) => {
      setActiveGoalTask(task);
      setTopic(task.topic);
      if (task.taskType === 'CODE') setView(AppView.CODE);
      else if (task.taskType === 'SIMULATION') setView(AppView.SCENARIO);
      else setView(AppView.ASSESSMENT); // Default to learning path for THEORY
  };

  // Called when any module finishes (Practice, Scenario, Learning)
  const completeGoalTaskIfActive = () => {
      if (activeGoalTask) {
          const goal = authService.getGoal();
          if (goal && goal.curriculum[goal.progress]?.day === activeGoalTask.day) {
              goal.progress += 1;
              authService.saveGoal(goal);
          }
          setActiveGoalTask(null);
      }
  }

  const handleAssessmentComplete = async (score: number) => {
    setIsGeneratingRoadmap(true); setProficiencyScore(score);
    const level = score > 80 ? 'Advanced' : score > 40 ? 'Intermediate' : 'Beginner';
    try {
      const path = await generatePrerequisiteGraph(topic, level);
      setLearningPath(path);
      // Logic for unlocking based on score
      const nodes = path.nodes;
      
      if (score < 50) {
          nodes.forEach((n, i) => n.status = i === 0 ? 'available' : 'locked');
          setCurrentConceptId(nodes[0].id);
      } else if (score < 80) {
          const mid = Math.floor(nodes.length / 2);
          nodes.forEach((n, i) => n.status = i <= mid ? 'completed' : i === mid + 1 ? 'available' : 'locked');
          if(nodes[mid]) { nodes[mid].status = 'available'; setCurrentConceptId(nodes[mid].id); }
          else setCurrentConceptId(nodes[0].id);
      } else {
          nodes.forEach(n => n.status = 'completed');
          nodes[nodes.length-1].status = 'available'; // Challenge final
          setCurrentConceptId(nodes[nodes.length-1].id);
      }
      
      setLearningPath({ ...path, nodes });
      
      // Generate Capstone Project in background
      setLoadingCapstone(true);
      generateCapstoneProject(topic, nodes).then(proj => {
          setCapstoneProject(proj);
          setLoadingCapstone(false);
      });

      setView(AppView.ROADMAP);
    } catch (e) { console.error("Failed", e); } finally { setIsGeneratingRoadmap(false); }
  };

  const handleStartLearning = (nodeId: string) => { setCurrentConceptId(nodeId); setView(AppView.LEARNING); };
  
  const handleConceptComplete = async (domainUsed: string) => {
    setLastAnalogyDomain(domainUsed); // SAVE GOLDEN THREAD
    authService.updateStreak(); // Update Streak
    completeGoalTaskIfActive();
    
    if (!learningPath || !currentConceptId) return;
    const conceptName = learningPath.nodes.find(n => n.id === currentConceptId)?.label || topic;
    srsSystem.addTopic(conceptName);
    knowledgeGraphService.addTopic(conceptName); 
    
    const newNodes = learningPath.nodes.map(n => { if (n.id === currentConceptId) return { ...n, status: 'completed' as const }; return n; });
    const outboundLinks = learningPath.links.filter(l => l.source === currentConceptId);
    outboundLinks.forEach(link => { const targetNode = newNodes.find(n => n.id === link.target); if (targetNode && targetNode.status === 'locked') { targetNode.status = 'available'; } });
    
    setLearningPath({ ...learningPath, nodes: newNodes });
    
    // Check if roadmap is complete
    const isAllComplete = newNodes.every(n => n.status === 'completed');
    if (isAllComplete) {
        const next = await generateNextSteps(topic);
        setNextSteps(next);
    }

    // Update Capstone Progress
    if (capstoneProject) {
        const newTasks = capstoneProject.tasks.map(t => {
            if (t.nodeId === currentConceptId) return { ...t, isCompleted: true };
            return t;
        });
        const completedCount = newTasks.filter(t => t.isCompleted).length;
        if (newTasks[completedCount]) newTasks[completedCount].isUnlocked = true;
        setCapstoneProject({ ...capstoneProject, tasks: newTasks });
    }

    setView(AppView.ROADMAP);
  };

  const handleGeneratePodcast = async () => {
      if (!learningPath) return;
      setLoadingPodcast(true);
      const data = await generatePodcastAudio(topic, learningPath.nodes);
      setPodcast(data);
      setLoadingPodcast(false);
  }

  const getCurrentConceptName = () => { return learningPath?.nodes.find(n => n.id === currentConceptId)?.label || topic; };

  const calculateProgress = () => {
      if (!learningPath) return 0;
      const total = learningPath.nodes.length;
      const completed = learningPath.nodes.filter(n => n.status === 'completed').length;
      return Math.round((completed / total) * 100);
  }

  const renderContent = () => {
    switch (view) {
      case AppView.HOME:
        return (
            <TopicSearch 
                key="home" 
                onSearch={handleSearch} 
                onFileAnalyze={handleFileAnalyze}
                onVoiceStart={() => setShowVoiceModal(true)}
                onTestStart={handleTestStart}
<<<<<<< HEAD
                onOpenCommunity={() => setView(AppView.COMMUNITY)}
=======
>>>>>>> 2867a5c (Update wire connection visuals)
                onPracticeStart={handlePracticeStart}
                onScenarioStart={handleScenarioStart}
                onCodeStart={() => setView(AppView.CODE)}
                onOpenGraph={() => { setView(AppView.PROFILE); }}
                onVideoStart={handleVideoStart}
                onOpenNotebook={() => { setNotebookInitState(null); setView(AppView.NOTEBOOK); }}
                lastActiveTopic={lastActiveTopic}
                onGoalTaskStart={handleGoalTaskStart}
                isAnalyzingDocument={isAnalyzingDocument}
            />
        );
      case AppView.ASSESSMENT: return <ProficiencyAssessment key="assessment" topic={topic} onComplete={handleAssessmentComplete} isGenerating={isGeneratingRoadmap} />;
      case AppView.TEST: return <TestModule topic={topic} onBack={() => { completeGoalTaskIfActive(); setView(AppView.HOME); }} />;
      case AppView.DOCUMENT: return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary-500"/></div>; // Temp state while redirecting
      // REVIEW: Handle Initial Topic for direct review
      case AppView.REVIEW: return <ReviewDashboard onBack={() => setView(AppView.HOME)} initialTopic={topic !== '' ? topic : undefined} />;
<<<<<<< HEAD
      case AppView.COMMUNITY: return <AnalogyCommunity onBack={() => setView(AppView.HOME)} />;
=======
>>>>>>> 2867a5c (Update wire connection visuals)
      // PROFILE: Pass review handler
      case AppView.PROFILE: return <UserProfileView onBack={() => setView(AppView.HOME)} onLogout={handleLogout} onReviewTopic={(t) => { setTopic(t); setView(AppView.REVIEW); }} />;
      case AppView.PRACTICE: return <PracticeMode topic={topic} onBack={() => { completeGoalTaskIfActive(); setView(AppView.HOME); }} />;
      case AppView.SCENARIO: return <ScenarioChat topic={topic} onBack={() => { completeGoalTaskIfActive(); setView(AppView.HOME); }} />;
      case AppView.CODE: return <CodeAnalogy onBack={() => { completeGoalTaskIfActive(); setView(AppView.HOME); }} />;
      case AppView.CHEAT_SHEET: return <CheatSheet topic={topic} nodes={learningPath?.nodes || []} onBack={() => setView(AppView.ROADMAP)} />;
      case AppView.VIDEO: return <VideoAnalyzer initialUrl={videoUrl} onBack={() => setView(AppView.HOME)} />;
      case AppView.NOTEBOOK: return <NotebookView onBack={() => setView(AppView.HOME)} initialBinderId={notebookInitState?.binderId} initialNoteId={notebookInitState?.noteId} />;
      case AppView.ROADMAP:
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto p-6 space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-slate-800">
                <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2"><span>{topic}</span><ChevronRight className="w-4 h-4" /><span className="text-primary-400">Roadmap</span></div>
                    <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Your Custom Curriculum</h2>
                    <p className="text-slate-400 mt-2">Based on your assessment, we've designed this optimal path.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleGeneratePodcast} disabled={loadingPodcast} className="px-4 py-2 text-sm font-bold bg-slate-800 text-slate-200 hover:text-white rounded-lg flex items-center gap-2 border border-slate-700 transition-all hover:border-primary-500">
                        {loadingPodcast ? <Loader2 className="animate-spin w-4 h-4"/> : <Headphones className="w-4 h-4 text-purple-400"/>} 
                        {podcast ? 'Regenerate Podcast' : 'Generate Podcast'}
                    </button>
                    <button onClick={() => setView(AppView.CHEAT_SHEET)} className="px-4 py-2 text-sm font-bold bg-slate-800 text-slate-200 hover:text-white rounded-lg flex items-center gap-2 border border-slate-700">
                        <FileCheck size={16}/> Get Cheat Sheet
                    </button>
                    <button onClick={() => setView(AppView.HOME)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors">Start Over</button>
                </div>
            </div>
            
            {/* Podcast Player */}
            <AnimatePresence>
                {podcast && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-purple-900/10">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Headphones className="w-5 h-5"/>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-white">Daily Commute Summary</h4>
                            <p className="text-xs text-slate-400">Prof. Albus & Chad discuss {topic}</p>
                        </div>
                        <audio ref={audioRef} controls src={podcast.audioUrl} className="h-8 w-64" />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    <MasteryBar progress={calculateProgress()} />
                    {learningPath && currentConceptId && 
                        <LearningPathGraph 
                            data={learningPath} 
                            currentNodeId={currentConceptId} 
                            onSelectNode={(id) => handleStartLearning(id)}
                            onPractice={(t) => handlePracticeStart(t)}
                            onSimulate={(t) => handleScenarioStart(t)}
                            nextSteps={nextSteps}
                            onSelectTopic={(t) => handleSearch(t)}
                        />
                    }
                </div>
                <div className="lg:col-span-1">
                    <CapstoneWidget project={capstoneProject} loading={loadingCapstone} />
                </div>
            </div>
          </motion.div>
        );
      case AppView.LEARNING:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-80px)]">
             <div className="max-w-[1400px] mx-auto h-full flex flex-col p-4 md:p-6">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setView(AppView.ROADMAP)} className="text-slate-500 hover:text-slate-200 font-medium flex items-center w-fit transition-colors group"><div className="p-1 rounded-md bg-slate-900 border border-slate-700 mr-2 group-hover:border-slate-500 transition-colors"><ChevronRight className="w-4 h-4 rotate-180" /></div>Back to Roadmap</button>
                    <div className="w-64"><MasteryBar progress={calculateProgress()} compact /></div>
                </div>
                <div className="flex-1 min-h-0">
                    <ContentPlayer 
                        concept={getCurrentConceptName()} 
                        context={topic} 
                        previousDomain={lastAnalogyDomain}
                        onComplete={handleConceptComplete} 
                        onPractice={() => handlePracticeStart(getCurrentConceptName())}
                    />
                </div>
             </div>
          </motion.div>
        );
      default: return <div>View not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-dot-pattern selection:bg-primary-900 selection:text-white font-sans text-slate-100 relative">
      <nav className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/60 transition-all">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group select-none hover:opacity-90 transition-opacity" onClick={() => setView(AppView.HOME)}>
              <InLaymanLogo />
              <span className="text-2xl font-extrabold tracking-tight text-white font-sans">InLayman</span>
            </div>
            
            <div className="flex items-center gap-6">
               <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 shadow-sm transition-colors hover:border-slate-700 cursor-default">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></div><span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Beta v1.0</span>
               </div>
               
               <button onClick={() => setView(AppView.REVIEW)} className="relative p-2 text-slate-400 hover:text-white transition-colors" title="Review Due">
                   <Bell className="w-5 h-5" />
                   {dueReviewsCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-slate-950 animate-pulse"></span>}
               </button>
               
               <div className="h-6 w-px bg-slate-800 hidden md:block"></div>
               
               {user ? (
                 <button onClick={() => setView(AppView.PROFILE)} className="flex items-center gap-3 group focus:outline-none">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{user.name}</div>
                        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider group-hover:text-primary-400 transition-colors flex items-center justify-end gap-1">
                            {user.streak && user.streak > 0 && <span className="text-orange-400 flex items-center"><Flame size={10} className="mr-0.5"/> {user.streak}</span>}
                            <span>Free Plan</span>
                        </div>
                    </div>
                    <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-cyan-500 p-[2px] shadow-md group-hover:shadow-lg group-hover:shadow-primary-500/20 transition-all">
                       <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full bg-slate-900 object-cover" />
                    </div>
                 </button>
               ) : (
                 <button 
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-200 transition-all shadow-lg shadow-white/10 disabled:opacity-70"
                 >
                    {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <MockGoogleIcon />}
                    <span className="text-sm">Sign in</span>
                 </button>
               )}
            </div>
          </div>
        </div>
      </nav>
      <AnimatePresence>
        {showVoiceModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                <div className="w-full max-w-lg relative"><LiveTutor standalone onClose={() => setShowVoiceModal(false)} /></div>
            </motion.div>
        )}
      </AnimatePresence>
      <main className="w-full relative z-0">
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </main>
    </div>
  );
};

<<<<<<< HEAD
export default App;
=======
export default App;
>>>>>>> 2867a5c (Update wire connection visuals)
