import type { ApiResponse, JiraProject } from '../types/jira';
import { makeJiraRequest } from './client';
import { JiraProjectResponse } from './jiraDto';
import { getMockData } from './mock';

export const getProjects = async (): Promise<ApiResponse<JiraProject[]>> => {
    try {
        const data = await makeJiraRequest<JiraProjectResponse>('/rest/api/3/project/search?maxResults=50');

        const projects: JiraProject[] = data.values.map((project) => ({
            id: project.id,
            key: project.key,
            name: project.name,
            projectTypeKey: project.projectTypeKey
        }));

        return {
            success: true,
            data: projects
        };
    } catch (error) {
        console.error('❌ Ошибка получения проектов, используем mock данные:', error);
        return getMockData('getProjects') as ApiResponse<JiraProject[]>;
    }
};
