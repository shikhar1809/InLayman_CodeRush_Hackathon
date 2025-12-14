
import React, { useState, useEffect } from 'react';
import { GoalContext } from '../types';
import { parseGoalInput, generateNorthStarContext } from '../services/geminiService';
import { Plus, ChevronRight, Check, ListTodo, ChevronLeft, Edit3, Sparkles, Target, Activity } from 'lucide-react';

interface GoalPanelProps {
  goalContext: GoalContext;
  onUpdateGoal: (newGoal: GoalContext) => void;
  focusMode?: boolean;
  onAnalyze?: () => void;
  analyzing?: boolean;
}

const GoalPanel: React.FC<GoalPanelProps> = ({ goalContext, onUpdateGoal, focusMode, onAnalyze, analyzing }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Default to open only on larger screens (Tablet/Desktop)
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);
  const [newTaskInput, setNewTaskInput] = useState('');

  useEffect(() => {
    if (focusMode) {
      setIsOpen(false);
    }
  }, [focusMode]);

  const handleSetGoal = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      // 1. Parse Goal & Create Plan
      const newContext = await parseGoalInput(input);
      
      // Initialize completed state for tasks
      if (newContext.action_plan) {
          newContext.action_plan = newContext.action_plan.map(item => ({ ...item, completed: false }));
      }

      // 2. Generate North Star Strategy (Context Awareness)
      const checklistItems = newContext.action_plan?.map(i => i.step) || [];
      if (checklistItems.length > 0) {
          const northStar = await generateNorthStarContext(newContext.objective, checklistItems);
          if (northStar) {
              newContext.north_star = northStar;
          }
      }

      onUpdateGoal(newContext);
      setInput('');
    } catch (e) {
      alert("Could not parse goal. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const startManualChecklist = () => {
      onUpdateGoal({
          objective: input.trim() || 'My Checklist',
          status: 'In Progress',
          action_plan: []
      });
      setInput('');
  };

  const toggleTask = (index: number) => {
      if (!goalContext.action_plan) return;
      const updatedPlan = [...goalContext.action_plan];
      updatedPlan[index].completed = !updatedPlan[index].completed;
      onUpdateGoal({ ...goalContext, action_plan: updatedPlan });
  };

  const addTask = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTaskInput.trim()) return;
      const currentPlan = goalContext.action_plan || [];
      const updatedPlan = [{ step: newTaskInput.trim(), date: 'Manual', completed: false }, ...currentPlan];
      onUpdateGoal({ ...goalContext, action_plan: updatedPlan });
      setNewTaskInput('');
  };

  const activeTasks = goalContext.action_plan?.filter(t => !t.completed) || [];
  const hasObjective = !!goalContext.objective;

  return (
    <>
      {/* --- COLLAPSED STATE: No Objective (Vertical Tab) --- */}
      <div 
          className={`fixed left-0 top-24 z-[60] transition-all duration-300 ease-spring ${
              !isOpen && !hasObjective ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
          }`}
      >
          <button 
            onClick={() => setIsOpen(true)}
            className="bg-stone-800 text-stone-100 p-3 rounded-r-lg shadow-lg font-serif hover:bg-stone-700 transition-all border-y border-r border-stone-600"
          >
            <span className="writing-vertical-rl text-sm tracking-widest">GOAL</span>
          </button>
      </div>

      {/* --- COLLAPSED STATE: With Objective (Mini Widget) --- */}
      <div 
          className={`fixed left-4 top-24 z-[60] flex flex-col items-start gap-2 transition-all duration-300 ease-spring ${
              !isOpen && hasObjective ? 'translate-x-0 opacity-100 delay-100' : '-translate-x-10 opacity-0 pointer-events-none'
          }`}
      >
          {/* Minimized Header */}
          <button 
              onClick={() => setIsOpen(true)}
              className="bg-stone-800 text-stone-100 px-3 py-2 rounded-lg shadow-lg font-serif hover:bg-stone-700 transition-all flex items-center gap-2 group border border-stone-700"
              title="Expand Objective"
          >
              <ChevronRight size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Objective</span>
          </button>

          {/* Floating Tasks Widget */}
          <div className="flex flex-col gap-1 max-w-[240px]">
              {activeTasks.length > 0 ? (
                  activeTasks.slice(0, 5).map((task, idx) => {
                      const originalIndex = goalContext.action_plan?.findIndex(t => t.step === task.step) ?? -1;
                      
                      return (
                          <div 
                              key={idx} 
                              className="bg-white border border-stone-200 p-2 rounded-md shadow-sm flex items-start gap-2 group hover:scale-[1.02] transition-transform cursor-pointer"
                              onClick={() => originalIndex !== -1 && toggleTask(originalIndex)}
                          >
                              <div className="mt-0.5 w-4 h-4 rounded border border-stone-300 flex items-center justify-center bg-white group-hover:border-stone-500 shrink-0">
                              </div>
                              <span className="text-xs font-handwriting text-stone-700 leading-tight line-clamp-2 select-none">
                                  {task.step}
                              </span>
                          </div>
                      );
                  })
              ) : (
                  <div className="bg-white p-2 rounded border border-stone-200 text-[10px] text-stone-500 italic flex items-center gap-2">
                      <Check size={12} /> No active tasks
                  </div>
              )}
              
              {activeTasks.length > 5 && (
                  <div className="bg-white/90 p-1 rounded text-[10px] text-stone-500 text-center font-bold">
                      +{activeTasks.length - 5} more
                  </div>
              )}
          </div>
      </div>

      {/* --- EXPANDED STATE: Main Panel --- */}
      <div 
        className={`fixed left-4 top-20 bottom-4 w-80 max-w-[calc(100vw-2rem)] bg-[#fdfbf7] shadow-paper-float rounded-xl p-0 z-[60] flex flex-col border border-stone-200 overflow-hidden transition-all duration-500 ease-spring ${
            isOpen ? 'translate-x-0 opacity-100' : '-translate-x-[110%] opacity-0 pointer-events-none'
        }`}
      >
        
        {/* Header Container - Flexbox to prevent overlap */}
        <div className="flex justify-between items-start p-6 pb-2 shrink-0 bg-[#fdfbf7] border-b border-stone-100">
          <div className="flex items-center gap-2 pr-2">
              <h2 className="font-serif font-bold text-xl text-stone-800 leading-none">The Objective</h2>
          </div>
          <button 
              onClick={() => setIsOpen(false)} 
              className="text-stone-400 hover:text-stone-800 p-1 hover:bg-stone-100 rounded transition-colors -mr-2 -mt-2"
          >
              <ChevronLeft size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-6 pt-2 bg-[#fdfbf7]">
        {!goalContext.objective ? (
          <div className="flex-1 flex flex-col justify-center animate-pop-in">
              <label className="text-sm font-serif text-stone-500 mb-2 font-medium">What is your focus?</label>
              <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g., Learn Molecular Biology by Friday..."
                  className="w-full bg-stone-100 p-3 rounded-lg border-none focus:ring-2 focus:ring-stone-300 font-handwriting text-lg resize-none mb-4 placeholder:text-stone-400/70"
                  rows={4}
              />
              
              <div className="space-y-3">
                  <button
                      onClick={handleSetGoal}
                      disabled={loading}
                      className="w-full bg-stone-800 text-stone-50 py-3 rounded-lg font-serif text-sm hover:bg-stone-700 transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2 group"
                  >
                      {loading ? <Sparkles size={14} className="animate-spin"/> : <Sparkles size={14} className="text-yellow-400 group-hover:text-yellow-300"/>}
                      <span>{loading ? 'Strategizing...' : 'Set Context'}</span>
                  </button>
                  
                  <div className="relative py-2 flex items-center">
                      <div className="flex-grow border-t border-stone-200"></div>
                      <span className="flex-shrink-0 mx-3 text-stone-300 text-[10px] font-bold uppercase tracking-widest">Or</span>
                      <div className="flex-grow border-t border-stone-200"></div>
                  </div>

                  <button 
                      onClick={startManualChecklist}
                      className="w-full bg-white border-2 border-dashed border-stone-300 text-stone-500 py-2.5 rounded-lg font-serif text-sm hover:border-stone-500 hover:text-stone-700 transition-all flex items-center justify-center gap-2 group hover:bg-stone-50"
                  >
                      <ListTodo size={14} className="text-stone-400 group-hover:text-stone-800"/>
                      <span>Create Checklist</span>
                  </button>
              </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar flex flex-col h-full">
              {/* Current Context Card */}
              <div className="mb-6 p-4 bg-stone-100 rounded-lg border border-stone-200 shadow-inner relative group">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Target size={12}/> Current Goal
                  </p>
                  <p className="font-serif text-lg leading-tight text-stone-800 break-words">{goalContext.objective}</p>
                  
                  {/* North Star Indicator */}
                  {goalContext.north_star && (
                      <div className="mt-3 pt-3 border-t border-stone-200 flex gap-2 overflow-x-auto no-scrollbar">
                          {(goalContext.north_star.priority_tags || []).map((tag, i) => (
                              <span key={i} className="text-[9px] bg-white border border-stone-200 px-2 py-0.5 rounded-full text-stone-500 font-bold whitespace-nowrap">
                                  {tag}
                              </span>
                          ))}
                      </div>
                  )}

                  <button 
                      onClick={() => onUpdateGoal({ ...goalContext, objective: '' })}
                      className="absolute top-2 right-2 p-1 text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      title="Edit Goal"
                  >
                      <Edit3 size={12} />
                  </button>
              </div>
              
              {/* Alignment Analysis Trigger */}
              {onAnalyze && (
                  <button 
                      onClick={onAnalyze}
                      disabled={analyzing}
                      className="w-full mb-6 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 text-indigo-700 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                      {analyzing ? <Activity size={14} className="animate-spin" /> : <Activity size={14} />}
                      {analyzing ? "Analyzing Notes..." : "Check Goal Alignment"}
                  </button>
              )}

              {/* Action Plan Section */}
              <div className="border-t border-stone-200 pt-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-end mb-3">
                      <p className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2">
                          <ListTodo size={14} /> Action Plan
                      </p>
                      <span className="text-[10px] text-stone-400 font-mono bg-stone-100 px-2 py-0.5 rounded-full">
                          {goalContext.action_plan?.filter(t => t.completed).length || 0}/{goalContext.action_plan?.length || 0}
                      </span>
                  </div>

                  {/* Checklist */}
                  <ul className="space-y-2 pb-4 flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                      {goalContext.action_plan && goalContext.action_plan.length > 0 ? (
                          goalContext.action_plan.map((step, idx) => {
                              // Check mapping from North Star
                              const category = goalContext.north_star?.checklist_mapping?.[step.step];
                              
                              return (
                                  <li key={idx} className={`flex gap-3 items-start group p-2 rounded-lg transition-colors ${step.completed ? 'bg-green-50/50' : 'hover:bg-white border border-transparent hover:border-stone-100'}`}>
                                      <button 
                                          onClick={() => toggleTask(idx)}
                                          className={`flex-shrink-0 w-5 h-5 mt-1 rounded border flex items-center justify-center transition-all shadow-sm ${step.completed ? 'bg-green-500 border-green-500 text-white' : 'border-stone-300 bg-white hover:border-stone-500'}`}
                                      >
                                          {step.completed && <Check size={12} strokeWidth={4} />}
                                      </button>
                                      <div className={`${step.completed ? 'opacity-50 line-through' : ''} transition-opacity w-full min-w-0`}>
                                          <p className="font-handwriting text-lg leading-tight text-stone-700 break-words whitespace-normal">{step.step}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                              {step.date && step.date !== 'Manual' && <p className="text-[10px] text-stone-400 font-serif">{step.date}</p>}
                                              {category && (
                                                  <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider bg-indigo-50 px-1.5 rounded-sm">
                                                      {category.replace('topic_', '')}
                                                  </span>
                                              )}
                                          </div>
                                      </div>
                                  </li>
                              );
                          })
                      ) : (
                          <div className="text-center py-6 bg-stone-50/50 rounded-lg border border-dashed border-stone-200 mt-2">
                               <p className="text-xs text-stone-400 italic">List is empty.</p>
                               <p className="text-[10px] text-stone-300 font-bold uppercase mt-1">Start adding tasks</p>
                          </div>
                      )}
                  </ul>

                  {/* Add New Task (Sticky at Bottom) */}
                  <form onSubmit={addTask} className="relative mt-2 pt-2 border-t border-stone-100">
                      <input 
                          type="text"
                          value={newTaskInput}
                          onChange={(e) => setNewTaskInput(e.target.value)}
                          placeholder="Add new item..."
                          className="w-full bg-white border-2 border-stone-200 rounded-lg pl-3 pr-10 py-2.5 text-sm font-handwriting focus:border-stone-400 focus:ring-0 outline-none shadow-sm transition-colors text-stone-800 placeholder:text-stone-400"
                      />
                      <button 
                          type="submit"
                          className="absolute right-1.5 top-3.5 w-7 h-7 bg-stone-100 hover:bg-stone-800 hover:text-white text-stone-500 rounded-md flex items-center justify-center transition-all shadow-sm"
                          title="Add Task"
                      >
                          <Plus size={14} />
                      </button>
                  </form>
              </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default GoalPanel;
