
import { UserProfile, TestResult, UserGoal } from '../types';

const USER_KEY = 'inlayman_user_profile';
const TEST_KEY = 'inlayman_test_history';
const GOAL_KEY = 'inlayman_user_goal';

export const authService = {
    login: async (): Promise<UserProfile> => {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockUser: UserProfile = {
            id: 'user_123',
            name: 'Alex Sterling',
            email: 'alex.learner@gmail.com',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
            joinDate: Date.now(),
            testHistory: authService.getLocalTests(),
            streak: 1
        };
        
        localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
        return mockUser;
    },

    logout: () => {
        localStorage.removeItem(USER_KEY);
    },

    getCurrentUser: (): UserProfile | null => {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        const user = JSON.parse(raw);
        user.testHistory = authService.getLocalTests();
        return user;
    },

    saveTestResult: (result: TestResult, topic: string) => {
        const tests = authService.getLocalTests();
        const newResult = { ...result, dateTaken: Date.now(), topic };
        tests.unshift(newResult);
        localStorage.setItem(TEST_KEY, JSON.stringify(tests));
        
        const user = authService.getCurrentUser();
        if (user) {
            user.testHistory = tests;
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
    },

    getLocalTests: (): TestResult[] => {
        const raw = localStorage.getItem(TEST_KEY);
        return raw ? JSON.parse(raw) : [];
    },

    updateStreak: () => {
        const user = authService.getCurrentUser();
        if (user) {
            user.streak = (user.streak || 0) + 1;
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
    },

    saveGoal: (goal: UserGoal) => {
        localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
    },

    getGoal: (): UserGoal | null => {
        const raw = localStorage.getItem(GOAL_KEY);
        return raw ? JSON.parse(raw) : null;
    }
};
