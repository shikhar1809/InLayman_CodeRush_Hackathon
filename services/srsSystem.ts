
import { ReviewItem } from '../types';

const STORAGE_KEY = 'inlayman_srs_data';

export const srsSystem = {
    addTopic: (topic: string) => {
        const data = srsSystem.getAll();
        if (data.find(i => i.topic.toLowerCase() === topic.toLowerCase())) return;

        const newItem: ReviewItem = {
            topic,
            stage: 1,
            nextReviewDate: Date.now() + (24 * 60 * 60 * 1000), 
            lastReviewedDate: Date.now(),
            masteryLevel: 0
        };

        data.push(newItem);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },

    getAll: (): ReviewItem[] => {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    },

    getDueItems: (): ReviewItem[] => {
        const all = srsSystem.getAll();
        const now = Date.now();
        return all.filter(item => item.nextReviewDate <= now && item.stage !== 99);
    },

    submitReview: (topic: string, success: boolean) => {
        const all = srsSystem.getAll();
        const idx = all.findIndex(i => i.topic === topic);
        if (idx === -1) return;

        const item = all[idx];
        
        if (success) {
            if (item.stage === 1) item.stage = 2;
            else if (item.stage === 2) item.stage = 4;
            else if (item.stage === 4) item.stage = 7;
            else if (item.stage === 7) item.stage = 99;
            
            const daysToAdd = item.stage === 99 ? 365 : item.stage;
            item.nextReviewDate = Date.now() + (daysToAdd * 24 * 60 * 60 * 1000);
            item.masteryLevel = Math.min(100, item.masteryLevel + 25);
        } else {
            item.stage = 1;
            item.nextReviewDate = Date.now() + (24 * 60 * 60 * 1000); 
            item.masteryLevel = Math.max(0, item.masteryLevel - 10);
        }

        item.lastReviewedDate = Date.now();
        all[idx] = item;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    },

    generateMailAlert: (dueItems: ReviewItem[]) => {
        if (dueItems.length === 0) return null;
        const subject = encodeURIComponent(`InLayman Review: ${dueItems.length} Topics Due`);
        const bodyText = `Time to review!\n\nDue Topics:\n${dueItems.map(i => `- ${i.topic} (Stage: Day ${i.stage})`).join('\n')}\n\nReview now to retain knowledge.`;
        return `mailto:?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
    },

    exportToAnki: () => {
        const items = srsSystem.getAll();
        if(items.length === 0) return;
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + items.map(i => `"${i.topic}","Explain the concept of ${i.topic}"`).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "inlayman_flashcards.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
