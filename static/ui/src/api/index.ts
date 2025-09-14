import type { ApiResponse, JiraIssue, JiraProject, JiraUser, ProjectIssuesResponse, AutoAssignResponse } from '../types/jira';
import { initializeContext, getCurrentProjectKey, setCurrentProjectKey } from './context';

// Определяем режим разработки на уровне API
const isDevMode = process.env.VITE_DEV_MODE === 'true' ||
    process.env.NODE_ENV === 'development' ||
    typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        !window.location.hostname.includes('atlassian')
    );

console.log(`🔧 JiraAPI: режим разработки = ${isDevMode}`);

export const JiraAPI = {
    async initialize(): Promise<boolean> {
        console.log(`🔧 Инициализация JiraAPI... (dev режим: ${isDevMode})`);
        await initializeContext();
        console.log('✅ JiraAPI готов к использованию');
        return true;
    },

    setCurrentProject(projectKey: string): string {
        return setCurrentProjectKey(projectKey);
    },

    getCurrentProject(): string | null {
        return getCurrentProjectKey();
    },

    async getProjectIssues(): Promise<ProjectIssuesResponse> {
        if (isDevMode) {
            console.log('🎭 Dev Mode: используем mock данные для issues');
            const { getMockData } = await import('./mock');
            return getMockData('getProjectIssues');
        }

        // В production используем реальные API
        const { getProjectIssues } = await import('./issues');
        return getProjectIssues();
    },

    async getProjectUsers(): Promise<ApiResponse<JiraUser[]>> {
        if (isDevMode) {
            console.log('🎭 Dev Mode: используем mock данные для users');
            const { getMockData } = await import('./mock');
            return getMockData('getProjectUsers');
        }

        const { getProjectUsers } = await import('./users');
        return getProjectUsers();
    },

    async getProjects(): Promise<ApiResponse<JiraProject[]>> {
        if (isDevMode) {
            console.log('🎭 Dev Mode: используем mock данные для projects');
            const { getMockData } = await import('./mock');
            return getMockData('getProjects');
        }

        const { getProjects } = await import('./projects');
        return getProjects();
    },

    async updateIssueAssignee(issueKey: string, accountId: string): Promise<ApiResponse<void>> {
        if (isDevMode) {
            console.log('🎭 Dev Mode: используем mock для updateIssueAssignee');
            const { getMockData } = await import('./mock');
            return getMockData('updateIssueAssignee', { issueKey, accountId });
        }

        const { updateIssueAssignee } = await import('./issues');
        return updateIssueAssignee(issueKey, accountId);
    },

    async updateIssuePriority(issueKey: string, priorityId: string): Promise<ApiResponse<void>> {
        if (isDevMode) {
            console.log('🎭 Dev Mode: используем mock для updateIssuePriority');
            const { getMockData } = await import('./mock');
            return getMockData('updateIssuePriority', { issueKey, priorityId });
        }

        const { updateIssuePriority } = await import('./issues');
        return updateIssuePriority(issueKey, priorityId);
    },

    async autoAssignUnassigned(): Promise<AutoAssignResponse> {
        if (isDevMode) {
            console.log('🎭 Dev Mode: используем mock для autoAssignUnassigned');
            const { getMockData } = await import('./mock');
            return getMockData('autoAssignUnassigned');
        }

        const { autoAssignUnassigned } = await import('./autoAssign');
        return autoAssignUnassigned();
    }
};
