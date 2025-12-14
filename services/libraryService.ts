
import { SavedAnalogy, CommunityAnalogy, UserPreferences } from '../types';

const LIBRARY_KEY = 'inlayman_library_data';
const PREFS_KEY = 'inlayman_user_prefs';
const COMMUNITY_KEY = 'inlayman_community_mock';

export const libraryService = {
    saveAnalogy: (analogy: any) => {
        const saved = libraryService.getSavedAnalogies();
        const newItem: SavedAnalogy = {
            ...analogy,
            id: Date.now().toString(),
            dateSaved: Date.now()
        };
        saved.push(newItem);
        localStorage.setItem(LIBRARY_KEY, JSON.stringify(saved));
    },

    getSavedAnalogies: (): SavedAnalogy[] => {
        const raw = localStorage.getItem(LIBRARY_KEY);
        return raw ? JSON.parse(raw) : [];
    },

    getPreferences: (): UserPreferences => {
        const raw = localStorage.getItem(PREFS_KEY);
        return raw ? JSON.parse(raw) : { likedDomains: [], dislikedDomains: [] };
    },

    likeDomain: (domain: string) => {
        const prefs = libraryService.getPreferences();
        if (domain && !prefs.likedDomains.includes(domain)) {
            prefs.likedDomains.push(domain);
            prefs.dislikedDomains = prefs.dislikedDomains.filter(d => d !== domain);
            localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
        }
    },

    dislikeDomain: (domain: string) => {
        const prefs = libraryService.getPreferences();
        if (domain && !prefs.dislikedDomains.includes(domain)) {
            prefs.dislikedDomains.push(domain);
            prefs.likedDomains = prefs.likedDomains.filter(d => d !== domain);
            localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
        }
    },

    getCommunityAnalogies: (): CommunityAnalogy[] => {
        const raw = localStorage.getItem(COMMUNITY_KEY);
        if (raw) return JSON.parse(raw);
        
        const seeds: CommunityAnalogy[] = [
            {
                id: 'seed1',
                topic: 'API',
                title: 'The Restaurant Waiter',
                content: 'Think of an API as a waiter in a restaurant. You (the client) sit at a table with a menu. The kitchen (the server) prepares the food. But you dont go into the kitchen yourself. The waiter takes your order (request), brings it to the kitchen, and brings back the food (response).',
                author: 'System',
                votes: 124,
                tags: ['Tech', 'Classic'],
                datePosted: Date.now() - 10000000
            },
            {
                id: 'seed2',
                topic: 'Redux',
                title: 'The Town Noticeboard',
                content: 'Imagine a town where people usually whisper secrets (local state). But for important news, there is one giant noticeboard in the town square (Store). Anyone can read it. To change it, you must fill out an official "Action Form" and give it to the "Reducer" clerk.',
                author: 'CodeWizard99',
                votes: 89,
                tags: ['Coding', 'Management'],
                datePosted: Date.now() - 5000000
            }
        ];
        localStorage.setItem(COMMUNITY_KEY, JSON.stringify(seeds));
        return seeds;
    },

    voteCommunityAnalogy: (id: string, delta: number) => {
        const list = libraryService.getCommunityAnalogies();
        const item = list.find(i => i.id === id);
        if (item) {
            item.votes += delta;
            localStorage.setItem(COMMUNITY_KEY, JSON.stringify(list));
        }
    },

    shareToCommunity: (topic: string, title: string, content: string, author: string) => {
        const list = libraryService.getCommunityAnalogies();
        const newItem: CommunityAnalogy = {
            id: Date.now().toString(),
            topic,
            title,
            content,
            author,
            votes: 0,
            tags: ['User Submitted'],
            datePosted: Date.now()
        };
        list.unshift(newItem); 
        localStorage.setItem(COMMUNITY_KEY, JSON.stringify(list));
    }
};
