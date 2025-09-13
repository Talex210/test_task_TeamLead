import type { ApiResponse, JiraIssue, JiraProject, JiraUser, ProjectIssuesResponse, AutoAssignResponse } from '../types/jira';
import { initializeContext, getCurrentProjectKey, setCurrentProjectKey } from './context';
import { getProjectIssues } from './issues';
import { getProjectUsers } from './users';
import { getProjects } from './projects';
import { updateIssueAssignee, updateIssuePriority } from './issues';
import { autoAssignUnassigned } from './autoAssign';

export const JiraAPI = {
    async initialize(): Promise<boolean> {
        console.log('🔧 Инициализация JiraAPI...');
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
        return getProjectIssues();
    },

    async getProjectUsers(): Promise<ApiResponse<JiraUser[]>> {
        return getProjectUsers();
    },

    async getProjects(): Promise<ApiResponse<JiraProject[]>> {
        return getProjects();
    },

    async updateIssueAssignee(issueKey: string, accountId: string): Promise<ApiResponse<void>> {
        return updateIssueAssignee(issueKey, accountId);
    },

    async updateIssuePriority(issueKey: string, priorityId: string): Promise<ApiResponse<void>> {
        return updateIssuePriority(issueKey, priorityId);
    },

    async autoAssignUnassigned(): Promise<AutoAssignResponse> {
        return autoAssignUnassigned();
    }
};
