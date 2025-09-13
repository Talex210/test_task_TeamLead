import type { ApiResponse, JiraUser } from '../types/jira';
import { makeJiraRequest } from './client';
import { getCurrentProjectKey, initializeContext } from './context';
import { JiraUserResponse } from './jiraDto';
import { getMockData } from './mock';

export const getProjectUsers = async (): Promise<ApiResponse<JiraUser[]>> => {
    try {
        if (!getCurrentProjectKey()) {
            await initializeContext();
        }
        const projectKey = getCurrentProjectKey();

        const users = await makeJiraRequest<JiraUserResponse[]>(
            `/rest/api/3/user/assignable/search?project=${projectKey}&maxResults=50`
        );

        const formattedUsers: JiraUser[] = users.map((user) => ({
            accountId: user.accountId,
            displayName: user.displayName,
            emailAddress: user.emailAddress,
            avatarUrl: user.avatarUrls['24x24'],
            active: user.active
        }));

        return {
            success: true,
            data: formattedUsers
        };
    } catch (error) {
        console.error('❌ Ошибка получения пользователей, используем mock данные:', error);
        return getMockData('getProjectUsers') as ApiResponse<JiraUser[]>;
    }
};
