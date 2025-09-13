import type { AutoAssignResponse } from '../types/jira';
import { makeJiraRequest } from './client';
import { getCurrentProjectKey, initializeContext } from './context';
import { JiraSearchResponse, JiraUserResponse } from './jiraDto';
import { getMockData } from './mock';

export const autoAssignUnassigned = async (): Promise<AutoAssignResponse> => {
    try {
        if (!getCurrentProjectKey()) {
            await initializeContext();
        }

        const projectKey = getCurrentProjectKey();

        // 1. Получаем задачи без исполнителя
        const issuesData = await makeJiraRequest<JiraSearchResponse>('/rest/api/3/search', {
            method: 'POST',
            body: JSON.stringify({
                jql: `project = ${projectKey} AND assignee is EMPTY`,
                fields: ['key'],
                maxResults: 50
            })
        });

        const unassignedIssues = issuesData.issues;

        if (unassignedIssues.length === 0) {
            return {
                success: true,
                message: 'Нет задач без исполнителя'
            };
        }

        // 2. Получаем всех пользователей проекта
        const users = await makeJiraRequest<JiraUserResponse[]>(
            `/rest/api/3/user/assignable/search?project=${projectKey}&maxResults=20`
        );

        // 3. Получаем все задачи проекта для подсчета активности
        const allIssuesData = await makeJiraRequest<JiraSearchResponse>('/rest/api/3/search', {
            method: 'POST',
            body: JSON.stringify({
                jql: `project = ${projectKey}`,
                fields: ['assignee'],
                maxResults: 200
            })
        });

        // 4. Определяем доступных пользователей и их оставшуюся емкость
        const MAX_TASKS_PER_USER = 2;

        type UserCap = {
            user: JiraUserResponse;
            remaining: number;
        };

        // Текущее количество задач на пользователя
        const currentAssignedCountByUser = new Map<string, number>();
        for (const issue of allIssuesData.issues) {
            const assignee = issue.fields.assignee;
            if (assignee?.accountId) {
                currentAssignedCountByUser.set(
                    assignee.accountId,
                    (currentAssignedCountByUser.get(assignee.accountId) ?? 0) + 1
                );
            }
        }

        // Собираем список доступных с расчетом остатка
        const availableUsers: UserCap[] = users
            .filter((user) => user.active)
            .map((user) => {
                const assignedCount = currentAssignedCountByUser.get(user.accountId) ?? 0;
                const remaining = Math.max(0, MAX_TASKS_PER_USER - assignedCount);
                return { user, remaining };
            })
            .filter((uc) => uc.remaining > 0);

        if (availableUsers.length === 0) {
            return {
                success: false,
                error: `Нет доступных пользователей для назначения (все достигли лимита ${MAX_TASKS_PER_USER})`
            };
        }

        // 5. Распределяем round-robin по пользователям с учетом остатка емкости
        const results: {
            issueKey: string;
            assignedTo?: string;
            success: boolean;
            error?: string;
        }[] = [];

        let userIndex = 0;

        const getNextAvailableIndex = (): number | null => {
            if (availableUsers.length === 0) return null;
            let attempts = 0;
            let idx = userIndex;
            while (attempts < availableUsers.length) {
                if (availableUsers[idx].remaining > 0) {
                    userIndex = (idx + 1) % availableUsers.length; // следующий старт
                    return idx;
                }
                idx = (idx + 1) % availableUsers.length;
                attempts++;
            }
            return null;
        };

        for (const issue of unassignedIssues) {
            const idx = getNextAvailableIndex();
            if (idx === null) {
                // Емкость всех исчерпана — прекращаем назначение оставшихся задач
                results.push({
                    issueKey: issue.key,
                    success: false,
                    error: 'Нет доступных разработчиков (достигнут лимит назначений)'
                });
                continue;
            }

            const target = availableUsers[idx];

            try {
                await makeJiraRequest(`/rest/api/3/issue/${issue.key}/assignee`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        accountId: target.user.accountId
                    })
                });

                // Успешно назначили — уменьшаем локальную емкость
                target.remaining -= 1;

                results.push({
                    issueKey: issue.key,
                    assignedTo: target.user.displayName,
                    success: true
                });
            } catch (error) {
                results.push({
                    issueKey: issue.key,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        const successCount = results.filter((r) => r.success).length;

        return {
            success: true,
            results,
            summary: `Назначено ${successCount} из ${unassignedIssues.length} задач с учетом лимита ${MAX_TASKS_PER_USER} на разработчика`
        };
    } catch (error) {
        console.error('❌ Ошибка массового назначения, используем mock:', error);
        return getMockData('autoAssignUnassigned') as AutoAssignResponse;
    }
};
