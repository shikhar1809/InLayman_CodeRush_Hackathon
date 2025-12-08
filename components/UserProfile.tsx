
<<<<<<< HEAD
=======

>>>>>>> 2867a5c (Update wire connection visuals)
import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { srsSystem } from '../services/srsSystem';
import { libraryService } from '../services/libraryService';
import { UserProfile, ReviewItem, CommunityAnalogy } from '../types';
import { User, LogOut, Award, Trophy, Calendar, ArrowLeft, Share2, PlayCircle, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import KnowledgeGraph from './KnowledgeGraph';

interface Props { onBack: () => void; onLogout: () => void; onReviewTopic: (topic: string) => void; }

const UserProfileView: React.FC<Props> = ({ onBack, onLogout, onReviewTopic }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [srsItems, setSrsItems] = useState<ReviewItem[]>([]);
    const [myAnalogies, setMyAnalogies] = useState<CommunityAnalogy[]>([]);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const u = authService.getCurrentUser();
        setUser(u);
        setSrsItems(srsSystem.getAll() || []);
        const all = libraryService.getCommunityAnalogies() || [];
        if (u) setMyAnalogies(all.filter(a => a.author === 'Guest User' || a.author === u.name));
    }, []);

    if (!user) return <div className="p-10 text-center">Please log in.</div>;
    const testHistory = Array.isArray(user.testHistory) ? user.testHistory : [];
    const avgScore = testHistory.length > 0 ? Math.round(testHistory.reduce((a, t) => a + t.totalScore, 0) / testHistory.length) : 0;

    return (
        <div className="max-w-6xl mx-auto p-6 min-h-screen">
             <div className="mb-6 flex justify-between">
                <button onClick={onBack} className="text-slate-400 hover:text-white flex gap-2"><ArrowLeft size={18} /> Home</button>
                <button onClick={onLogout} className="text-red-400 flex gap-2"><LogOut size={18} /> Sign Out</button>
             </div>
             <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 flex gap-6 items-center shadow-xl">
                <img src={user.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-primary-500" />
                <div>
                    <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                    <div className="flex gap-4 mt-2">
                         <div className="flex gap-1 text-yellow-400 text-sm"><Trophy size={16} /> Lvl 1 Scholar</div>
                         <div className="flex gap-1 text-blue-400 text-sm"><Calendar size={16} /> Joined {new Date(user.joinDate).toLocaleDateString()}</div>
                    </div>
                </div>
             </div>

             <div className="flex border-b border-slate-800 mb-6 gap-6 overflow-x-auto">
<<<<<<< HEAD
                 {['overview', 'learning', 'tests', 'community'].map(tab => (
=======
                 {['overview', 'learning', 'tests'].map(tab => (
>>>>>>> 2867a5c (Update wire connection visuals)
                     <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2 uppercase text-sm font-bold whitespace-nowrap ${activeTab === tab ? 'text-primary-500 border-b-2 border-primary-500' : 'text-slate-500'}`}>
                        {tab === 'learning' ? 'My Learning' : tab}
                     </button>
                 ))}
             </div>

             {activeTab === 'overview' && (
                 <div className="space-y-6">
                     <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                            <div className="text-sm text-slate-500 uppercase">Avg Score</div>
                            <div className="text-4xl font-bold text-white">{avgScore}%</div>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                            <div className="text-sm text-slate-500 uppercase">Topics Learned</div>
                            <div className="text-4xl font-bold text-blue-400">{srsItems.length}</div>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                            <div className="text-sm text-slate-500 uppercase">Contributions</div>
                            <div className="text-4xl font-bold text-green-400">{myAnalogies.length}</div>
                        </div>
                     </div>
                     <KnowledgeGraph />
                 </div>
             )}

             {activeTab === 'learning' && (
                 <div className="grid md:grid-cols-2 gap-4">
                    {srsItems.length === 0 && <div className="text-slate-500 col-span-2 text-center py-10">You haven't mastered any topics yet. Go learn something!</div>}
                    {srsItems.map((item, i) => (
                        <div key={i} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex justify-between items-center group hover:border-primary-500/30 transition-colors">
                            <div>
                                <h3 className="font-bold text-lg text-white">{item.topic}</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Lvl {item.masteryLevel}</span>
                                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Next Review: {new Date(item.nextReviewDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => onReviewTopic(item.topic)}
                                className="px-4 py-2 bg-slate-800 hover:bg-primary-600 text-slate-300 hover:text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                            >
                                <PlayCircle size={16} /> Review Now
                            </button>
                        </div>
                    ))}
                 </div>
             )}
             
             {activeTab === 'tests' && (
                 <div className="space-y-4">
                    {testHistory.map((t, i) => (
                        <div key={i} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between">
                            <div className="text-white font-bold">{t.topic}</div>
                            <div className={`font-bold ${t.totalScore > 80 ? 'text-green-400' : 'text-slate-400'}`}>{t.totalScore}%</div>
                        </div>
                    ))}
                 </div>
             )}
        </div>
    );
};
export default UserProfileView;
