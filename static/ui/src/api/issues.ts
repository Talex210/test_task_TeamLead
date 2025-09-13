import type { ApiResponse, JiraIssue, ProjectIssuesResponse } from '../types/jira';
import { makeJiraRequest } from './client';
import { getCurrentProjectKey, initializeContext } from './context';
import { JiraSearchResponse } from './jiraDto';
import { getMockData } from './mock';

export const getProjectIssues = async (): Promise<ProjectIssuesResponse> => {
    try {
        if (!getCurrentProjectKey()) {
            await initializeContext();
        }

        const projectKey = getCurrentProjectKey();
        const jql = `project = ${projectKey} ORDER BY created DESC`;

        const data = await makeJiraRequest<JiraSearchResponse>('/rest/api/3/search', {
            method: 'POST',
            body: JSON.stringify({
                jql,
                fields: ['summary', 'status', 'assignee', 'priority', 'duedate', 'created', 'updated'],
                maxResults: 100
            })
        });

        const issues: JiraIssue[] = data.issues.map((issue) => ({
            id: issue.id,
            key: issue.key,
            summary: issue.fields.summary || '',
            status: issue.fields.status?.name || '',
            assignee: issue.fields.assignee
                ? {
                    accountId: issue.fields.assignee.accountId,
                    displayName: issue.fields.assignee.displayName,
                    emailAddress: issue.fields.assignee.emailAddress,
                    avatarUrl: issue.fields.assignee.avatarUrls['24x24'],
                    active: true
                }
                : null,
            priority: {
                name: issue.fields.priority?.name || 'Medium',
                id: issue.fields.priority?.id || '3'
            },
            duedate: issue.fields.duedate ?? null,
            created: issue.fields.created || '',
            updated: issue.fields.updated || ''
        }));

        return {
            success: true,
            data: issues,
            projectKey: projectKey || undefined
        };
    } catch (error) {
        console.error('❌ Ошибка получения задач, используем mock данные:', error);
        return getMockData('getProjectIssues') as ProjectIssuesResponse;
    }
};

export const updateIssueAssignee = async (issueKey: string, accountId: string): Promise<ApiResponse<void>> => {
    try {
        await makeJiraRequest(`/rest/api/3/issue/${issueKey}/assignee`, {
            method: 'PUT',
            body: JSON.stringify({
                accountId
            })
        });

        return {
            success: true,
            message: `Исполнитель назначен для задачи ${issueKey}`
        };
    } catch (error) {
        console.error('❌ Ошибка назначения исполнителя, используем mock:', error);
        return getMockData('updateIssueAssignee', { issueKey, accountId }) as ApiResponse<void>;
    }
};

export const updateIssuePriority = async (issueKey: string, priorityId: string): Promise<ApiResponse<void>> => {
    try {
        await makeJiraRequest(`/rest/api/3/issue/${issueKey}`, {
            method: 'PUT',
            body: JSON.stringify({
                fields: {
                    priority: { id: priorityId }
                }
            })
        });

        return {
            success: true,
            message: `Приоритет обновлен для задачи ${issueKey}`
        };
    } catch (error) {
        console.error('❌ Ошибка обновления приоритета, используем mock:', error);
        return getMockData('updateIssuePriority', { issueKey, priorityId }) as ApiResponse<void>;
    }
};
